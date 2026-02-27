from nameko.rpc import rpc, RpcProxy
from common.utils import rbac_check, setup_logging, error_handler, get_rbac_check
from bson_serilizer.bson_serialization import serialize_result, custom_json_dumps  # type: ignore
from nameko_services.common.dependencies import MongoProvider, WorkerContextProvider
from nameko_services.common.DAO import FunnelDAO, SessionDAO, GroupDAO
import logging
from functools import wraps
from nameko.events import EventDispatcher
from datetime import datetime
from bson.objectid import ObjectId

logger = setup_logging('funnel_service', log_level=logging.INFO)

class FunnelService:
    name = 'funnel_service'
    mongo_provider = MongoProvider()
    dispatch = EventDispatcher()
    worker_ctx = WorkerContextProvider()
    profile_rpc = RpcProxy('profile_service_v1')
    
    @property
    def funnel_dao(self):
        return FunnelDAO(self.mongo_provider)

    @property
    def session_dao(self):
        return SessionDAO(self.mongo_provider)

    @property
    def group_dao(self):
        return GroupDAO(self.mongo_provider)


    def dispatch_event(event_type):
        """
        Decorator to dispatch an event after a method call if 'event_data' is present in the result.
        """
        def decorator(func):
            @wraps(func)
            def wrapper(self, *args, **kwargs):
                result = func(self, *args, **kwargs)
                if isinstance(result, dict) and 'event_data' in result:
                    print(result['event_data'])
                    self.dispatch(event_type, result['event_data'])
                return result
            return wrapper
        return decorator

    def format_due_date(self, due_date):
        """
        Helper function to format due_date correctly.
        Converts datetime objects to ISO 8601 strings and None to JSON null.
        """
        if due_date is None:
            return None
        elif isinstance(due_date, datetime):
            return due_date.isoformat()
        else:
            return due_date
    @rpc
    @error_handler
    @rbac_check(required_roles=['trainer'])
    @serialize_result
    def save_participants(self, user_id, data):
        if self.funnel_dao.is_participant_in_session(data):
            return {
                "message": "Participant already added to this session.",
                "status": 409
            }

        self.funnel_dao.save_participants(user_id, data)

        return {
            "message": "Participant saved successfully.",
            "status": 200
        }

    @rpc
    @error_handler
    @rbac_check(required_roles=['sub-admin', 'trainer'])
    @serialize_result
    def get_participants(self, user_id):
        try:
            participants = self.funnel_dao.get_enriched_participants_created_by_user(
                user_id, self.session_dao
            )
            return {
                "message": "Participants fetched successfully.",
                "status": 200,
                "data": participants
            }
        except ValueError as ve:
            return {
                "message": str(ve),
                "status": 400,
                "data": []
            }

    @rpc
    @error_handler
    @get_rbac_check(required_roles=['sub-admin'])
    @serialize_result
    def get_attempted_students(self, user_id, payload=None):
        """
        RPC method to fetch all students who have attempted sessions.
        Cross-checks 'groups' and 'funnel' collections.
        """
        try:
            print(f"--- DEBUG: get_attempted_students triggered for user_id: {user_id} ---")
            # 1. Fetch groups created by the sub-admin
            groups = self.group_dao.get_groups_by_user(user_id)
            print(f"DEBUG: Retrieved {len(groups) if groups else 0} groups.")
            if not groups:
                return {
                    "message": "No groups found for this user.",
                    "status": 200,
                    "data": []
                }

            # 2. Get all unique student IDs from the funnel collection along with their latest attendance datetime
            pipeline = [
                {"$group": {"_id": "$userId", "created_at": {"$max": "$created_at"}}}
            ]
            attended_users_info = list(self.funnel_dao.collection.aggregate(pipeline))
            attended_user_map = {str(item["_id"]): item.get("created_at") for item in attended_users_info}
            print(f"DEBUG: Found {len(attended_user_map)} unique attended users in funnel.")

            # 3. Fetch all participants from profile service to get name and phone
            # Using the logic from question_bank_generation.py
            try:
                profile_response = self.profile_rpc.get_participants()
                print(f"DEBUG: Fetched {len(profile_response) if profile_response else 0} participants from profile_service_v1.")
                # Create a map for quick lookup: userId string -> participant info
                user_info_map = {
                    str(p.get('_id')): {
                        "name": p.get('fullName') or p.get('username') or "Unknown",
                        "phone": p.get('phone') or "not updated in database",
                        "email": p.get('email') or "not updated in database"
                    }
                    for p in profile_response
                }
            except Exception as profile_err:
                logger.error(f"Failed to fetch profiles: {str(profile_err)}")
                print(f"DEBUG: Error fetching profiles: {str(profile_err)}")
                user_info_map = {}

            # 4. Process each student in each group
            result = []
            for group in groups:
                group_name = group.get('name', 'Unnamed Group')
                student_ids = group.get('studentIds', [])
                print(f"DEBUG: Processing group '{group_name}' with {len(student_ids)} students.")
                
                for student_id in student_ids:
                    student_id_str = str(student_id)
                    student_info = user_info_map.get(student_id_str, {})
                    
                    # Logic: present in funnel = Attended
                    status = "Attended" if student_id_str in attended_user_map else "Missed"
                    
                    student_record = {
                        "groupName": group_name,
                        "studentName": student_info.get('name', 'Unknown'),
                        "phone": student_info.get('phone', 'not updated in database'),
                        "email": student_info.get('email', 'not updated in database'),
                        "status": status
                    }
                    if status == "Attended" and attended_user_map.get(student_id_str):
                        student_record["created_at"] = self.format_due_date(attended_user_map[student_id_str])
                        
                    result.append(student_record)
            print(f"DEBUG: Final result generated with {len(result)} records.")
            return {
                "message": "Attempted students fetched successfully.",
                "status": 200,
                "data": result
            }
        except Exception as e:
            logger.exception("Error in get_attempted_students: %s", str(e))
            print(f"DEBUG: Exception in get_attempted_students: {str(e)}")
            return {
                "message": f"Failed to fetch attempted students: {str(e)}",
                "status": 500,
                "data": []
            }
    
    @rpc
    @error_handler
    @get_rbac_check(required_roles=['sub-admin', 'trainer'])
    @serialize_result
    def funnelling(self, user_id, payload):
        """
        Get all participants created by this trainer (user_id) who have been added
        to >= N different sessionIds. 'N' is payload["id"].
        """
        try:
            min_sessions = int(payload["query_params"]["id"])
        except (TypeError, ValueError):
            return {
                "message": "Invalid or missing 'id' in payload.",
                "status": 400
            }

        participants = self.funnel_dao.get_users_with_min_sessions(
            created_by=user_id,
            min_session_count=min_sessions,
            session_dao=self.session_dao
        )

        if not participants:
            return {
                "message": f"No participants attended {min_sessions} or more unique sessions.",
                "status": 404,
                "data": []
            }

        return {
            "message": f"Participants who attended {min_sessions} or more sessions fetched successfully.",
            "status": 200,
            "data": participants
        }





    @rpc
    @error_handler
    @rbac_check(required_roles=['sub-admin', 'trainer'])
    @serialize_result
    def save_group(self, user_id, data):
        self.group_dao.save_group(user_id, data)
        return {
            "message": "Group saved successfully.",
            "status": 201
        }

    @rpc
    @error_handler
    @get_rbac_check(required_roles=['sub-admin', 'trainer'])
    @serialize_result
    def get_groups(self, user_id, payload):
        roles = payload.get('roles', [])
        user_oid = ObjectId(user_id)
        if 'sub-admin' in roles:
            groups = self.group_dao.get_all_groups()
        else:
            groups = self.group_dao.get_groups_by_user(user_id)
        
        for group in groups:
            group['is_own_group'] = (group.get('created_by') == user_oid)
            
        return {
            "message": "Groups fetched successfully.",
            "status": 200,
            "data": groups
        }

    @rpc
    @error_handler
    @rbac_check(required_roles=['sub-admin', 'trainer'])
    @serialize_result
    def reassign_group(self, user_id, data):
        group_id = data.get('group_id')
        if not group_id:
            return {
                "message": "group_id is required.",
                "status": 400
            }
        try:
            self.group_dao.set_group_reassign_flag(user_id, group_id)
            return {
                "message": "Group flagged for reassignment successfully.",
                "status": 200
            }
        except Exception as e:
            return {
                "message": str(e),
                "status": 403
            }

    @rpc
    @error_handler
    @rbac_check(required_roles=['sub-admin'])
    @serialize_result
    def assign_trainer(self, user_id, data):
        group_id = data.get('groupId')
        trainer_id = data.get('trainerId')
        
        if not group_id or not trainer_id:
            return {
                "message": "groupId and trainerId are required.",
                "status": 400
            }
        
        # Fetch the group to check ownership
        group = self.group_dao.find_one({"_id": ObjectId(group_id)})
        if not group:
            return {
                "message": "Group not found.",
                "status": 404
            }
        
        created_by = group.get('created_by')
        is_own_group = (str(created_by) == str(user_id))
        
        if not is_own_group:
            # Not the creator — only allow if reassign flag is True
            if not group.get('reassign', False):
                return {
                    "message": "You can only assign a trainer to groups you created, unless the group is marked for reassignment.",
                    "status": 403
                }
            
        success = self.group_dao.assign_trainer(group_id, trainer_id)
        
        if not success:
            return {
                "message": "Failed to assign trainer. Group may already have a trainer assigned and is not marked for reassignment.",
                "status": 403
            }
            
        return {
            "message": "Trainer assigned successfully.",
            "status": 200
        }

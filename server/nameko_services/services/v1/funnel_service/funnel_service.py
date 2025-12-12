from nameko.rpc import rpc
from common.utils import rbac_check, setup_logging, error_handler, get_rbac_check
from bson_serilizer.bson_serialization import serialize_result, custom_json_dumps  # type: ignore
from nameko_services.common.dependencies import MongoProvider, WorkerContextProvider
from nameko_services.common.DAO import FunnelDAO, SessionDAO
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
    
    @property
    def funnel_dao(self):
        return FunnelDAO(self.mongo_provider)

    @property
    def session_dao(self):
        return SessionDAO(self.mongo_provider)


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
    @rbac_check(required_roles=['trainer'])
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
    @get_rbac_check(required_roles=['trainer'])
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





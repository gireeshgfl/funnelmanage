from nameko.rpc import rpc, RpcProxy
from common.utils import rbac_check, setup_logging, error_handler, get_rbac_check
from bson_serilizer.bson_serialization import serialize_result, custom_json_dumps  # type: ignore
from nameko_services.common.dependencies import MongoProvider, WorkerContextProvider, AmqpPublisher 
from nameko_services.common.DAO import SessionDAO, PointsDAO, QuestionDAO, BroadcastQuestionsDAO, FunnelDAO, InSessionQuestionsDAO, UserDAO
import logging
from functools import wraps
from nameko.events import EventDispatcher
from datetime import datetime
from bson.objectid import ObjectId

logger = setup_logging('session_service', log_level=logging.INFO)

class SessionService:
    name = 'session_service'
    mongo_provider = MongoProvider()
    dispatch = EventDispatcher()
    worker_ctx = WorkerContextProvider()
    amqp_publisher = AmqpPublisher()
    auth_rpc = RpcProxy('auth_service_fun') 
    
    @property
    def session_service_dao(self):
        return SessionDAO(self.mongo_provider)
    
    @property
    def points_dao(self):
        return PointsDAO(self.mongo_provider)
    
    @property
    def question_dao(self):
        return QuestionDAO(self.mongo_provider)
    
    @property
    def broadcast_questions_dao(self):
        return BroadcastQuestionsDAO(self.mongo_provider)
    
    @property
    def funnel_dao(self):
        return FunnelDAO(self.mongo_provider)
    
    @property
    def in_session_questions_dao(self):
        return InSessionQuestionsDAO(self.mongo_provider)
    
    @property
    def user_dao(self):
        return UserDAO(self.mongo_provider)


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
    def save_session(self, user_id, data):
        session_data = data
        session_data["created_by"] = ObjectId(user_id)
        session_data["created_at"] = datetime.utcnow()
        session_data["status"] = "Deactivate"

        session = self.session_service_dao.create_session(session_data)

        if session.get('_id'):
            return {
                "message": "Session created successfully",
                "data": session,
                "status": 200
            }
        else:
            return {
                "message": "Failed to create session",
                "status": 500
            }


    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer', 'sub-admin'])
    @serialize_result
    def get_sessions(self, user_id, payload):
        roles = payload.get('roles', [])
        if 'sub-admin' in roles:
            result = self.session_service_dao.get_sessions()
        else:
            result = self.session_service_dao.get_sessions_by_user(user_id)
        if result:
            response = {
                "message": "Session(s) fetched successfully",
                "data": result,
                "status": 200
            }
        else:
            response = {
                "message": "Session not found",
                "status": 204
            }
        return response

    @rpc
    @error_handler
    @rbac_check(required_roles=['trainer'])
    @serialize_result
    def update_session(self, user_id, data):

        # Check if the data includes an '_id'
        if not data.get("_id"):
            return {"message": "Session ID is required in data", "status": 400}

        # Extract the session ID and remove it from the update data
        session_id = data.pop("_id")
        
        # If the incoming data has status set to "Activate", add a new field 'archive_eligibility' with the value "True"
        if data.get("status") == "Activate":
            data["archive_eligibility"] = "True"

        # Perform the update operation in the DAO
        result = self.session_service_dao.update_session(session_id, data)

        # If update_session in the DAO returned None (e.g., invalid ID), handle it:
        if result is None:
            return {"message": "Invalid session ID format.", "status": 400}
        
        # After update, fetch the updated session document
        updated_session = self.session_service_dao.get_session_by_id(session_id)
        
        # Determine the response based on the update result:
        if result and result.modified_count > 0:
            message = "Session updated successfully"
            if updated_session.get("status") == "ENDED":
                message = "Session ended successfully"
            
            return {
                "message": message,
                "data": updated_session,  # Return the updated document
                "status": 200
            }
        elif result and result.matched_count > 0:
            # If the document was found but no change occurred, still return the document
            return {
                "message": "No changes were made to the session",
                "data": updated_session,
                "status": 200
            }
        else:
            return {
                "message": "Session update failed. No matching session found.",
                "status": 404
            }

        
    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer'])
    @serialize_result
    def delete_session(self, user_id, payload):

        session_id = payload.get("query_params", {}).get('id')

        result = self.session_service_dao.delete_session(session_id)
        if result.deleted_count == 1:
            return {
                "message": "Session deleted successfully",
                "status": 200
            }
        else:
            return {
                "message": "Session not found",
                "status": 404
            }

    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer'])
    @serialize_result
    def get_question_topics(self, user_id, payload):
        session_id = payload.get("query_params", {}).get('id')
        topics = self.session_service_dao.get_question_topics(session_id)
        return {
            "message": "Question topics fetched successfully",
            "data": topics,
            "status": 200
        }
    
    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer', 'student'])
    @serialize_result
    def get_session_status(self, user_id, payload):
        """
        RPC method to fetch the status of a session.
        Expects the session ID to be provided in payload['query_params']['id'].
        """
        session_id = payload.get("query_params", {}).get("id")
        if not session_id:
            return {
                "message": "Session ID is required",
                "status": 400
            }
        
        status = self.session_service_dao.get_session_status(session_id)
        if status is not None:
            return {
                "message": "Session status fetched successfully",
                "data": status,
                "status": 200
            }
        else:
            return {
                "message": "Session not found",
                "status": 404
            }

    
    @rpc
    @error_handler
    @rbac_check(required_roles=['student'])
    @serialize_result
    def save_points(self, user_id, data):
        # Step 1: Convert questionId to ObjectId
        question_id = ObjectId(data['questionId'])

        # Step 2: Get question document from DAO
        question = self.question_dao.get_question_by_id(question_id)
        if not question:
            return {
                "status": 404,
                "message": "Question not found",
                "data": {}
            }

        # Step 3: Validate points array and selected index
        if 'points' not in question or not (0 <= data['selectedAnswerIndex'] < len(question['points'])):
            return {
                "status": 400,
                "message": "Invalid answer index or points not defined",
                "data": {}
            }

        # Step 4: Check if answer already submitted
        existing_answer = self.points_dao.check_existing_answer(user_id, question_id)
        if existing_answer:
            return {
                "status": 409,
                "message": "Points Already allocated",
                "data": {}
            }

        # Step 5: Determine answer status
        selected_index = data['selectedAnswerIndex']
        correct_index = question['correctAnswerIndex']
        answer_status = "Correct Answer" if selected_index == correct_index else "Incorrect Answer"

        # Step 6: Calculate points
        points_earned = question['points'][selected_index]

        # Step 7: Get answer texts
        selected_answer_text = question['answers'][selected_index]
        correct_answer_text = question['answers'][correct_index]

        # Step 8: Prepare data to save
        points_data = {
            **data,
            "questionId": question_id,
            "pointsEarned": points_earned,
            "answerStatus": answer_status,
            "studentUserId": ObjectId(user_id),
            "selectedAnswerText": selected_answer_text,
            "correctAnswerText": correct_answer_text
        }

        # Step 9: Save to DB via DAO
        result = self.points_dao.create_points(points_data)

        # Step 10: Return enriched response
        return {
            "status": 200,
            "message": f"{answer_status}. Points saved successfully",
            "data": {
                "id": str(result['_id']),
                "pointsEarned": points_earned,
                "selectedAnswerText": selected_answer_text,
                "correctAnswerText": correct_answer_text
            }
        }

    @rpc
    @error_handler
    @rbac_check(required_roles=['student'])
    @serialize_result
    def save_session_points(self, user_id, data):
        # Step 1: Convert questionId to ObjectId
        try:
            question_id = ObjectId(data['questionId'])
        except Exception:
             return {
                "status": 400,
                "message": "Invalid question ID format",
                "data": {}
            }

        # Step 2: Get question document from InSessionQuestionsDAO
        question = self.in_session_questions_dao.get_question_by_id(question_id)
        if not question:
            return {
                "status": 404,
                "message": "Question not found",
                "data": {}
            }

        # Step 3: Validate answers array and selected index
        answers = question.get('answers', [])
        selected_index = data.get('selectedAnswerIndex')
        
        if selected_index is None or not (0 <= selected_index < len(answers)):
            return {
                "status": 400,
                "message": "Invalid answer index",
                "data": {}
            }

        # Step 4: Check if answer already submitted
        existing_answer = self.points_dao.check_existing_answer(user_id, question_id)
        if existing_answer:
            return {
                "status": 409,
                "message": "Points Already allocated",
                "data": {}
            }

        # Step 5: Determine answer status and points
        selected_answer = answers[selected_index]
        # answers structure: { "text": "...", "points": 10, "isCorrect": true/false }
        
        points_earned = selected_answer.get('points', 0)
        is_correct = selected_answer.get('isCorrect', False)
        answer_status = "Correct Answer" if is_correct else "Incorrect Answer"
        selected_answer_text = selected_answer.get('text', "")

        # Find correct answer text
        correct_answer_text = ""
        for ans in answers:
            if ans.get('isCorrect'):
                correct_answer_text = ans.get('text', "")
                break

        # Step 6: Prepare data to save
        points_data = {
            **data,
            "questionId": question_id,
            "pointsEarned": points_earned,
            "answerStatus": answer_status,
            "studentUserId": ObjectId(user_id),
            "selectedAnswerText": selected_answer_text,
            "correctAnswerText": correct_answer_text
        }

        # Step 7: Save to DB via DAO
        result = self.points_dao.create_points(points_data)

        # Step 8: Return enriched response
        return {
            "status": 200,
            "message": f"{answer_status}. Points saved successfully",
            "data": {
                "id": str(result['_id']),
                "pointsEarned": points_earned,
                "selectedAnswerText": selected_answer_text,
                "correctAnswerText": correct_answer_text
            }
        }
    
    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer', 'student'])
    @serialize_result
    def get_points(self, user_id, payload):
        # Aggregate total points for the user
        result = self.points_dao.get_total_points_by_user(user_id)
        total_points = result[0]["totalPoints"] if result else 0

        # Get one record to extract the sessionId
        session_record = self.points_dao.get_session_by_user(user_id)
        session_id = session_record.get("sessionId") if session_record else None

        # Prepare response
        response = {
            "status": "success",
            "message": "Points fetched successfully",
            "pointsEarned": total_points,
            "studentId": user_id,
            "sessionId": session_id,
            "status": 200
        }

        # --- Publish the points to RabbitMQ ---
        payload = {
            "studentId": user_id,
            "sessionId": session_id,
            "pointsEarned": total_points,
            "timestamp": datetime.utcnow().isoformat()
        }
        print(f"Publishing to RabbitMQ: {payload} (queue: 'points')")
        success = self.amqp_publisher.publish(payload, queue_name="points")

        if success:
            print(f"Published points for student {user_id} to queue 'points'")
        else:
            print(f"Failed to publish points for student {user_id}")

        return response

    @rpc
    @error_handler
    @serialize_result
    def get_student_points(self):
        result = self.points_dao.get_all_students_points()
        return {
            "status": "success",
            "message": "Student points fetched successfully",
            "data": result,
            "status": 200
        }
    
    @rpc
    @error_handler
    @rbac_check(required_roles=['trainer'])
    @serialize_result
    def save_pushed_questions(self, user_id, data):
        """
        RPC method to save a broadcast (pushed) question.
        
        Expected 'data' structure:
        {
            "question": "Your question text here",
            "options": ["option1", "option2", ...],
            "correctAnswerIndex": 0,  # index of the correct answer in the options list
            ...  # any additional fields as needed
        }
        
        The method attaches metadata such as 'created_by' and 'created_at'.
        """
        # Attach metadata to the incoming data
        question_data = data.copy()  # work on a copy so that the original is not modified
        question_data["created_by"] = ObjectId(user_id)
        question_data["created_at"] = datetime.utcnow()
        question_data["broadcast_status"] = "pushed"
        
        # Save the question using the BroadcastQuestionsDAO
        result = self.broadcast_questions_dao.create_broadcast_question(question_data)
        
        if result.get('_id'):
            return {
                "message": "Broadcast question saved successfully",
                "data": result,
                "status": 200
            }
        else:
            return {
                "message": "Failed to save broadcast question",
                "status": 500
            }
        
    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer'])
    @serialize_result
    def get_pushed_questions(self, user_id, payload):
        """
        RPC method to fetch all pushed broadcast questions associated with a given session.

        Expected 'payload' structure:
        {
            "query_params": {
                "id": "<session_id>"
            }
        }
        """
        # Fetch session_id from the payload query parameters
        session_id = payload.get("query_params", {}).get("id")
        if not session_id:
            return {
                "message": "Session ID is required",
                "status": 400
            }
        
        # Use the BroadcastQuestionsDAO to fetch questions for the session.
        questions = self.broadcast_questions_dao.get_pushed_questions(session_id)
        
        if questions:
            return {
                "message": "Pushed questions fetched successfully",
                "data": questions,
                "status": 200
            }
        else:
            return {
                "message": "No pushed questions found",
                "data": [],
                "status": 404
            }

    @rpc
    @error_handler
    @rbac_check(required_roles=['trainer'])
    @serialize_result
    def save_mcq(self, user_id, data):

        mcq_array = data.get('mcqArray', [])
        session_id = data.get('sessionId')
        
        if not mcq_array:
            return {"message": "No MCQ questions provided", "status": 400}
        
        if not session_id:
            return {"message": "Session ID is required", "status": 400}
        
        # Delegate to DAO
        result = self.in_session_questions_dao.bulk_create_mcqs(mcq_array, session_id, user_id)
        
        saved_count = result["saved_count"]
        failed_count = result["failed_count"]
        saved_ids = result.get("saved_ids", [])
        
        if saved_count > 0:
            message = f"Successfully saved {saved_count} MCQ(s)"
            if failed_count > 0:
                message += f", {failed_count} failed"
            return {"message": message, "data": saved_ids, "status": 200}
        else:
            return {"message": "Failed to save MCQs", "status": 500}
    
    @rpc
    @error_handler
    @rbac_check(required_roles=['trainer'])
    @serialize_result
    def add_participants(self, user_id, data):
        """
        RPC method to add multiple participants into the system via UserDAO.
        Adds duplicate check: if email already exists, append new sessionId.
        """

        emails = data.get("emails", [])
        session_id = data.get("sessionId")

        if not emails or not session_id:
            return {
                "message": "sessionId and at least one email are required",
                "status": 400
            }

        participants = []
        updated_participants = []

        for email in emails:
            existing_user = self.user_dao.find_user_by_email(email)

            if existing_user:
                # Ensure backward compatibility if old schema has "sessionId"
                if "sessionIds" not in existing_user:
                    existing_user["sessionIds"] = []
                    if "sessionId" in existing_user:
                        existing_user["sessionIds"].append(existing_user["sessionId"])
                        # migrate old field -> new array
                        self.user_dao.update_one(
                            {"_id": existing_user["_id"]},
                            {
                                "$set": {"sessionIds": existing_user["sessionIds"]},
                                "$unset": {"sessionId": ""}
                            }
                        )

                # Add new session if not already present
                self.user_dao.update_one(
                    {"_id": existing_user["_id"]},
                    {"$addToSet": {"sessionIds": session_id}}
                )
                if session_id not in existing_user["sessionIds"]:
                    existing_user["sessionIds"].append(session_id)

                updated_participants.append(existing_user)

            else:
                participant_data = {
                    "sessionIds": [session_id],
                    "email": email,
                    "roles": ["student"],
                    "accountType": "temporary",
                    "added_by": ObjectId(user_id),
                    "added_at": datetime.utcnow()
                }
                result = self.user_dao.create_user(participant_data)
                if result.get("_id"):
                    participants.append(result)

        if participants or updated_participants:
            return {
                "message": (
                    f"{len(participants)} new participant(s) added, "
                    f"{len(updated_participants)} existing participant(s) updated"
                ),
                "data": {
                    "new": participants,
                    "updated": updated_participants
                },
                "status": 200
            }

        return {
            "message": "No participants were added or updated",
            "status": 500
        }


    @rpc
    @error_handler
    @rbac_check(required_roles=['student'])
    @serialize_result
    def get_participant_sessions(self, user_id, data=None):
        """
        Fetch all session details assigned to a temporary participant.
        """

        session_ids = self.user_dao.get_assigned_sessions(user_id)

        if not session_ids:
            return {
                "message": "No sessions assigned to this participant",
                "data": [],
                "status": 200
            }

        # Ensure ObjectIds (in case sessionIds are stored as strings)
        session_obj_ids = [ObjectId(sid) for sid in session_ids if ObjectId.is_valid(sid)]

        sessions = self.session_service_dao.find_many(
            {"_id": {"$in": session_obj_ids}},
            projection={"sessionName": 1, "createdBy": 1}
        )

        if sessions:
            return {
                "message": "Assigned sessions fetched successfully",
                "data": sessions,
                "status": 200
            }
        else:
            return {
                "message": "No valid sessions found for this participant",
                "data": [],
                "status": 200
            }

    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer'])
    @serialize_result
    def get_sessions_with_questions(self, user_id, payload):
        # Step 1: Get unique session IDs from InSessionQuestionsDAO
        session_ids = self.in_session_questions_dao.get_unique_session_ids(user_id)
        
        if not session_ids:
            return {
                "message": "No sessions with questions found",
                "data": [],
                "status": 200
            }

        # Step 2: Convert session IDs to ObjectIds
        try:
            session_obj_ids = [ObjectId(sid) for sid in session_ids]
        except Exception:
             return {
                "message": "Invalid session ID format found",
                "status": 500
            }

        # Step 3: Fetch session details from SessionDAO
        sessions = self.session_service_dao.find_many(
            {"_id": {"$in": session_obj_ids}}
        )

        return {
            "message": "Sessions with questions fetched successfully",
            "data": list(sessions),
            "status": 200
        }

    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer'])
    @serialize_result
    def get_in_session_questions(self, user_id, payload):
        session_id = payload.get("query_params", {}).get("id")
        
        if not session_id:
            return {
                "message": "Session ID is required",
                "status": 400
            }

        questions = self.in_session_questions_dao.get_questions_by_session_id(session_id)
        
        return {
            "message": "In-session questions fetched successfully",
            "data": questions,
            "status": 200
        }


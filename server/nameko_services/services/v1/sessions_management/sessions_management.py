from nameko.rpc import rpc
from common.utils import rbac_check, setup_logging, error_handler, get_rbac_check
from bson_serilizer.bson_serialization import serialize_result, custom_json_dumps  # type: ignore
from common.dependencies import MongoProvider, WorkerContextProvider
from common.DAO import SessionDAO, PointsDAO, QuestionDAO, BroadcastQuestionsDAO
import logging
from functools import wraps
from nameko.events import EventDispatcher
from datetime import datetime
from bson.objectid import ObjectId

logger = setup_logging('session_service', log_level=logging.ERROR)

class SessionService:
    name = 'session_service'
    mongo_provider = MongoProvider()
    dispatch = EventDispatcher()
    worker_ctx = WorkerContextProvider()
    
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
    @get_rbac_check(required_roles=['trainer'])
    @serialize_result
    def get_sessions(self, user_id, payload):
        result = self.session_service_dao.get_sessions_by_user(user_id)
        if result:
            return {
                "message": "Session(s) fetched successfully",
                "data": result,
                "status": 200
            }
        else:
            return {
                "message": "Session not found",
                "status": 404
            }

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
            return {
                "message": "Session updated successfully",
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
        print(status)
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
        
        # Convert questionId to ObjectId
        question_id = ObjectId(data['questionId'])
        
        # Retrieve the question using QuestionDAO
        question = self.question_dao.get_question_by_id(question_id)
        if not question:
            return {
                "status": 404,
                "message": "Question not found",
                "data": {}
            }
        
        # Validate that the question has a points array and that the selectedAnswerIndex is valid
        if 'points' not in question or not (0 <= data['selectedAnswerIndex'] < len(question['points'])):
            return {
                "status": 400,
                "message": "Invalid answer index or points not defined",
                "data": {}
            }
        
        # Check if the student has already answered this question
        existing_answer = self.points_dao.find_one({
            "questionId": question_id,
            "studentUserId": ObjectId(user_id)
        })
        if existing_answer:
            existing_answer_status = existing_answer.get("answerStatus", "Answer")
            return {
                "status": 409,
                "message": "Points Already allocated",
            }
        
        # Determine if the answer is correct
        if data['selectedAnswerIndex'] == question.get('correctAnswerIndex'):
            answer_status = "Correct Answer"
        else:
            answer_status = "Incorrect Answer"
        
        # Calculate the points earned from the answer
        points_earned = question['points'][data['selectedAnswerIndex']]
        
        # Build the data to be saved. Note that questionId and studentUserId are stored as ObjectId for DB operations.
        points_data = {
            **data,
            "questionId": question_id,
            "pointsEarned": points_earned,
            "answerStatus": answer_status,
            "studentUserId": ObjectId(user_id)
        }
        
        # Save the points record using PointsDAO
        result = self.points_dao.create_points(points_data)
        
        # Return response with numeric status and id as a string.
        return {
            "status": 200,
            "message": f"{answer_status}. Points saved successfully",
            "data": {
                "id": str(result['_id']),
                "pointsEarned": points_earned
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

        return {
            "status": "success",
            "message": "Points fetched successfully",
            "pointsEarned": total_points,
            "studentId": user_id,
            "sessionId": session_id,
            "status": 200  # This could be renamed to something like "code" to avoid duplicate key issues
        }


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

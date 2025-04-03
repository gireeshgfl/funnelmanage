from nameko.rpc import rpc
from datetime import datetime
from bson import ObjectId
from common.utils import rbac_check, setup_logging, error_handler, get_rbac_check
from bson_serilizer.bson_serialization import serialize_result, custom_json_dumps  # type: ignore
from common.dependencies import MongoProvider, WorkerContextProvider
from common.DAO import QuestionDAO, ApprovalDAO, TopicDAO
import logging
from functools import wraps
from nameko.events import EventDispatcher
from nameko.rpc import RpcProxy

logger = setup_logging('question_service', log_level=logging.INFO)

class QuestionService:
    name = 'question_service'
    mongo_provider = MongoProvider()
    dispatch = EventDispatcher()
    worker_ctx = WorkerContextProvider()
    profile_rpc = RpcProxy('profile_service')  # Proxy for calling profile_service

    @property
    def question_dao(self):
        # Initialize the QuestionDAO with the Mongo connection.
        return QuestionDAO(self.mongo_provider)
    
    @property
    def topic_dao(self):
        return TopicDAO(self.mongo_provider)

    @property
    def approval_dao(self):
        # Initialize the ApprovalDAO if you use approval requests for questions.
        return ApprovalDAO(self.mongo_provider)

    def dispatch_event(event_type):
        """Decorator to dispatch an event if the method returns a dict with 'data'."""
        def decorator(func):
            @wraps(func)
            def wrapper(self, *args, **kwargs):
                result = func(self, *args, **kwargs)
                if isinstance(result, dict) and 'data' in result:
                    # Dispatch the event with the result data.
                    self.dispatch(event_type, result)
                return result
            return wrapper
        return decorator
    

    @rpc
    @error_handler
    @rbac_check(required_roles=['trainer'])
    @serialize_result
    def save_questions(self, user_id, data):
        """
        Create a new question.
        If the question status is 'pending', an approval request will be created.
        """
        data['created_by'] = ObjectId(user_id)
        data['created_at'] = datetime.utcnow()
        question = self.question_dao.create_question(data)
        if question:
            if data.get('status') == 'pending':
                approval_request_id = self.approval_dao.create_approval_request(
                    self.approval_dao.ApprovalType.QUESTION,
                    question['_id'],
                    user_id,
                    {'question_text': question.get('text', '')}
                )
                return {
                    'message': "Question creation request submitted successfully",
                    'status': 200,
                    'data': question,
                    "require_email": False,
                    "require_notification": True,
                    'recipient': 'student',
                    'user_ids': [user_id],
                }
            return {'message': "Question created successfully", 'data': question, 'status': 200}
        else:
            return {'message': "Failed to create question", 'status': 500}

    @rpc
    @error_handler
    @rbac_check(required_roles=['trainer'])
    @serialize_result
    def update_question(self, user_id, data):
        """
        Update an existing question.
        Only the creator (or an admin) may update the question.
        """
        question_id = data.get('_id')
        if not question_id:
            return {'message': 'Question ID not provided', 'status': 400}

        question = self.question_dao.get_question_by_id(question_id)
        if not question or str(question.get('created_by')) != user_id:
            return {'message': 'Question not found or permission denied', 'status': 404}

        data.pop('_id', None)
        
        data['updated_at'] = datetime.utcnow()
        result = self.question_dao.update_question(question_id, data)
        
        if result.modified_count > 0:
            updated_question = self.question_dao.get_question_by_id(question_id)
            return {'message': "Question updated successfully", 'data': updated_question, 'status': 200}
        else:
            return {'message': "No changes made", 'status': 200}

    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer'])
    @serialize_result
    def delete_question(self, user_id, payload):
        """
        Delete a question.
        Only the creator (or an admin) may delete the question.
        """
        question_id = payload.get("query_params", {}).get('id')
        print(question_id)
        question = self.question_dao.get_question_by_id(question_id)
        
        if not question or str(question.get('created_by')) != user_id:
            return {'message': 'Question not found or permission denied', 'status': 404}

        result = self.question_dao.delete_question(question_id)
        
        if result.deleted_count > 0:
            return {'message': "Question deleted successfully", 'data': question_id, 'status': 200}
        else:
            return {'message': "Failed to delete question", 'status': 400}

    @rpc
    @error_handler
    @serialize_result
    @get_rbac_check(required_roles=['trainer'])
    def get_questions(self, user_id, payload):
        # Extract topicId from the query parameters
        topic_id = payload.get("query_params", {}).get("id")
        
        # If no topicId is provided, return an error message without fetching any questions
        if not topic_id:
            return {
                'message': "topicId is required to fetch questions",
                'data': [],
                'status': 400
            }
        
        # Since your MongoDB schema stores topicId as a string, use it directly in your query.
        query = {'topicId': topic_id}
        
        # Debug: Log the query if needed
        # print("Querying questions with:", query)
        
        questions = self.question_dao.find_questions(query)
        
        # If no questions are found, return a message
        if not questions:
            return {'message': "No questions found", 'data': [], 'status': 200}
        
        # Convert ObjectId fields to strings for proper serialization
        for question in questions:
            question['_id'] = str(question['_id'])
            # No need to convert topicId since it is already a string

        return {'message': "Questions fetched successfully", 'data': questions, 'status': 200}
    
    @rpc
    @error_handler
    @serialize_result
    @rbac_check(required_roles=['super-admin'])
    @dispatch_event("question_approved")
    def approve_question(self, user_id, data):
        """
        Approve a pending question.
        This creates an approval request if the question is still pending.
        """
        question_id = data.get('questionId')
        question = self.question_dao.get_question_by_id(question_id)
        if question:
            if question.get('status') == 'pending':
                approval_request_id = self.approval_dao.create_approval_request(
                    self.approval_dao.ApprovalType.QUESTION,
                    question['_id'],
                    user_id,
                    {'question_text': question.get('text', '')}
                )
                return {
                    'message': "Question approval request submitted successfully",
                    'status': 200,
                    'data': question,
                    "require_email": False,
                    "require_notification": True,
                    'recipient': 'student',
                    'user_ids': [user_id],
                }
            else:
                return {'message': "Question is already approved or not pending", 'status': 400}
        else:
            return {'message': "Question not found", 'status': 404}
        
    @rpc
    @error_handler
    @rbac_check(required_roles=['trainer'])
    @serialize_result
    def save_topic(self, user_id, data):
        data['created_by'] = ObjectId(user_id)
        data['created_at'] = datetime.utcnow()
        topic = self.topic_dao.create_topic(data)
        if topic:
            return {'message': "Topic created successfully", 'data': topic, 'status': 200}
        else:
            return {'message': "Failed to create topic", 'status': 500}

    @rpc
    @error_handler
    @rbac_check(required_roles=['trainer'])
    @serialize_result
    def get_topics(self, user_id):
        """
        Fetch topics where both user_id and created_by match the provided user_id.
        """

        query = {
            "user_id": user_id,
            "created_by": ObjectId(user_id)
        }
        
        topics = self.topic_dao.find_topics(query)
        
        for topic in topics:
            topic['_id'] = str(topic['_id'])
        
        if not topics:
            return {'message': "No topics found", 'data': None, 'status': 200}
        
        return {'message': "Topics fetched successfully", 'data': topics, 'status': 200}

    @rpc
    @error_handler
    @rbac_check(required_roles=['trainer'])
    @serialize_result
    def update_topic(self, user_id, data):
        topic_id = data.get('_id')
        if not topic_id:
            return {'message': 'Topic ID not provided', 'status': 400}

        topic = self.topic_dao.get_topic_by_id(topic_id)
        if not topic or str(topic.get('created_by')) != user_id:
            return {'message': 'Topic not found or permission denied', 'status': 404}
        
        # Ensure timestamp update
        data['updated_at'] = datetime.utcnow()

        # Call update function
        result = self.topic_dao.update_topic(topic_id, data)

        if result.modified_count > 0:
            updated_topic = self.topic_dao.get_topic_by_id(topic_id)
            return {'message': "Topic updated successfully", 'data': updated_topic, 'status': 200}
        else:
            return {'message': "No changes made", 'status': 200}

    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer'])
    @serialize_result
    def delete_topic(self, user_id, payload):
        # Extract topic_id properly
        topic_id = payload.get("query_params", {}).get("id")

        if not topic_id:
            return {'message': 'Topic ID is required', 'status': 400}

        # Convert topic_id to ObjectId
        try:
            topic_id = ObjectId(topic_id)
        except Exception:
            return {'message': 'Invalid Topic ID', 'status': 400}

        # Fetch the topic from the database
        topic = self.topic_dao.get_topic_by_id(topic_id)
        if not topic:
            return {'message': 'Topic not found', 'status': 404}

        # Check if the user has permission to delete
        if str(topic.get('created_by')) != str(user_id):
            return {'message': 'Permission denied', 'status': 403}

        # Delete the topic
        result = self.topic_dao.delete_topic(topic_id)
        
        # Check deletion result
        if result.deleted_count > 0:
            return {'message': "Topic deleted successfully", 'data': str(topic_id), 'status': 200}
        else:
            return {'message': "Failed to delete topic", 'status': 400}
    @rpc
    def get_participants(self, user_id):
        try:
            # Fetch the participant data from RPC
            response = self.profile_rpc.get_participants()  # Call remote RPC method

            # Directly separate the participants within this method
            trainers = []
            students = []
            others = []

            for participant in response:
                email = participant.get('email', '').lower()  # Get email and convert to lowercase
                if 'trainer' in email:
                    trainers.append(participant)
                elif 'student' in email:
                    students.append(participant)
                else:
                    others.append(participant)

            # Log the separated lists
            logger.info(f"Trainers: {trainers}")
            logger.info(f"Students: {students}")
            logger.info(f"Others: {others}")

            # Return response in requested format
            return {
                "status": 200,
                "data": {
                    "trainers": trainers,
                    "students": students,
                    "others": others
                },
                "message": "Participants Fetched"
            }

        except Exception as e:
            logger.error(f"Failed to fetch profiles: {str(e)}")
            return {
                "status": 500,
                "data": {
                    "trainers": [],
                    "students": [],
                    "others": []
                },
                "message": "Failed to fetch participants"
            }

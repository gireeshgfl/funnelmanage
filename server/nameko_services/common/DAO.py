"""
DAO Modules for Application Data Operations

This file contains various Data Access Objects (DAOs) for handling user authentication,
tokens, OTPs, approvals, questions, sessions, media, super-admin operations, topics, and points.
Each class is responsible for interacting with a specific MongoDB collection.

Note:
- The BaseDAO class (imported from common.BaseClassDAO) should provide common CRUD methods such as
  find_one, find_many, insert_one, update_one, and delete_one.
- The decorators serialize_result and deserialize_args are used to help with BSON serialization.
"""

# ------------------------------
# Import Required Modules
# ------------------------------
from bson import ObjectId
from datetime import datetime
from common.BaseClassDAO import BaseDAO
from enum import Enum
import pymongo
from bson_serilizer.bson_serialization import serialize_result, deserialize_args  # type: ignore
from fastapi.encoders import jsonable_encoder
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT
from pymongo import ReturnDocument

# ------------------------------
# Auth Service DAO Module
# Handles user-related operations.
# ------------------------------
class UserDAO(BaseDAO):
    def __init__(self, db_connection):
        """
        Initialize UserDAO with a database connection and set the collection name to 'users'.
        """
        super().__init__(db_connection, 'users')

    def find_users(self):
        """Retrieve all users."""
        return self.find_many({})

    @deserialize_args
    def create_user(self, user_data):
        """
        Insert a new user document into the collection.
        Adds the inserted _id to the user_data before returning.
        """
        result = self.insert_one(user_data)
        user_data['_id'] = result.inserted_id
        return user_data

    def find_user_by_username(self, username):
        """Find a user by their username."""
        return self.find_one({'username': username})

    def find_user_by_email(self, email):
        """Find a user by their email."""
        return self.find_one({'email': email})

    def find_user_by_user_id(self, user_id):
        """Find a user by their ObjectId (as a string or ObjectId)."""
        return self.find_one({'_id': ObjectId(user_id)})
    
    @serialize_result
    def find_email_by_user_id(self, user_id):
        """
        Retrieve only the email field for a given user id.
        """
        projection = {"email": 1}
        return self.find_one({'_id': ObjectId(user_id)}, projection=projection)
    
    def find_student_by_institute(self, institute_id):
        """
        Find all students associated with a given institute.
        Uses a projection to only return email, _id, and username.
        """
        projection = {
            "email": 1,  
            "_id": 1,
            "username": 1
        }
        return self.find_many({"institute_id": ObjectId(institute_id)}, projection=projection)

    def update_user_password(self, email, new_hashed_password):
        """
        Update the password for a user identified by email.
        """
        return self.update_one(
            {'email': email},
            {'$set': {'password': new_hashed_password}}
        )

    def find_mentors(self):
        """
        Find users with the 'mentor' role that also have personal_info populated.
        Returns only the personal_info field.
        """
        query = {
            "roles": {"$in": ["mentor"]},
            "personal_info": {"$exists": True, "$ne": None}
        }
        projection = {"personal_info": 1}
        return self.find_many(query, projection)

    def push_notification(self, user_id, notification_id):
        """
        Add a notification to a user's notifications array.
        """
        print(user_id, notification_id)
        return self.update_one(
            {'_id': ObjectId(user_id)},
            {'$addToSet': {'notifications': ObjectId(notification_id)}}
        )

    def push_activity(self, user_id, activity_id):
        """
        Push an activity ID to the user's activities list.
        """
        return self.update_one(
            {'_id': ObjectId(user_id)},
            {'$push': {'user_activities': ObjectId(activity_id)}}
        )
    
    def get_notification_ids(self, user_id):
        """
        Retrieve all notification IDs for a given user.
        """
        result = self.find_one(
            {'_id': ObjectId(user_id)},
            {'notifications': 1, '_id': 0}
        )
        return result.get('notifications', []) if result else []  

    def get_activity_ids(self, user_id):
        """
        Retrieve all activity IDs for a given user.
        """
        result = self.find_one(
            {'_id': ObjectId(user_id)},
            {'user_activities': 1, '_id': 0}
        )
        return result.get('user_activities', []) if result else [] 
    
    def find_user_by_user_role(self):
        """
        Retrieve users with roles 'mentor' or 'trainer', format their information,
        and separate them into mentors and trainers lists.
        """
        query = {"roles": {"$in": ["mentor", "trainer"]}}
        projection = {
            "personal_info.first_name": 1,
            "personal_info.last_name": 1,
            "experience": 1,
            "profile_image_url": 1,
            "roles": 1
        }
        users = self.find_many(query, projection)
        print(users)

        mentors = []
        trainers = []
        
        for index, user in enumerate(users):
            # Skip if personal_info is missing or incomplete
            if 'personal_info' not in user or not user['personal_info'].get('first_name') or not user['personal_info'].get('last_name'):
                continue

            # Combine first and last names
            full_name = f"{user['personal_info']['first_name']} {user['personal_info']['last_name']}"
            
            # Extract experience details
            experience = user.get('experience', [{}])[0]
            field = experience.get('industry', 'Unknown')
            start_date_str = experience.get('start_date', None)
            end_date_str = experience.get('end_date', None)
            
            # Calculate years of experience if possible
            years_of_experience = "N/A"
            if start_date_str and end_date_str:
                try:
                    start_date = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                    end_date = datetime.strptime(end_date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                    years_of_experience = f"{(end_date - start_date).days // 365} years"
                except ValueError:
                    years_of_experience = "Invalid date format"
            
            formatted_user = {
                "id": index + 1,
                "name": full_name,
                "field": field,
                "experience": years_of_experience,
                "image": user.get('profile_image_url', '/1520168503387.jpeg')
            }

            if "mentor" in user["roles"]:
                mentors.append(formatted_user)
            if "trainer" in user["roles"]:
                trainers.append(formatted_user)

        return {
            "mentors": mentors,
            "trainers": trainers
        }


# ------------------------------
# Token Service DAO Module
# Handles token operations for users.
# ------------------------------
class TokenDAO(BaseDAO):
    def __init__(self, db_connection):
        """
        Initialize TokenDAO with the 'users_token' collection.
        """
        super().__init__(db_connection, 'users_token')

    def verify_tokens(self, user_id, token):
        """
        Verify if the given access token is valid for the user.
        """
        refresh_token = self.find_one({
            'user_id': user_id,
            'tokens.access_token.token': token
        })

        if refresh_token:
            return True

        print(f"Refresh token not found or expired: {token}")
        return False

    def verify_refresh_token(self, user_id, token):
        """
        Verify if the given refresh token is valid for the user.
        """
        refresh_token = self.find_one({
            'user_id': user_id,
            'tokens.refresh_token.token': token
        })

        if refresh_token:
            return True

        print(f"Refresh token not found or expired: {token}")
        return False

    def store_tokens(self, email, access_token_data, refresh_token_data, user_id):
        """
        Store both access and refresh tokens for a user.
        """
        token_data = {
            'access_token': access_token_data,
            'refresh_token': refresh_token_data
        }
        update_result = self.update_one(
            {'user_id': user_id, 'email': email},
            {'$push': {'tokens': token_data}},
            upsert=True
        )
        return update_result

    def delete_tokens(self, user_id, refresh_token):
        """
        Delete a token record by removing the refresh token and its associated access token.
        """
        result = self.update_one(
            {'user_id': user_id},
            {'$pull': {'tokens': {'refresh_token.token': refresh_token}}}
        )
        return result


# ------------------------------
# OTP Service DAO Module
# Handles one-time password (OTP) operations.
# ------------------------------
class OTPDAO(BaseDAO):
    def __init__(self, db_connection):
        """
        Initialize OTPDAO with the 'otp' collection.
        """
        super().__init__(db_connection, 'otp')

    def create_otp(self, otp):
        """
        Create a new OTP record.
        """
        return self.insert_one(otp)

    def find_otp(self, otp):
        """
        Find an OTP record based on the OTP value.
        """
        return self.find_one({'otp': otp})


# ------------------------------
# Approval Service DAO Module
# Manages approval requests for various items (course, institute, category, ads, mentor).
# ------------------------------
class ApprovalDAO(BaseDAO):
    class ApprovalType(Enum):
        COURSE = "course"
        INSTITUTE = "institute"
        CATEGORY = "category"
        ADS = "ads"
        MENTOR = "mentor"

    class ApprovalStatus(Enum):
        PENDING = "pending"
        APPROVED = "approved"
        REJECTED = "rejected"

    def __init__(self, db_connection):
        """
        Initialize ApprovalDAO with the 'approvals' collection.
        """
        super().__init__(db_connection, 'approvals')

    def create_approval_request(self, approval_type, item_id, requester_id, additional_data=None):
        """
        Create a new approval request if one doesn't already exist with PENDING status.
        """
        item_id = ObjectId(item_id)
        requester_id = ObjectId(requester_id)

        existing_request = self.find_one({
            'item_id': item_id,
            'status': self.ApprovalStatus.PENDING.value
        })

        if existing_request:
            return str(existing_request['_id'])

        approval_data = {
            'item_type': approval_type.value,
            'item_id': item_id,
            'requester_id': requester_id,
            'status': self.ApprovalStatus.PENDING.value,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        if additional_data:
            approval_data.update(additional_data)

        result = self.insert_one(approval_data)
        return str(result.inserted_id)

    def update_approval_status(self, request_id, new_status, reviewer_id, reason=None):
        """
        Update the status of an approval request.
        """
        update_data = {
            'status': new_status.value,
            'reviewer_id': ObjectId(reviewer_id),
            'updated_at': datetime.utcnow()
        }
        if reason:
            update_data['reason'] = reason
        result = self.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0

    def get_approval_request(self, request_id):
        """Retrieve an approval request by its ID."""
        return self.find_one({'_id': ObjectId(request_id)})
    
    @serialize_result
    def get_approval_requests_by_type(self, item_type, status=None):
        """
        Retrieve all approval requests of a certain type, optionally filtered by status.
        """
        query = {'item_type': item_type.value}
        if status:
            query['status'] = status.value
        return list(self.find_many(query))

    def get_approval_requests_by_requester(self, requester_id, item_type=None, status=None):
        """
        Retrieve approval requests made by a specific requester.
        """
        query = {'requester_id': ObjectId(requester_id)}
        if item_type:
            query['item_type'] = item_type.value
        if status:
            query['status'] = status.value
        return list(self.find(query))

    def get_pending_approvals(self):
        """Retrieve all approval requests that are pending."""
        return list(self.find_many({'status': self.ApprovalStatus.PENDING.value}))

    def delete_approval_request(self, request_id):
        """Delete an approval request by its ID."""
        result = self.delete_one({'_id': ObjectId(request_id)})
        return result.deleted_count > 0


# ------------------------------
# Question Service DAO Module
# Handles question-related operations.
# ------------------------------
class QuestionDAO(BaseDAO):
    def __init__(self, db_connection):
        """
        Initialize QuestionDAO with the 'questions' collection.
        """
        super().__init__(db_connection, collection_name="questions") 

    def get_question_by_id(self, question_id):
        """
        Retrieve a question by its ID.
        """
        if not isinstance(question_id, ObjectId):
            question_id = ObjectId(question_id)
        return self.find_one({'_id': question_id})

    def create_question(self, question_data):
        """
        Insert a new question into the collection.
        """
        result = self.insert_one(question_data)
        question_data['_id'] = result.inserted_id
        return question_data

    def update_question(self, question_id, updated_data):
        """
        Update an existing question with new data.
        """
        if not isinstance(question_id, ObjectId):
            question_id = ObjectId(question_id)
        return self.update_one({'_id': question_id}, {'$set': updated_data})

    def delete_question(self, question_id):
        """
        Delete a question by its ID.
        """
        if not isinstance(question_id, ObjectId):
            try:
                question_id = ObjectId(question_id)
            except Exception:
                return None
        return self.collection.delete_one({'_id': question_id})

    def find_questions(self, query):
        """
        Find multiple questions matching the query.
        """
        return list(self.find_many(query))
    
    def get_questions_by_topic(self, topic_id=None):
        """
        Fetch questions filtered by topicId if provided.
        """
        query = {}
        if topic_id:
            try:
                topic_id = ObjectId(topic_id)
                query['topicId'] = topic_id
            except Exception:
                return {'error': "Invalid topicId format"}
        questions = list(self.find_many(query))
        # Convert ObjectId fields to strings for JSON serialization
        for question in questions:
            question['_id'] = str(question['_id'])
            question['topicId'] = str(question['topicId'])
        return questions


# ------------------------------
# Session Service DAO Module
# Handles session-related operations.
# ------------------------------
class SessionDAO(BaseDAO):
    def __init__(self, db_connection):
        """
        Initialize SessionDAO with the 'sessions' collection.
        """
        super().__init__(db_connection, collection_name='sessions')

    def create_session(self, session_data):
        """
        Create a new session record.
        """
        result = self.insert_one(session_data)
        session_data['_id'] = result.inserted_id
        return session_data

    def get_sessions(self, session_id=None):
        """
        Retrieve a single session by its ID or all sessions if no ID is provided.
        """
        if session_id:
            return self.find_one({"_id": ObjectId(session_id)})
        return list(self.find_many({}))

    def get_sessions_by_user(self, user_id):
        """
        Retrieve all sessions created by a specific user.
        """
        return list(self.find_many({"created_by": ObjectId(user_id)}))

    def update_session(self, session_id, update_data):
        """
        Update a session record with new data.
        """
        try:
            session_id = ObjectId(session_id)
        except Exception as e:
            return None 
        return self.update_one({"_id": session_id}, {"$set": update_data})

    def delete_session(self, session_id):
        """
        Delete a session by its ID.
        """
        return self.delete_one({"_id": ObjectId(session_id)})

    def get_question_topics(self, session_id):
        """
        Retrieve the list of question topics for a session.
        """
        try:
            session_obj_id = ObjectId(session_id)
        except Exception as e:
            return []
        session = self.find_one({"_id": session_obj_id}, projection={"questions": 1})
        if session:
            return session.get("questions", [])
        return []

    def get_session_status(self, session_id):
        """
        Retrieve the status of a session.
        """
        try:
            session_obj_id = ObjectId(session_id)
        except Exception as e:
            return None
        session = self.find_one({"_id": session_obj_id}, projection={"status": 1})
        if session:
            return session.get("status")
        return None
    
    def get_session_by_id(self, session_id):
        """
        Retrieve a session document by its ID.
        """
        try:
            session_id = ObjectId(session_id)
        except Exception as e:
            # If conversion fails, return None or handle error accordingly.
            return None 
        # Assume `find_one` is a method that wraps a MongoDB find_one call.
        return self.find_one({"_id": session_id})


# ------------------------------
# Media Service DAO Module
# Handles media-related operations.
# ------------------------------
class MediaDAO(BaseDAO):
    def __init__(self, db_connection):
        """
        Initialize MediaDAO with the 'media' collection.
        """
        super().__init__(db_connection, 'media')
    
    def get_media(self, media_id):
        """
        Retrieve a media document by its ID.
        """
        try:
            return self.collection.find_one({"_id": ObjectId(media_id)})
        except Exception as e:
            # Log error if needed
            return None

    def delete_media(self, media_id):
        """
        Delete a media document using its ID.
        """
        return self.collection.delete_one({"_id": ObjectId(media_id)})
    
    def update_topic_file_metadata(self, metadata):
        result = self.insert_one(metadata)
        if result.inserted_id:
            # Retrieve the full saved document from the database.
            saved_doc = self.find_one({'_id': result.inserted_id})
            if saved_doc:
                # Convert the ObjectId to a string for serialization.
                saved_doc['_id'] = str(saved_doc['_id'])
                return saved_doc
        return None



# ------------------------------
# Super-Admin Service DAO Module
# Handles operations for super-admin tasks like managing trainers.
# ------------------------------
class SuperAdminDAO(BaseDAO):
    def __init__(self, db_connection):
        """
        Initialize SuperAdminDAO with the 'users' collection.
        """
        super().__init__(db_connection, 'users')
    
    def get_trainers(self):
        """
        Retrieve all users with the role 'trainer'.
        """
        trainers = list(
            self.find_many(
                {"roles": "trainer"},
                projection={"_id": 1, "username": 1, "status": 1}
            )
        )
        # Convert ObjectId to string for serialization
        for trainer in trainers:
            trainer['_id'] = str(trainer['_id'])
        return trainers

    def delete_trainer(self, trainer_id):
        """
        Delete a trainer document by its ID.
        """
        return self.delete_one({"_id": ObjectId(trainer_id)})

    def update_trainer(self, trainer_id, new_status):
        """
        Update the status of a trainer document.
        """
        return self.update_one({"_id": ObjectId(trainer_id)}, {"$set": {"status": new_status}})


# ------------------------------
# Topic Service DAO Module
# Handles operations related to topics.
# ------------------------------
class TopicDAO:
    def __init__(self, db_connection):
        """
        Initialize TopicDAO with the 'topics' collection.
        """
        self.db = db_connection.get_collection('topics')

    def create_topic(self, topic_data):
        """
        Create a new topic record.
        """
        result = self.db.insert_one(topic_data)
        topic_data['_id'] = result.inserted_id
        return topic_data

    def get_topic_by_id(self, topic_id):
        """
        Retrieve a topic by its ID.
        """
        if not isinstance(topic_id, ObjectId):
            try:
                topic_id = ObjectId(topic_id)
            except Exception:
                return None
        return self.db.find_one({'_id': topic_id})
    
    def delete_topic(self, topic_id):
        """
        Delete a topic by its ID.
        """
        if not isinstance(topic_id, ObjectId):
            try:
                topic_id = ObjectId(topic_id)
            except Exception:
                return None
        return self.db.delete_one({'_id': topic_id})
    
    def update_topic(self, topic_id, updated_data):
        """
        Update a topic with new data.
        """
        if not isinstance(topic_id, ObjectId):
            topic_id = ObjectId(topic_id)
        # Remove _id if present to avoid immutable field error
        updated_data.pop('_id', None)
        update_query = {"$set": {f"data.{key}": value for key, value in updated_data.items()}}
        return self.db.update_one({'_id': topic_id}, update_query)

    def find_topics(self, query):
        """
        Find topics matching a query.
        """
        return list(self.db.find(query))


# ------------------------------
# Points Service DAO Module
# Handles operations related to points (e.g., points earned by students).
# ------------------------------
class PointsDAO(BaseDAO):
    def __init__(self, db_connection):
        """
        Initialize PointsDAO with the 'points' collection.
        """
        super().__init__(db_connection, collection_name='points')

    def create_points(self, points_data):
        """
        Insert a new points record.
        """
        result = self.insert_one(points_data)
        points_data['_id'] = result.inserted_id
        return points_data

    def get_total_points_by_user(self, user_id):
        """
        Aggregate the total points earned by a specific user.
        """
        try:
            user_id = ObjectId(user_id)
        except Exception:
            return []
        pipeline = [
            {"$match": {"studentUserId": user_id}},
            {"$group": {"_id": None, "totalPoints": {"$sum": "$pointsEarned"}}}
        ]
        return list(self.collection.aggregate(pipeline))

    def get_all_students_points(self):
        """
        Aggregate total points for all students, grouped by studentUserId.
        """
        pipeline = [
            {
                "$group": {
                    "_id": "$studentUserId",
                    "totalPoints": {"$sum": "$pointsEarned"},
                    "userName": {"$first": "$studentUserName"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "userId": "$_id",
                    "userName": 1,
                    "totalPoints": 1
                }
            }
        ]
        return list(self.collection.aggregate(pipeline))
    
    def get_session_by_user(self, user_id):
        """
        Retrieve one points record for a specific user to extract the sessionId.
        If there are multiple sessions, this returns one of them.
        """
        try:
            user_id = ObjectId(user_id)
        except Exception:
            return None
        # The projection only includes sessionId
        return self.collection.find_one({"studentUserId": user_id}, {"sessionId": 1})

    
# ------------------------------
# Broadcast Questions DAO Module
# Handles operations related to broadcast questions.
# ------------------------------

from common.BaseClassDAO import BaseDAO

class BroadcastQuestionsDAO(BaseDAO):
    def __init__(self, db_connection):
        """
        Initialize BroadcastQuestionsDAO with the 'broadcast_questions' collection.
        """
        super().__init__(db_connection, collection_name='broadcast_questions')

    def create_broadcast_question(self, question_data):
        """
        Insert a new broadcast question record into the collection.

        Parameters:
            question_data (dict): A dictionary containing the broadcast question details,
                                  for example:
                                  {
                                    "question": "Your question text",
                                    "options": ["Option 1", "Option 2"],
                                    "correctAnswerIndex": 0,
                                    "created_by": <ObjectId>,
                                    "created_at": <datetime>,
                                    ... (additional fields)
                                  }

        Returns:
            dict: The broadcast question record with the inserted '_id'.
        """
        result = self.insert_one(question_data)
        question_data['_id'] = result.inserted_id
        return question_data
    
    def get_pushed_questions(self, session_id):
        """
        Retrieve all broadcast questions associated with a given session ID
        and that have a 'pushed' broadcast status.
        """
        # Query for questions that match the session and are pushed
        query = {
            "sessionId": session_id,
            "broadcast_status": "pushed"
        }
        return list(self.find_many(query))
    
# ------------------------------
# Chat Service DAO Module
# Handles chat-related operations.
# ------------------------------
class ChatDAO(BaseDAO):
    def __init__(self, db_connection):
        """
        Initialize ChatDAO with the 'chats' collection.
        """
        super().__init__(db_connection, collection_name="chats")

    def save_chat(self, data):
        """
        Insert a new chat session document in the database.
        """
        result = self.insert_one(data)
        if result and result.inserted_id:
            data["_id"] = result.inserted_id
            return data
        return None

    def find_by_session(self, session_id):
        """
        Retrieve a chat session document by sessionId.
        """
        return self.collection.find_one({"sessionId": session_id})

    def append_chat(self, session_id, chat_entry):
        """
        Append a new chat entry to the chats array for the given sessionId.
        """
        return self.collection.update_one(
            {"sessionId": session_id},
            {"$push": {"chats": chat_entry}}
        )

# ------------------------------
# Funnel Service DAO Module
# Handles funnel-related operations.
# ------------------------------
class FunnelDAO(BaseDAO):
    def __init__(self, db_connection):
        """
        Initialize FunnelDAO with the 'funnel' collection.
        """
        super().__init__(db_connection, collection_name="funnel")
    
    def save_participants(self, user_id, data):
        """
        Save a new chat entry into the funnel collection.
        """
        data['created_by'] = ObjectId(user_id)
        data['created_at'] = datetime.utcnow()

        result = self.insert_one(data)
        data['_id'] = result.inserted_id
        return data
    
    def is_participant_in_session(self, data):
        user_id = data.get("userId")
        session_id = data.get("sessionId")
        query = {
            "userId": user_id,
            "sessionId": session_id
        }

        result = self.find_one(query)
        return result is not None
    
    def get_participants_created_by_user(self, user_id):
        user_object_id = ObjectId(user_id)

        query = { "created_by": user_object_id }
        results = self.find_many(query)
        return list(results)

from nameko.rpc import rpc
from common.utils import rbac_check, setup_logging, error_handler, get_rbac_check
from bson_serilizer.bson_serialization import serialize_result, custom_json_dumps  # type: ignore
from common.dependencies import MongoProvider, WorkerContextProvider
from common.DAO import SessionDAO, UserDAO, ChatDAO
import logging
from functools import wraps
from nameko.events import EventDispatcher
from datetime import datetime
from bson.objectid import ObjectId

logger = setup_logging('chat_service', log_level=logging.ERROR)

class SessionService:
    name = 'chat_service'
    mongo_provider = MongoProvider()
    dispatch = EventDispatcher()
    worker_ctx = WorkerContextProvider()
    
    @property
    def chat_dao(self):
        return ChatDAO(self.mongo_provider)


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
    @rbac_check(required_roles=['trainer','student'])
    @serialize_result
    def save_chat(self, user_id, data):
        """
        Save a new chat entry to a session. If the session does not exist,
        create a new document containing sessionId and a chats array.
        """
        # Copy data to avoid modifying the original input
        data = data.copy()

        # Validate and set created_by for the chat entry
        try:
            created_by = ObjectId(user_id)
        except Exception:
            return {
                "message": "Invalid user_id format",
                "status": 400
            }

        # Check if sessionId is provided in data
        session_id = data.get("sessionId")
        if not session_id:
            return {
                "message": "sessionId is required",
                "status": 400
            }

        # Create a chat entry with the necessary fields
        chat_entry = {
            "sender": data.get("sender"),
            "message": data.get("message"),
            "created_by": created_by,
            "created_at": datetime.utcnow()
        }

        # Check for an existing session using sessionId
        existing_session = self.chat_dao.find_by_session(session_id)

        if existing_session:
            # Append the new chat entry to the existing document's chats array
            update_result = self.chat_dao.append_chat(session_id, chat_entry)
            if update_result.modified_count > 0:
                updated_doc = self.chat_dao.find_by_session(session_id)
                return {
                    "message": "Chat appended successfully",
                    "data": updated_doc,
                    "status": 200
                }
            else:
                return {
                    "message": "Failed to update existing chat session",
                    "status": 500
                }
        else:
            # Create a new session document with only sessionId and chats array
            new_session_data = {
                "sessionId": session_id,
                "chats": [chat_entry]
            }
            saved_chat = self.chat_dao.save_chat(new_session_data)
            if saved_chat:
                return {
                    "message": "Chat saved successfully",
                    "data": saved_chat,
                    "status": 200
                }
            else:
                return {
                    "message": "Failed to save chat",
                    "status": 500
                }
from nameko.rpc import rpc
from common.utils import rbac_check, setup_logging, error_handler, get_rbac_check
from bson_serilizer.bson_serialization import serialize_result, custom_json_dumps  # type: ignore
from common.dependencies import MongoProvider, WorkerContextProvider
from common.DAO import ChatDAO
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
    @rbac_check(required_roles=['trainer', 'student'])
    @serialize_result
    def save_chat(self, user_id, data):
        data = data.copy()
        try:
            saved_chat = self.chat_dao.save_chat(user_id, data)
            return {
                "message": "Chat saved successfully",
                "data": saved_chat,
                "status": 200
            }
        except ValueError as ve:
            return {
                "message": str(ve),
                "status": 400
            }
        except Exception:
            return {
                "message": "Failed to save chat",
                "status": 500
            }
    
    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer', 'student'])
    @serialize_result
    def fetch_chat(self, user_id, payload):
        try:
            chats = self.chat_dao.fetch_chat(payload)
            return {
                "message": "Chats fetched successfully",
                "data": chats,
                "status": 200
            }
        except ValueError as ve:
            return {
                "message": str(ve),
                "status": 400
            }
        except Exception:
            return {
                "message": "Failed to fetch chats",
                "status": 500
            }
    
    @rpc
    @error_handler
    @get_rbac_check(required_roles=['trainer'])
    @serialize_result
    def delete_chat(self, user_id, payload):
        try:
            deleted_count = self.chat_dao.delete_chat_by_session_payload(payload)

            return {
                "message": f"Deleted {deleted_count} chat(s)",
                "status": 200
            }

        except ValueError as ve:
            return {
                "message": str(ve),
                "status": 400
            }
        except Exception:
            return {
                "message": "Failed to delete chat(s)",
                "status": 500
            }


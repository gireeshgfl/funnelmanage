from nameko.rpc import rpc
from common.utils import rbac_check, setup_logging, error_handler, get_rbac_check
from bson_serilizer.bson_serialization import serialize_result, custom_json_dumps  # type: ignore
from common.dependencies import MongoProvider, WorkerContextProvider
from common.DAO import MediaDAO
import logging
from functools import wraps
from nameko.events import EventDispatcher
from datetime import datetime
from bson.objectid import ObjectId

logger = setup_logging('media_upload', log_level=logging.ERROR)

class MediaUploadService:
    name = 'media_upload'
    mongo_provider = MongoProvider()
    dispatch = EventDispatcher()
    worker_ctx = WorkerContextProvider()
    
    @property
    def media_dao(self):
        """
        Creates and returns an instance of the MediaDAO using the Mongo connection.
        """
        db = self.mongo_provider.get_connection()  # Assumes MongoProvider returns a database instance
        return MediaDAO(db)
    
    def dispatch_event(event_type):
        """
        Decorator to dispatch an event after a method call if the returned dict contains 'event_data'.
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

    @rpc
    @error_handler
    @serialize_result
    def delete_media(self, media_id):
        """
        Delete a media record by its ID.
        This method fetches the media document using the DAO, retrieves its object URL,
        then deletes the record and returns an appropriate response.
        """
        try:
            # Retrieve the media document
            media = self.media_dao.get_media(media_id)
            if not media:
                return {"error": "No media record found with the given ID"}
            object_url = media.get("object_url")
            
            # Delete the media document
            result = self.media_dao.delete_media(media_id)
            if result.deleted_count == 1:
                return {
                    "message": "Media record deleted successfully",
                    "object_url": object_url,
                    "status": 200
                }
            else:
                return {"error": "Unexpected result while deleting media record", "status": 500}
        except Exception as e:
            logger.error(f"Error deleting media record: {e}")
            return {"error": "An error occurred while deleting the media record", "status": 500}
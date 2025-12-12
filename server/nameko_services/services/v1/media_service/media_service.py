from nameko.rpc import rpc
from datetime import datetime
from bson import ObjectId
from common.utils import rbac_check, setup_logging, error_handler, get_rbac_check
from common.utils import serialize_result, custom_json_dumps  # type: ignore
from nameko_services.common.dependencies import MongoProvider, WorkerContextProvider
from nameko_services.common.DAO import MediaDAO
import logging
from functools import wraps
from nameko.events import EventDispatcher
from nameko.rpc import RpcProxy
from nameko.timer import timer  # Import timer to run periodic tasks

logger = setup_logging('media_service', log_level=logging.INFO)

class MediaService:
    name = 'media_service'
    mongo_provider = MongoProvider()
    dispatch = EventDispatcher()
    worker_ctx = WorkerContextProvider()

    @property
    def media_dao(self):
        # Initialize the MediaDAO with the Mongo connection.
        return MediaDAO(self.mongo_provider)

    @rpc
    @error_handler
    @rbac_check(required_roles=['trainer'])
    @serialize_result
    def update_topic_file_metadata(self, user_id, data):
        """
        Updates metadata for a topic file.
        Expects data to contain 'topicId' and 'resource'.
        """
        print("DEBUG: Entering update_topic_file_metadata")
        print(f"DEBUG: Received user_id: {user_id}")
        print(f"DEBUG: Received data: {data}")

        topic_id = data.get("_id")
        resource = data.get("resource")
        print(f"DEBUG: Extracted topic_id: {topic_id}")
        print(f"DEBUG: Extracted resource: {resource}")
        
        if not topic_id or not resource:
            print("DEBUG: Missing required fields detected")
            return {
                "message": "Missing required fields: 'topicId' and/or 'resource'",
                "status": 400,
                "data": {}
            }
        
        metadata = {
            "topicId": topic_id,
            "resource": resource,
            "createdAt": datetime.utcnow()  # Optionally add a timestamp.
        }
        print(f"DEBUG: Built metadata: {metadata}")
        
        saved_metadata = self.media_dao.update_topic_file_metadata(metadata)
        print(f"DEBUG: DAO returned saved_metadata: {saved_metadata}")
        
        if saved_metadata:
            response = {
                "message": "File metadata saved successfully",
                "status": 200,
                "data": saved_metadata
            }
            print("DEBUG: Metadata saved successfully, sending response")
        else:
            response = {
                "message": "Failed to save file metadata",
                "status": 500,
                "data": {}
            }
            print("DEBUG: Failed to save metadata, sending error response")
        
        print(f"DEBUG: Final response: {response}")
        return response

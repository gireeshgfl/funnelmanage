from nameko.rpc import rpc
from common.utils import rbac_check, setup_logging, error_handler, get_rbac_check
from bson_serilizer.bson_serialization import serialize_result, custom_json_dumps  # type: ignore
from nameko_services.common.dependencies import MongoProvider, WorkerContextProvider
from nameko_services.common.DAO import SuperAdminDAO
import logging
from functools import wraps
from nameko.events import EventDispatcher
from datetime import datetime
from bson.objectid import ObjectId

logger = setup_logging('super_admin_service', log_level=logging.ERROR)

class SuperAdminService:
    name = 'super_admin_service'
    mongo_provider = MongoProvider()
    dispatch = EventDispatcher()
    worker_ctx = WorkerContextProvider()
    
    @property
    def super_admin_service_dao(self):
        return SuperAdminDAO(self.mongo_provider)

    def dispatch_event(event_type):
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
        Converts datetime objects to ISO 8601 string, and None to JSON null.
        """
        if due_date is None:
            return None
        elif isinstance(due_date, datetime):
            return due_date.isoformat()
        else:
            return due_date

    @rpc
    @error_handler
    @get_rbac_check(required_roles=['super-admin'])
    @serialize_result
    def get_trainers(self, user_id, data):
        """
        Retrieve all trainers.
        """
        try:
            trainers = self.super_admin_service_dao.get_trainers()
            return {
                "message": "Trainers fetched successfully",
                "data": trainers,
                "status": 200
            }
        except Exception as e:
            logger.error(f"Error fetching trainers: {e}")
            return {"error": "An error occurred while fetching trainers", "status": 500}
        
    @rpc
    @error_handler
    @rbac_check(required_roles=['super-admin'])
    @serialize_result
    def delete_trainer(self, trainer_id):
        """
        Delete a trainer by ID.
        """
        try:
            result = self.super_admin_service_dao.delete_trainer(trainer_id)
            if result.deleted_count == 1:
                return {"message": "Trainer deleted successfully", "status": 200}
            else:
                return {"error": "Trainer not found", "status": 404}
        except Exception as e:
            logger.error(f"Error deleting trainer: {e}")
            return {"error": "An error occurred while deleting the trainer", "status": 500}
        
    @rpc
    @error_handler
    @rbac_check(required_roles=['super-admin'])
    @serialize_result
    def trainer_status(self, user_id, data):
        # Log the incoming data for debugging purposes
        """
        Update the status of a trainer.
        """
        try:
            # Step 1: Extract trainer_id and new_status from the input data
            trainer_id = data.get('_id')
            new_status = data.get('status')
            
            # Step 2: Validate that both trainer_id and new_status are provided
            if not trainer_id or not new_status:
                return {"error": "Missing trainer_id or status", "status": 400}
            
            # Step 3: Call the DAO method to update the trainer status
            result = self.super_admin_service_dao.update_trainer(trainer_id, new_status)
            
            # Step 4: Check the result and return appropriate message
            if result.modified_count == 1:
                updated_trainer = self.super_admin_service_dao.get_trainer_by_id(trainer_id)
                return {"message": "Trainer status updated successfully", "updatedTrainer": updated_trainer, "status": 200}
            else:
                return {"error": "Trainer not found", "status": 404}
        except Exception as e:
            # Log the exception details
            logger.error(f"Error updating trainer: {e}")
            return {"error": "An error occurred while updating the trainer", "status": 500}
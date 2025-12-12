from functools import wraps
import logging
import traceback
from datetime import datetime
from bson import ObjectId, Decimal128, MinKey, MaxKey, Regex, Timestamp
import orjson
import base64
import nameko_services.common.dependencies as dependencies


# Logging setup
def setup_logging(logger_name, log_level=logging.INFO):
    logger = logging.getLogger(logger_name)
    logger.setLevel(log_level)
    if not logger.hasHandlers():
        console_handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    return logger

# Services requiring logging
services = [
    'session_service',
    'question_service',
    'media_upload',
    'super_admin_service',
    'auth_service',
    'utils',
    'dependency',
    'funnel_service'
]

for service in services:
    logger = setup_logging(service, log_level=logging.DEBUG)
    logger.propagate = False


# Helper functions for BSON serialization and deserialization

def serialize_object(obj):
    if isinstance(obj, dict):
        return {k: serialize_object(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize_object(v) for v in obj]
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, bytes):
        return base64.b64encode(obj).decode("utf-8")
    if isinstance(obj, Decimal128):
        return str(obj)
    if isinstance(obj, MinKey) or isinstance(obj, MaxKey):
        return None
    if isinstance(obj, Regex):
        return {"pattern": obj.pattern, "flags": obj.flags}
    if isinstance(obj, Timestamp):
        return {"time": obj.time, "inc": obj.inc}
    return obj

def deserialize_object(obj):
    object_id_keys = ['category_id','institute_id']

    if isinstance(obj, dict):
        for key in obj:
            if key in object_id_keys and isinstance(obj[key], str):
                try:
                    obj[key] = ObjectId(obj[key])
                except Exception as e:
                    raise ValueError(f"Invalid ObjectId for key '{key}': {obj[key]}")
        if "date" in obj:
            return datetime.fromisoformat(obj["date"])
        if "binary" in obj and "base64" in obj["binary"]:
            return base64.b64decode(obj["binary"]["base64"])
        if "numberDecimal" in obj:
            return Decimal128(obj["numberDecimal"])
        if "minKey" in obj:
            return MinKey()
        if "maxKey" in obj:
            return MaxKey()
        if "regex" in obj:
            return Regex(obj["regex"]["pattern"], obj["regex"].get("flags", ""))
        if "timestamp" in obj:
            return Timestamp(obj["timestamp"]["time"], obj["timestamp"]["inc"])
        return {k: deserialize_object(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [deserialize_object(v) for v in obj]
    return obj


def custom_json_dumps(obj):
    serialized_obj = serialize_object(obj)
    return orjson.dumps(serialized_obj).decode("utf-8")

def custom_json_loads(s):
    loaded_obj = orjson.loads(s)
    return deserialize_object(loaded_obj)


def serialize_result(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return serialize_object(result)
    return wrapper

# Decorator for deserializing method arguments
def deserialize_args(func):
    def wrapper(*args, **kwargs):
        deserialized_args = [deserialize_object(arg) for arg in args]
        deserialized_kwargs = {k: deserialize_object(v) for k, v in kwargs.items()}
        return func(*deserialized_args, **deserialized_kwargs)
    return wrapper


def error_handler(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            # Retrieve the current worker context
            worker_ctx = dependencies.get_worker_ctx()

            if worker_ctx:
                service_name = worker_ctx.service_name
                method_name = worker_ctx.entrypoint.method_name
            else:
                service_name = 'unknown_service'
                method_name = 'unknown_method'

            # Retrieve the logger using the service name
            logger = logging.getLogger(service_name)

            # Log the service and method name
            print(f"Service: {service_name}, Method: {method_name}")
            logger.info(f"Service: {service_name}, Method: {method_name}")

            # Call the actual method
            result = func(*args, **kwargs)

            return result

        except Exception as e:
            # Log error with traceback
            logger.error(f"Error in {method_name}: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")

            return {
                'error': 'An unexpected error occurred',
                'status': 500
            }
    return wrapper

# Role-based access control (RBAC) decorator
def rbac_check(required_permissions=None, required_roles=None):
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            payload = args[0] if args else kwargs.get('payload')
            if not isinstance(payload, dict):
                return {'message': 'Invalid payload format', 'status': 400}

            user_id = payload.get('user_id')
            user_roles = payload.get('roles', [])
            user_permissions = payload.get('permissions', {})

            if not user_id:
                return {'message': 'User ID not found in payload', 'status': 400}
            if required_permissions and not all(user_permissions.get(perm, False) for perm in required_permissions):
                return {'message': 'Insufficient permissions', 'status': 403}
            if required_roles and not any(role in user_roles for role in required_roles):
                return {'message': 'Insufficient role', 'status': 403}
            return func(self, user_id, *args[1:], **kwargs)
        return wrapper
    return decorator


def get_rbac_check(required_permissions=None, required_roles=None):
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            if not args and not kwargs:
                return {'message': 'No arguments provided', 'status': 400}

            payload = args[0] if args else kwargs.get('payload')

            if not isinstance(payload, dict):
                return {'message': 'Invalid payload format', 'status': 400}

            user_id = payload.get('user_id')
            user_roles = payload.get('roles', [])
            user_permissions = payload.get('permissions', {})

            if not user_id:
                return {'message': 'User ID not found in payload', 'status': 400}

            if required_permissions and not all(user_permissions.get(perm, False) for perm in required_permissions):
                return {'message': 'Insufficient permissions', 'status': 403}

            if required_roles and not any(role in user_roles for role in required_roles):
                return {'message': 'Insufficient role', 'status': 403}
            return func(self, user_id,payload, **kwargs)
        return wrapper
    return decorator

# Event dispatcher decorator
def dispatch_event(event_type):
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            result = func(self, *args, **kwargs)
            if isinstance(result, dict) and 'data' in result:
                self.dispatch(event_type, custom_json_dumps(result['data']))
            return result
        return wrapper
    return decorator

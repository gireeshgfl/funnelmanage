# routers/v2/services.py

from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import Response
from fastapi.security import HTTPBearer
from nameko.standalone.rpc import ClusterRpcProxy
import orjson
import jwt
import logging
from config import CONFIG, SECRET_KEY, ALGORITHM, REDIS_TOKEN_KEY_PREFIX
from fastapi import Header

security = HTTPBearer()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.api_route("/get/{service}/{method}", methods=["GET", "POST"])
async def process_data_v2(service: str, method: str, request: Request):
    try:
        if not service or not method:
            logger.warning("Invalid request: missing service or method (v2)")
            raise HTTPException(status_code=400, detail="Invalid request: provide both service and method")

        with ClusterRpcProxy(CONFIG) as rpc:
            service_method = getattr(getattr(rpc, service), method)

            if request.method == "POST":
                data = await request.json()
            else:
                data = {}

            token = request.headers.get('Authorization')
            if token and token.startswith("Bearer "):
                token = token[len("Bearer "):]

            # v2-specific method handling (e.g., additional steps or different logic)
            if method == 'register':
                # Example: Additional validation or logging in v2
                logger.info("Processing register in v2 with additional steps")
                response = service_method(data)
            elif method == 'signin':
                logger.info("Processing signin in v2 with additional steps")
                response = service_method(data)
            elif method == 'refresh_token':
                logger.info("Processing refresh_token in v2 with additional steps")
                response = service_method(token)
            elif method == 'signout':
                logger.info("Processing signout in v2 with additional steps")
                response = service_method(token)
            elif method == 'generate_captcha':
                logger.info("Processing generate_captcha in v2 with additional steps")
                response = service_method()
            elif method == 'verify_otp_and_change_password':
                logger.info("Processing verify_otp_and_change_password in v2 with additional steps")
                response = service_method(data)
            elif method == 'generate_otp':
                logger.info("Processing generate_otp in v2 with additional steps")
                response = service_method(data)
            else:
                logger.info(f"Processing method '{method}' in v2")
                response = service_method()

        return Response(content=orjson.dumps(response), media_type="application/json")
    except Exception as e:
        logger.exception(f"An error occurred (v2): {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{service}/{method}")
async def process_data_post_v2(
    request: Request,
    service: str,
    method: str,
    token: str = Depends(security)
):
    try:
        # Decode JWT to get user information
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('user_id')
        logger.debug(f"User ID: {user_id}")

        data = await request.json()
        key = data.get('key')

        if key:
            redis_client = request.app.state.redis
            redis_data = await redis_client.get(key)
            if not redis_data:
                logger.warning("No data found for the given key (v2)")
                raise HTTPException(status_code=404, detail="No data found for the given key")
            redis_data = orjson.loads(redis_data)
            service_via_redis, method_via_redis, data_via_redis = redis_data['service'], redis_data['method'], redis_data['data']
            logger.info(f"Retrieved data from Redis: {service_via_redis}, {method_via_redis}, {data_via_redis}")
            service = service_via_redis
            method = method_via_redis
            data = data_via_redis

        with ClusterRpcProxy(CONFIG) as rpc:
            service_method = getattr(getattr(rpc, service), method)
            response = service_method(payload, data)

        return Response(content=orjson.dumps(response), status_code=response.get('status', 200))
    except jwt.ExpiredSignatureError:
        logger.error("JWT token has expired (v2)")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        logger.error("Invalid JWT token (v2)")
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception(f"An error occurred (v2): {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{service}/{method}")
async def get_data_v2(
    request: Request,
    service: str,
    method: str,
    token: str = Depends(security)
):
    try:
        # Decode JWT to get user information
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('user_id')

        # Get query parameters and push them into the payload only if they exist
        query_params = dict(request.query_params)
        if query_params:  # Check if query_params is not empty
            payload['query_params'] = query_params

        logger.debug(f"Query parameters (v2): {query_params}")

        with ClusterRpcProxy(CONFIG) as rpc:
            service_method = getattr(getattr(rpc, service), method)
            response = service_method(payload)  # Pass the updated payload with query_params if available

        return Response(content=orjson.dumps(response), status_code=response.get('status', 200))

    except jwt.ExpiredSignatureError:
        logger.error("JWT token has expired (v2)")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        logger.error("Invalid JWT token (v2)")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.exception(f"An error occurred (v2): {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/key")
async def get_key_v2(
    request: Request,
    token: str = Depends(security)
):
    try:
        # Decode the JWT token to get the user information
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('user_id')

        # Retrieve query parameters
        key = request.query_params.get('key')
        service = request.query_params.get('service')
        method = request.query_params.get('method')
        logger.debug(f"Received key endpoint (v2) with key: {key}, service: {service}, method: {method}")

        # Ensure the required parameters are present
        if not key or not service or not method:
            raise HTTPException(status_code=400, detail="Key, service, and method are required")

        with ClusterRpcProxy(CONFIG) as rpc:
            service_method = getattr(getattr(rpc, service), method)
            response = service_method(payload, key=key)

        return Response(content=orjson.dumps(response), media_type="application/json")
    except jwt.ExpiredSignatureError:
        logger.error("JWT token has expired (v2)")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        logger.error("Invalid JWT token (v2)")
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception(f"An error occurred (v2): {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/home/{service}/{method}")
async def get_home_service_data_v2(service: str, method: str):
    try:
        with ClusterRpcProxy(CONFIG) as rpc:
            service_method = getattr(getattr(rpc, service), method)
            response = service_method()
        return Response(content=orjson.dumps(response), status_code=response.get('status', 200))
    except Exception as e:
        logger.exception(f"An error occurred in home service (v2): {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

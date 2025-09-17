# ===============================================================================
# GoFreeLab Proprietary
# -------------------------------------------------------------------------------
# Project Name    : Funnel-Management
# File Name       : services.py
# Author          : Sabari Santhosh Pillai
# Created Date    : 2025-02-24
# Version         : 1.0
# -------------------------------------------------------------------------------
# Copyright (c) 2025 GoFreeLab. All rights reserved.
# This source code and all its contents are the proprietary property of GoFreeLab.
# Unauthorized copying, sharing, or distribution of this code, in whole or in part,
# via any medium is strictly prohibited without prior written permission from GoFreeLab.
# This software is for use only by employees, contractors, or partners of GoFreeLab
# with explicit authorization. For questions or permissions, please contact: info@gofreelab.com
# ===============================================================================
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from nameko.standalone.rpc import ClusterRpcProxy
import orjson
import jwt
import logging
import anyio
from config import CONFIG, SECRET_KEY, ALGORITHM

logger = logging.getLogger(__name__)
router = APIRouter()

security = HTTPBearer(auto_error=False)

def cookie_or_header_token(
    request: Request,
    auth: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Dependency that returns the token from either the Authorization header
    (Bearer token) or from a cookie named 'accessToken'. If neither is present,
    raises a 401 error.
    """
    if auth is not None:
        return auth.credentials
    token = request.headers.get('Authorization') or request.cookies.get('accessToken')

    if token:
        return token
    raise HTTPException(status_code=401, detail="Missing token")

def decode_token(token: str):
    """
    Decode the JWT token and return its payload.
    Raises HTTPException if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not payload.get("user_id"):
            logger.warning("JWT token missing 'user_id'")
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except jwt.ExpiredSignatureError:
        logger.error("JWT token has expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        logger.error("Invalid JWT token")
        raise HTTPException(status_code=401, detail="Invalid token")

def get_token(request: Request) -> str:
    """
    Extract the token from the Authorization header.
    """
    token = request.headers.get("Authorization")
    if token and token.startswith("Bearer "):
        return token[len("Bearer "):]
    return ""

async def rpc_call(service: str, method: str, *args, **kwargs):
    """
    Helper function to perform an RPC call using Nameko with anyio for async management.
    Uses anyio.fail_after for timeout handling.
    """
    try:
        # Define the RPC call as a synchronous function to be run in a thread
        def make_rpc_call():
            with ClusterRpcProxy(CONFIG) as rpc:
                service_proxy = getattr(rpc, service)
                service_method = getattr(service_proxy, method)
                return service_method(*args, **kwargs)

        # Run the synchronous RPC call in a thread with a 10-second timeout
        with anyio.fail_after(10.0):  # Timeout after 10 seconds
            result = await anyio.to_thread.run_sync(make_rpc_call)
            return result
    except Exception as e:
        logger.exception("Error in rpc_call for service '%s', method '%s': %s", service, method, e)
        raise HTTPException(status_code=500, detail="Internal server error")

# ---------------------------------------------------------------------------
# Public Endpoints (typically don't need a token)
# ---------------------------------------------------------------------------

@router.api_route("/get/{service}/register", methods=["POST"])
async def register(service: str, request: Request):
    data = await request.json()
    response = await rpc_call(service, "register", data)
    return Response(content=orjson.dumps(response))

@router.api_route("/get/{service}/signin", methods=["POST"])
async def signin(service: str, request: Request):
    data = await request.json()
    response = await rpc_call(service, "signin", data)
    return Response(content=orjson.dumps(response))

@router.api_route("/get/{service}/participants_token", methods=["POST"])
async def participants_token(service: str, request: Request):
    data = await request.json()
    response = await rpc_call(service, "participants_token", data)
    return Response(content=orjson.dumps(response))

# ---------------------------------------------------------------------------
# Token-dependent Endpoints using our cookie_or_header_token dependency
# ---------------------------------------------------------------------------

@router.api_route("/get/{service}/refresh_token", methods=["GET"])
async def refresh_token(
    service: str, 
    request: Request, 
    token: str = Depends(cookie_or_header_token)
):
    response = await rpc_call(service, "refresh_token", token)
    return Response(content=orjson.dumps(response))

@router.api_route("/get/{service}/signout", methods=["DELETE"])
async def signout(
    service: str, 
    request: Request, 
    token: str = Depends(cookie_or_header_token)
):
    response = await rpc_call(service, "signout", token)
    return Response(content=orjson.dumps(response))


@router.api_route("/get/{service}/generate_otp", methods=["POST"])
async def generate_otp(
    service: str, 
    request: Request,
):
    data = await request.json()
    response = await rpc_call(service, "generate_otp", data)
    return Response(content=orjson.dumps(response))

@router.api_route("/get/{service}/verify_otp_and_change_password", methods=["POST"])
async def verify_otp_and_change_password(
    service: str, 
    request: Request,
):
    data = await request.json()
    response = await rpc_call(service, "verify_otp_and_change_password", data)
    return Response(content=orjson.dumps(response))


@router.api_route("/get/{service}/resend_verification", methods=["GET"])
async def resend_verification(
    service: str, 
    request: Request, 
    token: str = Depends(cookie_or_header_token)
):
    response = await rpc_call(service, "resend_verification", token)
    return Response(content=orjson.dumps(response))

@router.api_route("/get/{service}/email_verification", methods=["POST"])
async def email_verification(
    service: str, 
    request: Request,
):
    data = await request.json()
    response = await rpc_call(service, "email_verification", data)
    return Response(content=orjson.dumps(response))

@router.api_route("/get/{service}/generate_captcha", methods=["GET"])
async def generate_captcha(
    service: str, 
    request: Request,
):
    response = await rpc_call(service, "generate_captcha")
    return Response(content=orjson.dumps(response))

@router.post("/{service}/{method}")
async def process_data_post_v1(
    request: Request,
    service: str,
    method: str,
    token: str = Depends(cookie_or_header_token)
):
    payload = decode_token(token)
    data = await request.json()

    # If a key is provided, attempt to retrieve additional data from Redis.
    key = data.get("key")
    if key:
        redis_client = request.app.state.redis
        redis_data = await redis_client.get(key)
        if not redis_data:
            logger.warning("No data found for the given key (v1)")
            raise HTTPException(status_code=404, detail="No data found for the given key")
        redis_data = orjson.loads(redis_data)
        service = redis_data.get("service", service)
        method = redis_data.get("method", method)
        data = redis_data.get("data", data)

    response = await rpc_call(service, method, payload, data)
    return Response(content=orjson.dumps(response), status_code=response.get("status", 200))

@router.get("/{service}/{method}")
async def get_data_v1(
    request: Request,
    service: str,
    method: str,
    token: str = Depends(cookie_or_header_token)
):
    payload = decode_token(token)
    query_params = dict(request.query_params)
    if query_params:
        payload["query_params"] = query_params
    response = await rpc_call(service, method, payload)
    return Response(content=orjson.dumps(response), status_code=response.get("status", 200))

@router.delete("/{service}/{method}")
async def delete_data_v1(
    request: Request,
    service: str,
    method: str,
    token: str = Depends(cookie_or_header_token)
):
    payload = decode_token(token)
    query_params = dict(request.query_params)
    if query_params:
        payload["query_params"] = query_params
    response = await rpc_call(service, method, payload)
    return Response(content=orjson.dumps(response), status_code=response.get("status", 200))

@router.get("/key")
async def get_key_v1(
    request: Request, 
    token: str = Depends(cookie_or_header_token)
):
    payload = decode_token(token)
    key = request.query_params.get("key")
    service = request.query_params.get("service")
    method = request.query_params.get("method")
    logger.debug("Key endpoint (v1) with key: %s, service: %s, method: %s", key, service, method)

    if not all([key, service, method]):
        raise HTTPException(status_code=400, detail="Key, service, and method are required")

    response = await rpc_call(service, method, payload, key=key)
    return Response(content=orjson.dumps(response), media_type="application/json")

@router.get("/home/{service}/{method}")
async def get_home_service_data_v1(service: str, method: str):
    response = await rpc_call(service, method)
    return Response(content=orjson.dumps(response), status_code=response.get("status", 200))
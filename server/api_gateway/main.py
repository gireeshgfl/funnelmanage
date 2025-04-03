import logging
import logging.config
import importlib
import fnmatch
import os

import boto3
import jwt
import uvicorn
import aioredis
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware

from config import (
    EXCLUDED_PATH_PATTERNS,
    SECRET_KEY,
    ALGORITHM,
    ACTIVE_VERSIONS,
    AWS_CONFIG,
    REDIS_URL,
    LOGGING_CONFIG
)

# Configure logging
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def include_versioned_routers(app: FastAPI, versions: list):
    logger.info("Starting to include versioned routers for versions: %s", versions)
    for version in versions:
        try:
            graphql_router = importlib.import_module(f'routers.{version}.graphql').graphql_router
            services_router = importlib.import_module(f'routers.{version}.services').router
            health_router = importlib.import_module(f'routers.{version}.health').router

            app.include_router(graphql_router, prefix=f"/{version}", tags=[version])
            app.include_router(services_router, prefix=f"/{version}", tags=[version])
            app.include_router(health_router, prefix=f"/{version}", tags=[version])

            logger.info("Successfully included routers for version: %s", version)
        except ModuleNotFoundError:
            logger.error("Routers for version '%s' not found. Skipping...", version)
        except Exception as e:
            logger.exception("Error including routers for version '%s': %s", version, str(e))

def is_path_excluded(path: str, patterns: list) -> bool:
    result = any(fnmatch.fnmatch(path, pattern) for pattern in patterns)
    logger.debug("Path '%s' exclusion check: %s (patterns: %s)", path, result, patterns)
    return result

include_versioned_routers(app, ACTIVE_VERSIONS)

@app.get("/")
async def read_root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to the API Gateway"}

@app.get("/favicon.ico")
async def favicon():
    logger.debug("Favicon requested")
    return Response(status_code=204)

@app.middleware("http")
async def authorization_middleware(request: Request, call_next):
    logger.debug("Request received: %s %s, Headers: %s", request.method, request.url.path, dict(request.headers))

    if request.url.path == "/favicon.ico":
        logger.debug("Skipping middleware for favicon")
        return await call_next(request)

    try:
        path = request.url.path
        logger.debug("Processing request for path: %s", path)

        if is_path_excluded(path, EXCLUDED_PATH_PATTERNS):
            logger.info("Path '%s' excluded from authorization", path)
            response = await call_next(request)
            logger.debug("Response for excluded path '%s': %s", path, response.status_code)
            return response

        token = request.headers.get('Authorization') or request.cookies.get('accessToken')
        print(token)
        logger.debug("Token retrieved: %s", token if token else "None")

        if not token:
            logger.warning("No token provided for path: %s", path)
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})

        if token.startswith("Bearer "):
            token = token[len("Bearer "):]
            logger.debug("Bearer token extracted: %s", token)

        try:
            print(SECRET_KEY, ALGORITHM)
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            logger.info("Token decoded successfully for user_id: %s", payload.get('user_id'))
            request.state.user = {"user_id": payload.get('user_id')}
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired for path: %s", path)
            return JSONResponse(status_code=401, content={"error": "Token has expired"})
        except jwt.InvalidTokenError as e:
            logger.warning("Invalid token for path: %s - Error: %s", path, str(e))
            return JSONResponse(status_code=401, content={"error": "Invalid token"})

        response = await call_next(request)
        logger.debug("Response for path '%s': %s", path, response.status_code)
        return response
    except Exception as e:
        logger.exception("Unexpected error in middleware for path '%s': %s", path, str(e))
        return JSONResponse(status_code=500, content={"error": "Internal Server Error"})

async def startup_event():
    logger.info("Application starting up...")
    # Print all config variables at startup
    logger.info("Configuration loaded:")
    logger.info("EXCLUDED_PATH_PATTERNS: %s", EXCLUDED_PATH_PATTERNS)
    logger.info("SECRET_KEY: %s", SECRET_KEY)  # Be cautious with sensitive data in production
    logger.info("ALGORITHM: %s", ALGORITHM)
    logger.info("ACTIVE_VERSIONS: %s", ACTIVE_VERSIONS)
    logger.info("AWS_CONFIG: %s", {k: v if 'SECRET' not in k else '****' for k, v in AWS_CONFIG.items()})  # Mask sensitive AWS keys
    logger.info("REDIS_URL: %s", REDIS_URL)
    logger.info("LOGGING_CONFIG: %s", LOGGING_CONFIG)
    
    try:
        app.state.s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_CONFIG['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=AWS_CONFIG['AWS_SECRET_ACCESS_KEY'],
            region_name=AWS_CONFIG['AWS_REGION']
        )
        app.state.redis = await aioredis.create_redis_pool(REDIS_URL)
        logger.info("AWS S3 and Redis initialized successfully - S3 Region: %s, Redis URL: %s",
                    AWS_CONFIG['AWS_REGION'], REDIS_URL)
    except Exception as e:
        logger.exception("Error during startup: %s", str(e))
        raise

async def shutdown_event():
    logger.info("Application shutting down...")
    try:
        if hasattr(app.state, 'redis'):
            app.state.redis.close()
            await app.state.redis.wait_closed()
            logger.info("Redis connection closed successfully")
    except Exception as e:
        logger.exception("Error during shutdown: %s", str(e))

app.add_event_handler("startup", startup_event)
app.add_event_handler("shutdown", shutdown_event)

if __name__ == "__main__":
    logger.info("Starting Uvicorn server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
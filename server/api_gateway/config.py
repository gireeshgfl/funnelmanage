import os
from dotenv import load_dotenv

# Load environment variables from .env file (if present)
load_dotenv()

# AMQP Configuration
CONFIG = {
    'AMQP_URI': os.getenv('AMQP_URI', 'amqp://guest:guest@localhost')
}

# Active API Versions
ACTIVE_VERSIONS = ['v1', 'v2']

# Version-Specific Configurations
VERSION_CONFIG = {
    'v1': {
        'setting1': os.getenv('V1_SETTING1', 'default_value1'),
    },
    'v2': {
        'setting1': os.getenv('V2_SETTING1', 'default_value2'),
    },
}


# Centralized logger configuration
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
REDIS_TOKEN_KEY_PREFIX = "token:"

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "abc123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# AWS Configuration
AWS_CONFIG = {
    'AWS_ACCESS_KEY_ID': os.getenv('AWS_ACCESS_KEY_ID', 'your_access_key_id'),
    'AWS_SECRET_ACCESS_KEY': os.getenv('AWS_SECRET_ACCESS_KEY', 'your_secret_access_key'),
    'AWS_REGION': os.getenv('AWS_REGION', 'ap-south-1'),
    'AWS_S3_BUCKET_NAME': os.getenv('AWS_S3_BUCKET_NAME', 'funnelmanagement')
}

# Upload Configuration
UPLOAD_DIRECTORY = os.getenv("UPLOAD_DIRECTORY", "/profile_images")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE", 5 * 1024 * 1024))  # 5 MB

# Excluded Paths for Authorization Middleware (supports wildcards)
EXCLUDED_PATH_PATTERNS = [
    "/openapi.json",
    "/docs",
    "/*/get/auth_service_fun/register",
    "/*/get/auth_service_fun/signin",
    "/*/get/auth_service_fun/reset-password",
    "/*/get/auth_service_fun/refresh_token",
    "/*/get/auth_service_fun/generate_otp",
    "/*/get/auth_service_fun/verify_otp_and_change_password",
    "/*/health",
]

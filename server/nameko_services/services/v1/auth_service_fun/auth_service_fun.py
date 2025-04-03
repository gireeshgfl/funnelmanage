# auth_service.py

import logging
import json
from functools import wraps
from datetime import datetime, timedelta
from nameko.rpc import rpc
from nameko.dependency_providers import Config
from common.dependencies import WorkerContextProvider, RedisClient,MongoProviderAuth,MongoProvider
from common.DAO import UserDAO, TokenDAO, OTPDAO,ApprovalDAO
import bcrypt
import jwt
import random
from PIL import Image, ImageDraw, ImageFont
import os
from io import BytesIO
import base64
from common.utils import setup_logging, error_handler
from uuid import uuid4
import time
logger = setup_logging(__name__, log_level=logging.DEBUG)

class AuthServiceV1:
    name = 'auth_service_fun'

    mongo_provider = MongoProvider()
    worker_ctx = WorkerContextProvider()
    redis = RedisClient()
    config = Config()

    @property
    def secret_key(self):
        return self.config.get('SECRET_KEY')

    @property
    def jwt_algorithm(self):
        return self.config.get('JWT_ALGORITHM')

    # @property
    # def access_token_expire_days(self):
    #     value = self.config.get('ACCESS_TOKEN_EXPIRY_DAYS')
    #     print(value,'ameen')
    #     if value is None:
    #         value = 15  # Default value if the config is missing
    #     return value

    # @property
    # def refresh_token_expire_days(self):
    #     value = self.config.get('REFRESH_TOKEN_EXPIRY_DAYS')  # Fixed typo
    #     print(value,'ameen')
    #     if value is None:
    #         value = 7  # Default value if the config is missing
    #     return value
    
    @property
    def redis_token_key(self):
        return self.config.get('REDIS_TOKEN_KEY_PREFIX')

    @property
    def user_db(self):
        return UserDAO(self.mongo_provider)
    
    @property
    def approval_dao(self):
        return ApprovalDAO(self.mongo_provider)

    @property
    def token_db(self):
        return TokenDAO(self.mongo_provider)

    @property
    def otp_db(self):
        return OTPDAO(self.mongo_provider)


    def _create_access_token(self, user):
        expire_time = int(time.time()) + ( 15* 24 * 60 * 60)  # 15 minutes from now
        print(f"Access Token Expires At: {datetime.utcfromtimestamp(expire_time)}")

        to_encode = {
            'sub': user['username'],
            'user_id': str(user['_id']),
            'exp': expire_time,
            'iat': int(time.time()),
            'jti': str(uuid4()),
            'roles': user.get('roles', []),
            'email': user.get('email', ''),
            'is_first_login': user.get('is_first_login', True),
            'permissions': user.get('permissions', []),
            'type': 'access'
        }
        return jwt.encode(to_encode, self.secret_key, algorithm=self.jwt_algorithm)

    def _create_refresh_token(self, user):
        expire_time = int(time.time()) + (30 * 24 * 60 * 60)  # 30 days from now
        print(f"Refresh Token Expires At: {datetime.utcfromtimestamp(expire_time)}")

        to_encode = {
            'email': user['email'],
            'user_id': str(user['_id']),
            'exp': expire_time,
            'iat': int(time.time()),
            'jti': str(uuid4()),
            'type': 'refresh'
        }
        return jwt.encode(to_encode, self.secret_key, algorithm=self.jwt_algorithm)

    def _store_tokens(self, email, access_token, refresh_token, user_id):
        access_token_data = {
            'token': access_token,
            'expires_at': self._decode_token(access_token)['exp']
        }
        refresh_token_data = {
            'token': refresh_token,
            'expires_at': self._decode_token(refresh_token)['exp']
        }
        
        # Store tokens using the updated TokenDAO
        result = self.token_db.store_tokens(email, access_token_data, refresh_token_data, user_id)
        return result

    def _decode_token(self, token):
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.jwt_algorithm])
        except jwt.PyJWTError:
            return None
        
    @rpc
    def health_check(self):
        return {"status": "ok"}

    @rpc
    @error_handler
    def register(self, data):
        username = data.get('username')
        password = data.get('password')
        phone = data.get('phone')
        email = data.get('email')
        role_name = data.get('role')

        if self.user_db.find_user_by_email(email):
            return {'message': 'User already exists', 'status': 409}

        current_directory = os.path.dirname(__file__)
        roles_folder_path = os.path.join(current_directory, f'roles/{role_name}/{role_name}.json')

        if not os.path.exists(roles_folder_path):
            return {'message': 'Role data not found', 'status': 400}

        with open(roles_folder_path, 'r') as file:
            data_roles = json.load(file)

        if data_roles['role_name'] != role_name:
            return {'message': 'Invalid role', 'status': 400}

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        new_user = {
            'username': username,
            'password': hashed_password,
            'phone': phone,
            'email': email,
            'roles': [role_name],
            'permissions': data_roles.get('permissions', {}),
            'notifications': [],
        }

        # If the role is mentor, add the additional status field as pending
        if role_name.lower() == 'mentor':
            new_user['status'] = 'pending'
            result = self.user_db.create_user(new_user)
            if result['_id']:
                approval_request_id = self.approval_dao.create_approval_request(
                self.approval_dao.ApprovalType.MENTOR,
                result['_id'],
            )
            return {'message': 'User created successfully', 'status': 200}

        self.user_db.create_user(new_user)

        return {'message': 'User created successfully', 'status': 200}

    @rpc
    @error_handler
    def signin(self, data):
        email = data.get('email')
        password = data.get('password')
        
        user_data = self.user_db.find_user_by_email(email)
        if user_data and bcrypt.checkpw(password.encode('utf-8'), user_data['password']):
            access_token = self._create_access_token(user_data)
            refresh_token = self._create_refresh_token(user_data)
            result = self._store_tokens(user_data['email'], access_token, refresh_token, str(user_data['_id']))
            
            # Check if the operation was acknowledged
            if result.acknowledged:
                return {'access_token': access_token, 'refresh_token': refresh_token, 'status': 200}
        
        return {'error': 'Invalid credentials', 'status': 401}

    @rpc
    @error_handler
    def refresh_token(self, refresh_token):
        try:
            payload = self._decode_token(refresh_token)
            if payload is None:
                raise jwt.InvalidTokenError
            user_id = payload.get('user_id')
            email = payload.get('sub')
            token_type = payload.get('type')
            if not user_id or not email or token_type != 'refresh':
                raise jwt.InvalidTokenError
        except jwt.InvalidTokenError:
            return {'error': 'Invalid refresh token', 'status': 401}

        user_data = self.user_db.find_user_by_user_id(user_id)
        if user_data is None:
            return {'error': 'User not found', 'status': 401}

        # Verify the refresh token exists and is valid
        if not self.token_db.verify_refresh_token(user_id, refresh_token):
            return {'error': 'Invalid or expired refresh token', 'status': 401}

        access_token = self._create_access_token(user_data)
        new_refresh_token = self._create_refresh_token(user_data)
        result = self._store_tokens(user_data['email'], access_token, new_refresh_token, user_id)
        
        if result.acknowledged:
            return {'access_token': access_token, 'refresh_token': new_refresh_token, 'status': 200}
        
        return {'error': 'Token update failed', 'status': 500}

    @rpc
    @error_handler
    def verify_token(self, token):
        payload = self._decode_token(token)
        if payload is None:
            return {'valid': False, 'message': 'Invalid token'}
        user_id = payload.get('user_id')
        if not user_id:
            return {'valid': False, 'message': 'Invalid token'}
        is_valid = self.token_db.verify_tokens(user_id, token)
        return {'valid': is_valid, 'message': 'Token is valid' if is_valid else 'Token is invalid'}

    @rpc
    @error_handler
    def signout(self, jwt_token):
        payload = self._decode_token(jwt_token)
        if payload is None:
            return {'message': 'Invalid token', 'status': 401}
        user_id = payload.get('user_id')
        token_type = payload.get('type')
        if not user_id:
            return {'message': 'Invalid token', 'status': 401}

        # Delete only the specific token used for signout
        result = self.token_db.delete_tokens(user_id, jwt_token)
        if result.modified_count > 0:
            return {'message': 'Logged out successfully', 'status': 200}
        else:
            return {'message': 'Token not found', 'status': 404}
          
    @rpc
    @error_handler
    def generate_otp(self, data):
        email = data.get('email')
        otp = str(random.randint(1000, 9999))
        otp_data = {
            'email': email,
            'otp': otp,
            'expireAt': datetime.utcnow() + timedelta(seconds=180),
        }
        logger.debug(f"Generated OTP: {otp_data}")

        self.otp_db.create_otp(otp_data)
        return {'message': 'OTP generated', 'status': 200}

    @rpc
    @error_handler
    def verify_otp_and_change_password(self, data):
        email = data.get('email')
        received_otp = data.get('otp')
        new_password = data.get('new_password')

        existing_otp_data = self.otp_db.find_otp(received_otp)

        if existing_otp_data and existing_otp_data['otp'] == received_otp:
            if existing_otp_data['expireAt'] > datetime.utcnow():
                hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
                self.user_db.update_user_password(email, hashed_password)
                # Optionally, delete the OTP after successful use
                self.otp_db.delete_otp(received_otp)
                return {'message': 'Password changed successfully', 'status': 200}
            else:
                return {'message': 'OTP has expired', 'status': 400}
        else:
            return {'message': 'Invalid OTP', 'status': 400}

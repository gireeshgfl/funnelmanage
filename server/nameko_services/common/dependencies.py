import redis
import json
from nameko.extensions import DependencyProvider
from pymongo import MongoClient
from datetime import datetime, date
from bson import ObjectId
from pydantic import BaseModel
import logging
from functools import wraps
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError,NetworkTimeout
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, stop_after_delay, wait_fixed
import threading
import boto3
import pika
import orjson
import queue
from pika.adapters.select_connection import SelectConnection
from pika.exceptions import AMQPConnectionError
from time import sleep



# Initialize the logger
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,  # Set to DEBUG to capture detailed logs
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]  # Output to console for simplicity
)

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, BaseModel):
            return obj.dict()
        return super().default(obj)

class RedisClient(DependencyProvider):
    def __init__(self, host='localhost', port=6379, db=0, retry_interval=5):
        """
        Initialize the RedisClient with default parameters.
        """
        self.host = host
        self.port = port
        self.db = db
        self.retry_interval = retry_interval
        self.client = None
        self.connected = False

    def setup(self):
        """
        Setup is called once when the service starts. We won't attempt to connect here
        to allow the service to start even if Redis is unavailable.
        """
        logger.debug("RedisClient setup completed without connecting to Redis.")

    def get_dependency(self, worker_ctx):
        """
        This method is called for each worker. We'll attempt to connect to Redis
        if not already connected.
        """
        if not self.connected:
            try:
                self.client = redis.Redis(host=self.host, port=self.port, db=self.db, decode_responses=True)
                self.client.ping()
                self.connected = True
                logger.info(f"Successfully connected to Redis at {self.host}:{self.port}")
            except redis.RedisError as e:
                logger.error(f"Failed to connect to Redis at {self.host}:{self.port} - {e}")
                self.client = None
                self.connected = False
        return self

    def stop(self):
        """
        Called when the service is stopping. We'll close the Redis connection gracefully.
        """
        self.close()

    def close(self):
        """
        Close the Redis connection if it's open.
        """
        if self.client:
            try:
                self.client.close()
                logger.info("Redis connection closed.")
            except redis.RedisError as e:
                logger.error(f"Error closing Redis connection: {e}")
            finally:
                self.client = None
                self.connected = False

    def _ensure_connection(self):
        """
        Ensure that there is an active Redis connection. Attempt to reconnect if disconnected.
        """
        if not self.connected:
            try:
                self.client = redis.Redis(host=self.host, port=self.port, db=self.db, decode_responses=True)
                self.client.ping()
                self.connected = True
                logger.info(f"Reconnected to Redis at {self.host}:{self.port}")
            except redis.RedisError as e:
                logger.error(f"Reconnection to Redis failed: {e}")
                self.client = None
                self.connected = False

    def set(self, key, value, ex=None):
        """
        Set a key-value pair in Redis with optional expiration.
        """
        if not self.connected:
            self._ensure_connection()
            if not self.connected:
                return False  # Optionally, you can raise an exception or handle differently

        try:
            logger.debug(f"Setting key '{key}' in Redis with expiration {ex}.")
            return self.client.set(key, value, ex=ex)
        except redis.RedisError as e:
            logger.error(f"Error setting key '{key}' in Redis: {e}")
            self.connected = False
            self.client = None
            return False

    def get(self, key):
        """
        Get the value of a key from Redis.
        """
        if not self.connected:
            self._ensure_connection()
            if not self.connected:
                return None

        try:
            logger.debug(f"Getting key '{key}' from Redis.")
            return self.client.get(key)
        except redis.RedisError as e:
            logger.error(f"Error getting key '{key}' from Redis: {e}")
            self.connected = False
            self.client = None
            return None

    def delete(self, key):
        """
        Delete a key from Redis.
        """
        if not self.connected:
            self._ensure_connection()
            if not self.connected:
                return False

        try:
            logger.debug(f"Deleting key '{key}' from Redis.")
            return self.client.delete(key)
        except redis.RedisError as e:
            logger.error(f"Error deleting key '{key}' from Redis: {e}")
            self.connected = False
            self.client = None
            return False

    def setex(self, key, value, ex):
        """
        Set a key with an expiration time.
        """
        return self.set(key, value, ex)

    def publish(self, channel, message):
        """
        Publish a message to a Redis channel.
        """
        if not self.connected:
            self._ensure_connection()
            if not self.connected:
                return 0  # Number of clients that received the message

        try:
            logger.debug(f"Publishing message to channel '{channel}'.")
            return self.client.publish(channel, message)
        except redis.RedisError as e:
            logger.error(f"Error publishing message to channel '{channel}': {e}")
            self.connected = False
            self.client = None
            return 0

class MongoDBClient:
    def __init__(self, config):
        self.config = config
        self.client = None
        self.db = None

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def connect(self):
        try:
            logger.debug("Attempting to connect to MongoDB...")
            self.client = MongoClient(
                self.config['MONGODB']['URI'],
                maxPoolSize=self.config['MONGODB']['MAX_POOL_SIZE'],
                minPoolSize=self.config['MONGODB']['MIN_POOL_SIZE'],
                maxIdleTimeMS=self.config['MONGODB']['MAX_IDLE_TIME_MS'],
                retryWrites=self.config['MONGODB']['RETRY_WRITES'],
                retryReads=self.config['MONGODB']['RETRY_READS'],
                connectTimeoutMS=self.config['MONGODB'].get('CONNECT_TIMEOUT_MS', 60000),
                socketTimeoutMS=self.config['MONGODB'].get('SOCKET_TIMEOUT_MS', 60000)
            )
            self.db = self.client[self.config['MONGODB']['DATABASE']]
            # Test the connection
            self.client.admin.command('ping')
            logger.debug("Successfully connected to MongoDB.")
        except (ConnectionFailure, ServerSelectionTimeoutError, NetworkTimeout) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    def close(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection pool")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def get_collection(self, name):
        if self.client is None:
            logger.warning("MongoDB client is not connected. Reconnecting...")
            self.connect()

        if name not in self.config['COLLECTIONS']:
            raise ValueError(f"Collection {name} not defined in configuration")

        collection = self.db[self.config['COLLECTIONS'][name]]
        logger.debug(f"Accessed collection: {name}")
        return collection
    
    

class MongoProvider(DependencyProvider):
    def setup(self):
        logger.debug("Setting up MongoProvider...")
        self.client = MongoDBClient(self.container.config)
        self.client.connect()

    def stop(self):
        logger.info("Stopping MongoProvider and closing MongoDB connection.")
        self.client.close()

    def get_dependency(self, worker_ctx):
        return self.client
    
class MongoDBClientAuth:
    def __init__(self, config):
        self.config = config
        self.client = None
        self.db = None

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def connect(self):
        try:
            logger.debug("Attempting to connect to MongoDB...")
            self.client = MongoClient(
                self.config['MONGODBEDUVOCATE']['URI'],
                maxPoolSize=self.config['MONGODB']['MAX_POOL_SIZE'],
                minPoolSize=self.config['MONGODB']['MIN_POOL_SIZE'],
                maxIdleTimeMS=self.config['MONGODB']['MAX_IDLE_TIME_MS'],
                retryWrites=self.config['MONGODB']['RETRY_WRITES'],
                retryReads=self.config['MONGODB']['RETRY_READS'],
                connectTimeoutMS=self.config['MONGODB'].get('CONNECT_TIMEOUT_MS', 60000),
                socketTimeoutMS=self.config['MONGODB'].get('SOCKET_TIMEOUT_MS', 60000)
            )
            self.db = self.client[self.config['MONGODBEDUVOCATE']['DATABASE']]
            # Test the connection
            self.client.admin.command('ping')
            logger.debug("Successfully connected to MongoDB.")
        except (ConnectionFailure, ServerSelectionTimeoutError, NetworkTimeout) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    def close(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection pool")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def get_collection(self, name):
        if self.client is None:
            logger.warning("MongoDB client is not connected. Reconnecting...")
            self.connect()

        if name not in self.config['COLLECTIONS']:
            raise ValueError(f"Collection {name} not defined in configuration")

        collection = self.db[self.config['COLLECTIONS'][name]]
        logger.debug(f"Accessed collection: {name}")
        return collection


class MongoProviderAuth(DependencyProvider):
    def setup(self):
        logger.debug("Setting up MongoProvider...")
        self.client = MongoDBClientAuth(self.container.config)
        self.client.connect()

    def stop(self):
        logger.info("Stopping MongoProvider and closing MongoDB connection.")
        self.client.close()

    def get_dependency(self, worker_ctx):
        return self.client
    
    
    
class S3Provider(DependencyProvider):
    """
    A Nameko dependency provider for creating and providing a boto3 S3 client.
    
    Expected configuration (in your service config):
    
    S3:
      AWS_ACCESS_KEY_ID: your-access-key
      AWS_SECRET_ACCESS_KEY: your-secret-key
      REGION_NAME: your-region         # (optional, defaults to "us-east-1")
      ENDPOINT_URL: http://localhost:4566  # (optional, e.g. for local testing with LocalStack or MinIO)
    """
    
    def setup(self):
        config = self.container.config.get("S3", {})
        aws_access_key_id = config.get("AWS_ACCESS_KEY_ID")
        aws_secret_access_key = config.get("AWS_SECRET_ACCESS_KEY")
        region_name = config.get("REGION_NAME", "us-east-1")
        endpoint_url = config.get("ENDPOINT_URL")  # Optional
        
        try:
            self.client = boto3.client(
                's3',
                aws_access_key_id=aws_access_key_id,
                aws_secret_access_key=aws_secret_access_key,
                region_name=region_name,
                endpoint_url=endpoint_url  # This will be None if not provided, which is acceptable.
            )
            logger.info("Successfully initialized S3 client.")
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {e}")
            raise

    def get_dependency(self, worker_ctx):
        """
        Return the S3 client. Boto3 clients are thread-safe,
        so it is safe to share the same instance across workers.
        """
        return self.client

    def stop(self):
        """
        Clean up the S3 provider if necessary. Boto3 clients do not
        require an explicit close; however, we can nullify the client.
        """
        logger.info("S3Provider is stopping. Clearing S3 client.")
        self.client = None

class AmqpPublisher(DependencyProvider):
    def __init__(self):
        self.connection = None
        self.channel = None
        self.logger = logging.getLogger(__name__)
        self.amqp_uri = None
        self.message_queue = queue.Queue()
        self.running = False
        self.thread = None

    def setup(self):
        self.amqp_uri = self.container.config.get('AMQP_URI', 'amqp://guest:guest@localhost:5672//')
        self.running = True
        self.thread = threading.Thread(target=self._run_ioloop, daemon=True)
        self.thread.start()

    @retry(
        stop=stop_after_delay(300),  # Retry for 5 minutes
        wait=wait_fixed(5),
        retry=retry_if_exception_type(AMQPConnectionError),
        before_sleep=lambda retry_state: logger.warning(
            f"Retrying RabbitMQ connection (attempt {retry_state.attempt_number}): {retry_state.outcome.exception()}"
        )
    )
    def _connect(self):
        parameters = pika.URLParameters(self.amqp_uri)
        self.connection = SelectConnection(
            parameters,
            on_open_callback=self._on_connection_open,
            on_close_callback=self._on_connection_closed,
            on_open_error_callback=self._on_connection_error
        )
        self.connection.ioloop.start()

    def _run_ioloop(self):
        while self.running:
            try:
                self._connect()
            except Exception as e:
                self.logger.error(f"RabbitMQ connection failed: {e}")
                if self.running:
                    sleep(5)

    def _on_connection_open(self, connection):
        self.connection = connection
        self.connection.channel(on_open_callback=self._on_channel_open)

    def _on_channel_open(self, channel):
        self.channel = channel
        self.channel.queue_declare(queue="points", durable=True)
        self.logger.info("RabbitMQ connection and channel established")
        self._process_queue()

    def _on_connection_closed(self, connection, reason):
        self.channel = None
        if self.running:
            self.logger.warning(f"Connection closed: {reason}. Reconnecting...")
            self.connection.ioloop.call_later(5, self.connection.ioloop.start)

    def _on_connection_error(self, connection, error):
        self.logger.error(f"Connection error: {error}. Retrying...")
        self.connection.ioloop.call_later(5, self.connection.ioloop.start)

    def stop(self):
        self.running = False
        if self.connection and not self.connection.is_closed:
            try:
                self.connection.close()
            except Exception as e:
                self.logger.error(f"Error closing RabbitMQ connection: {e}")
        if self.thread:
            self.thread.join(timeout=5)
        self.logger.info("RabbitMQ connection closed")

    def get_dependency(self, worker_ctx):
        service = worker_ctx.service
        self.logger = getattr(service, 'logger', self.logger)
        return self

    def publish(self, payload, queue_name="points"):
        serialized_payload = orjson.dumps(payload)
        self.message_queue.put((serialized_payload, queue_name))
        if self.channel and not self.channel.is_closed:
            self._process_queue()
        return True  # Optimistic success; failures logged in _process_queue

    def _process_queue(self):
        while not self.message_queue.empty() and self.channel and not self.channel.is_closed:
            try:
                serialized_payload, queue_name = self.message_queue.get()
                self.channel.basic_publish(
                    exchange="",
                    routing_key=queue_name,
                    body=serialized_payload,
                    properties=pika.BasicProperties(delivery_mode=2)
                )
                self.message_queue.task_done()
            except Exception as e:
                self.logger.error(f"Failed to publish message to queue '{queue_name}': {e}")



# Thread-local storage to hold the worker context
_thread_local = threading.local()

class WorkerContextProvider(DependencyProvider):
    def get_dependency(self, worker_ctx):
        _thread_local.worker_ctx = worker_ctx
        logger.debug(
            f"WorkerContextProvider: Service={worker_ctx.service_name}, Method={worker_ctx.entrypoint.method_name}"
        )

    def stop(self):
        if hasattr(_thread_local, 'worker_ctx'):
            logger.debug("WorkerContextProvider: Clearing worker_ctx from thread-local storage.")
            del _thread_local.worker_ctx

def get_worker_ctx():
    return getattr(_thread_local, 'worker_ctx', None)





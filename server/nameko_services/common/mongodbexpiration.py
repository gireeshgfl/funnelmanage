from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from datetime import datetime, timedelta

uri = "mongodb+srv://ameen:root@cluster0.iu4ktta.mongodb.net/?retryWrites=true&w=majority"

# Connect to MongoDB
client = MongoClient(uri, server_api=ServerApi('1'))
db = client["eduvocate"]

# Define collections and their respective expiration times in seconds
collections = {
    "users_token": 1200,
    # "otp": 180,
    # "captcha": 120
}

# Iterate over collections and set TTL indexes
for collection_name, expire_seconds in collections.items():
    current_collection = db[collection_name]
    current_collection.create_index("expireAt", expireAfterSeconds=expire_seconds, dropDups=True)

    # Insert document with the expireAt field
    document = {
        "expireAt": datetime.utcnow() + timedelta(seconds=expire_seconds)
    }
    current_collection.insert_one(document)

    # Print indexes for the current collection
    indexes = current_collection.index_information()
    print(f"Indexes for {collection_name}:", indexes)

import uuid

for i in range(100):
    unique_id = uuid.uuid4()
    shorter_code = str(unique_id.hex)[:8]  # Using the first 8 characters of the hex representation
    print(shorter_code)


# from pymongo import MongoClient
# from bson import ObjectId
# from datetime import datetime

# # MongoDB connection URI
# uri = 'mongodb+srv://freego:freego%2322Monkey@freego-c0.y47x2e3.mongodb.net'

# # Connect to the MongoDB server
# client = MongoClient(uri)

# # Select the database
# db = client.eduvocate

# # Select the collection
# collection = db.chat_room

# # Document to be inserted
# document = {
#     "_id": ObjectId("633a86724c76120008b79389"),
#     "name": "class room 1",
#     "description": "Open chat for everyone",
#     "created_at": datetime.fromisoformat("2024-01-30T20:22:00+00:00"),
#     "members": [
#         {
#             "username": "ameen@gmail.com",
#             "socket_id": "unique_socket_id_1",
#             "role": "member"
#         },
#         {
#             "username": "manu@gmail.com",
#             "socket_id": "unique_socket_id_2",
#             "role": "member"
#         },
#         {
#             "username": "afitha@gmail.com",
#             "socket_id": "admin_socket_id_1",
#             "role": "admin"
#         }
#     ]
# }

# # Insert the document
# result = collection.insert_one(document)

# # Print the inserted document's ID
# print(f"Document inserted with ID: {result.inserted_id}")

# # Close the MongoDB connection
# client.close()




# result = collection.update_one(
#     {"members.username": username_to_update},
#     {"$set": {"members.$.socket_id": new_socket_id}},
#     upsert=True
# )



# from pymongo import MongoClient

# # MongoDB connection URI
# uri = 'mongodb+srv://freego:freego%2322Monkey@freego-c0.y47x2e3.mongodb.net'

# # Connect to the MongoDB server
# client = MongoClient(uri)

# # Select the database
# db = client.eduvocate

# # Select the collection
# collection = db.chat_room

# # Function to fetch all socket IDs
# def get_all_socket_ids():
#     try:
#         # Find all documents in the collection
#         chat_rooms = collection.find()

#         # Extract socket IDs from each document
#         members = []
#         for chat_room in chat_rooms:
#             for member in chat_room['members']:
#                 members.append(member)

#         print('All Socket IDs:', members)
#     except Exception as e:
#         print(f"Error: {e}")
#     finally:
#         # Close the MongoDB connection
#         client.close()

# # Example usage
# get_all_socket_ids()

# import redis
# import json

# def update_key_fields(redis_host='localhost', redis_port=6379, key='ameenaaa', channel='my_channel'):
#     try:
#         redis_client = redis.StrictRedis(host=redis_host, port=redis_port, decode_responses=True)

#         new_field_values = {
#             "field1": "new_value1",
#             "field2": "new_value2",
#             "field3": "new_value3"
#         }

#         # Set the key as a hash (if it doesn't exist)
#         redis_client.hsetnx(key, '__dummy_field__', '__dummy_value__')

#         # Update the fields of the key using hset
#         for field, value in new_field_values.items():
#             redis_client.hset(key, field, value)

#         # Remove the dummy field (optional)
#         redis_client.hdel(key, '__dummy_field__')

#         # Publish a message to the channel to notify subscribers
#         message = f"Fields of key '{key}' updated to {new_field_values}"
#         redis_client.publish(channel, message)
#         print("Message published successfully.")
#     except Exception as e:
#         print(f"Error: {e}")

# if __name__ == "__main__":
#     update_key_fields()

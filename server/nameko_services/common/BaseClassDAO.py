import logging
from pymongo.errors import PyMongoError
from pymongo import ReturnDocument

logger = logging.getLogger(__name__)

class BaseDAO:
    def __init__(self, db_connection, collection_name):
        self.db = db_connection.db
        self.collection = self.db[collection_name]
        self.collection_name = collection_name

    def safe_operation(self, operation, *args, **kwargs):
        try:
            result = operation(*args, **kwargs)
            logger.debug(f"Successfully performed operation on {self.collection_name}")
            return result
        except PyMongoError as e:
            logger.error(f"MongoDB operation failed on {self.collection_name}: {str(e)}")
            raise

    def find_one(self, query, projection=None, **kwargs):
        """Finds a single document in the collection."""
        return self.safe_operation(self.collection.find_one, query, projection, **kwargs)

    def find_one_and_update(self, query, update, upsert=False, return_document=ReturnDocument.AFTER, **kwargs):
        """Finds a single document and updates it."""
        return self.safe_operation(
            self.collection.find_one_and_update,
            query,
            update,
            upsert=upsert,
            return_document=return_document,
            **kwargs
        )

    def find_many(self, query, projection=None, sort=None, skip=0, limit=0, **kwargs):
        """Finds multiple documents in the collection."""
        def operation():
            cursor = self.collection.find(query, projection, **kwargs)
            if sort:
                cursor = cursor.sort(sort)
            if skip:
                cursor = cursor.skip(skip)
            if limit:
                cursor = cursor.limit(limit)
            return list(cursor)
        return self.safe_operation(operation)

    def insert_one(self, data, **kwargs):
        """Inserts a single document into the collection."""
        return self.safe_operation(self.collection.insert_one, data, **kwargs)

    def insert_many(self, data, ordered=True, bypass_document_validation=False, **kwargs):
        """Inserts multiple documents into the collection."""
        return self.safe_operation(
            self.collection.insert_many,
            data,
            ordered=ordered,
            bypass_document_validation=bypass_document_validation,
            **kwargs
        )

    def update_one(self, query, update, upsert=False, **kwargs):
        """Updates a single document in the collection."""
        return self.safe_operation(
            self.collection.update_one,
            query,
            update,
            upsert=upsert,
            **kwargs
        )

    def update_many(self, query, update, upsert=False, **kwargs):
        """Updates multiple documents in the collection."""
        return self.safe_operation(
            self.collection.update_many,
            query,
            update,
            upsert=upsert,
            **kwargs
        )

    def update(self, query, update, upsert=False, **kwargs):
        """A generic update method that can be used for both single and multiple document updates."""
        # Choose between update_one and update_many based on the query and update parameters
        if isinstance(query, dict) and len(query) == 1 and not isinstance(update, dict):
            return self.update_one(query, update, upsert, **kwargs)
        return self.update_many(query, update, upsert, **kwargs)

    def delete_one(self, query, **kwargs):
        """Deletes a single document from the collection."""
        return self.safe_operation(self.collection.delete_one, query, **kwargs)

    def delete_many(self, query, **kwargs):
        """Deletes multiple documents from the collection."""
        return self.safe_operation(self.collection.delete_many, query, **kwargs)

    def replace_one(self, query, data, upsert=False, **kwargs):
        """Replaces a single document in the collection."""
        return self.safe_operation(
            self.collection.replace_one,
            query,
            data,
            upsert=upsert,
            **kwargs
        )

    def count_documents(self, query, **kwargs):
        """Counts the number of documents that match the query."""
        return self.safe_operation(self.collection.count_documents, query, **kwargs)

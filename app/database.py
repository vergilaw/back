from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from app.config import settings

# MongoDB Client
client = None
db = None


def connect_to_mongo():

    global client, db
    try:
        client = MongoClient(settings.MONGODB_URL)
        client.admin.command('ping')
        db = client[settings.MONGODB_DB_NAME]
        print(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")

        create_indexes()

        return db
    except ConnectionFailure as e:
        print(f"Could not connect to MongoDB: {e}")
        raise


def create_indexes():
    global db

    db.users.create_index("email", unique=True)
    db.users.create_index("role")

    db.products.create_index("category")
    db.products.create_index("name")
    db.products.create_index("is_available")

    print("Database indexes created")


def close_mongo_connection():
    global client
    if client:
        client.close()
        print("🔌 Disconnected from MongoDB")


def get_database():
    return db
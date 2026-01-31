from motor.motor_asyncio import AsyncIOMotorClient

from config import settings

# MongoDB client (initialized on startup)
db_client: AsyncIOMotorClient | None = None


def get_database():
    return db_client[settings.database_name]


def set_client(client: AsyncIOMotorClient | None):
    global db_client
    db_client = client

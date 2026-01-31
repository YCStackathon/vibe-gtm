from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    mongodb_uri: str


settings = Settings()

# MongoDB client (initialized on startup)
db_client: AsyncIOMotorClient | None = None


def get_database():
    return db_client["vibe_gtm"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global db_client
    db_client = AsyncIOMotorClient(settings.mongodb_uri)
    yield
    # Shutdown
    if db_client:
        db_client.close()


app = FastAPI(title="Vibe GTM API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5180",
        "https://vibe-gtm-web.onrender.com",
        "https://gtm.useparadigm.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/hello")
async def hello():
    return {"message": "Hello World from Vibe GTM!"}


@app.post("/api/test-document")
async def create_test_document():
    db = get_database()
    test_doc = {
        "name": "Test Document",
        "description": "This is a test document to verify MongoDB connection",
        "test": True,
    }
    result = await db.test_collection.insert_one(test_doc)
    # Return without _id (MongoDB mutates the doc and adds ObjectId)
    return {
        "inserted_id": str(result.inserted_id),
        "document": {k: v for k, v in test_doc.items() if k != "_id"},
    }

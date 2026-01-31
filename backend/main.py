from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "vibe_gtm"

    class Config:
        env_file = ".env"


settings = Settings()

# MongoDB client (initialized on startup)
db_client: AsyncIOMotorClient | None = None


def get_database():
    return db_client[settings.database_name]


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
        "http://localhost:5173",
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

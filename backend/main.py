import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
# Reduce noise from httpx
logging.getLogger("httpx").setLevel(logging.WARNING)
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from config import settings
from database import get_database, set_client
from routers import campaigns, extraction, identity, leads, proposal, proposals, webhooks


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    client = AsyncIOMotorClient(settings.mongodb_uri)
    set_client(client)
    yield
    # Shutdown
    client.close()


app = FastAPI(title="Vibe GTM API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5180",
        "https://vibe-gtm-web.onrender.com",
        "https://gtm.useparadigm.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(identity.router)
app.include_router(proposal.router)
app.include_router(campaigns.router)
app.include_router(extraction.router)
app.include_router(leads.router)
app.include_router(proposals.router)
app.include_router(webhooks.router)


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

from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from crawling.schemas import Claim
from proposal.matcher import find_matches
from proposal.schemas import (
    CreateUserProfileRequest,
    MatchRequest,
    ProposalResult,
    UserProfileResponse,
)

router = APIRouter(prefix="/api/proposal", tags=["proposal"])


@router.post("/user", response_model=UserProfileResponse)
async def create_user_profile(request: CreateUserProfileRequest):
    from main import get_database

    db = get_database()

    doc = {
        "name": request.name,
        "claims": [c.model_dump() for c in request.claims],
        "created_at": datetime.utcnow(),
    }

    result = await db.user_profiles.insert_one(doc)

    return UserProfileResponse(
        id=str(result.inserted_id),
        name=request.name,
        claims=request.claims,
        created_at=doc["created_at"],
    )


@router.get("/user/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str):
    from main import get_database

    db = get_database()

    try:
        doc = await db.user_profiles.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="User profile not found")

    return UserProfileResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        claims=doc["claims"],
        created_at=doc["created_at"],
    )


@router.post("/match", response_model=ProposalResult)
async def match_claims(request: MatchRequest):
    from main import get_database

    db = get_database()

    try:
        user_doc = await db.user_profiles.find_one({"_id": ObjectId(request.user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    if not user_doc:
        raise HTTPException(status_code=404, detail="User profile not found")

    try:
        target_doc = await db.verified_claims.find_one(
            {"_id": ObjectId(request.target_person_id)}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid target person ID format")

    if not target_doc:
        raise HTTPException(status_code=404, detail="Target person not found")

    verified_persons = target_doc.get("verified_persons", [])
    if not verified_persons:
        raise HTTPException(
            status_code=404, detail="No verified persons in target document"
        )

    target_person = verified_persons[0]
    target_name = target_person.get("person_name", "Unknown")
    target_claims = target_person.get("claims", [])

    user_claims = [Claim(**c) for c in user_doc.get("claims", [])]
    target_claims_parsed = [Claim(**c) for c in target_claims]

    result = find_matches(
        user_name=user_doc["name"],
        user_claims=user_claims,
        target_person_name=target_name,
        target_claims=target_claims_parsed,
    )

    return result

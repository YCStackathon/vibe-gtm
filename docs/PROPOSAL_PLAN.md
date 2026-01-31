# Proposal Module Implementation Plan

## Overview
Create a module that finds matching claims/interests between the user and a target person, returning structured matches via OpenAI.

## Data Flow
1. User profile with claims is stored in MongoDB (`user_profiles` collection)
2. Target person's verified claims exist in `verified_claims` collection
3. API fetches both, runs OpenAI matching, returns structured result

## Input/Output

**API Input:**
- `user_id: str` - User's MongoDB document ID
- `target_person_id: str` - Target's verified claims document ID

**Output (Structured via OpenAI):**
```python
class ProposalMatch(BaseModel):
    user_claim: str           # User's claim one-liner
    target_claim: str         # Target's matching claim one-liner
    match_reason: str         # Why these claims match

class ProposalResult(BaseModel):
    target_person_name: str
    matches: list[ProposalMatch]
    icebreaker_suggestions: list[str]  # 2-3 conversation starters
```

## Files to Create/Modify

### 1. Create `backend/proposal/__init__.py`
Module exports

### 2. Create `backend/proposal/schemas.py`
Define Pydantic models:
- `UserProfile` - User's stored profile with claims
- `ProposalMatch` - Individual match between claims
- `ProposalResult` - Full proposal with matches and icebreakers
- `MatchRequest` / `CreateUserProfileRequest` - API request schemas

### 3. Create `backend/proposal/matcher.py`
Core matching logic using OpenAI structured output:
- `find_matches(user_claims, target_claims) -> ProposalResult`
- Uses `client.beta.chat.completions.parse()` pattern from `search_extract/extractor.py`

### 4. Create `backend/routers/proposal.py`
FastAPI endpoints:
- `POST /api/proposal/user` - Create/update user profile with claims
- `GET /api/proposal/user/{user_id}` - Get user profile
- `POST /api/proposal/match` - Match user with target person

### 5. Modify `backend/main.py`
Register the new router

## MongoDB Collections

### `user_profiles` (new)
```python
{
    "_id": ObjectId,
    "name": str,
    "claims": [
        {"type": "interest", "one_liner": "Loves playing tennis", ...},
        {"type": "location", "one_liner": "Based in San Francisco", ...}
    ],
    "created_at": datetime
}
```

## Implementation Details

### Matching Logic (matcher.py)
```python
from openai import OpenAI
from .schemas import ProposalResult

def find_matches(
    user_claims: list[Claim],
    target_person_name: str,
    target_claims: list[Claim]
) -> ProposalResult:
    client = OpenAI()

    prompt = """Analyze the claims of two people and find meaningful matches.
    Look for:
    - Shared interests (tennis, reading, etc.)
    - Common experiences (same school, company, location)
    - Similar passions or hobbies
    - Cultural or community overlaps

    For each match, explain why it's relevant for outreach."""

    response = client.beta.chat.completions.parse(
        model="gpt-5-nano",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"USER CLAIMS:\n{format_claims(user_claims)}\n\nTARGET ({target_person_name}) CLAIMS:\n{format_claims(target_claims)}"}
        ],
        response_format=ProposalResult
    )
    return response.choices[0].message.parsed
```

### API Endpoint (routers/proposal.py)
```python
@router.post("/match")
async def match_claims(request: MatchRequest) -> ProposalResult:
    # Get target's verified claims from MongoDB
    # Call find_matches()
    # Return structured result
```

## Verification
1. Run `uv run ruff check .` and `uv run ruff format .`
2. Start server: `uv run uvicorn main:app --reload --port 8001`
3. Test endpoint with curl/Postman:
   ```bash
   curl -X POST http://localhost:8001/api/proposal/match \
     -H "Content-Type: application/json" \
     -d '{"user_id": "...", "target_person_id": "..."}'
   ```

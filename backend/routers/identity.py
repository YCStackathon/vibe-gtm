from fastapi import APIRouter, File, HTTPException, UploadFile

from schemas.profile import ProfileExtractionResponse
from services.reducto import extract_profile_from_pdf

router = APIRouter(prefix="/api/identity", tags=["identity"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/extract", response_model=ProfileExtractionResponse)
async def extract_profile(file: UploadFile = File(...)):
    """Extract founder profile from uploaded CV/resume PDF."""

    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File exceeds 10MB limit",
        )

    try:
        profile = await extract_profile_from_pdf(content)
        return ProfileExtractionResponse(profile=profile)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract profile: {e!s}",
        )

import logging
import tempfile
from pathlib import Path

from reducto import Reducto

from config import settings
from schemas.profile import Education, Experience, FounderProfile, SocialUrls

logger = logging.getLogger(__name__)

EXTRACT_SCHEMA = {
    "type": "object",
    "properties": {
        "profile": {
            "type": "object",
            "properties": {
                "firstName": {"type": "string", "description": "First name"},
                "middleName": {"type": "string", "description": "Middle name, optional"},
                "lastName": {"type": "string", "description": "Last name"},
                "currentJobTitle": {"type": "string", "description": "Current or last job title"},
            },
            "required": ["firstName", "lastName", "currentJobTitle"],
        },
        "professionalExperience": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "jobTitle": {"type": "string"},
                    "companyName": {"type": "string"},
                    "startDate": {"type": "string", "format": "date"},
                    "endDate": {"type": "string", "format": "date"},
                    "responsibilities": {"type": "string"},
                },
            },
        },
        "skills": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "skillName": {"type": "string"},
                },
            },
        },
        "summary": {"type": "string", "description": "Brief professional summary"},
        "urls": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "urlType": {"type": "string", "description": "Type (LinkedIn, GitHub, etc)"},
                    "url": {"type": "string"},
                },
            },
        },
        "education": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "institutionName": {"type": "string"},
                    "degree": {"type": "string"},
                    "fieldOfStudy": {"type": "string"},
                    "startDate": {"type": "string", "format": "date"},
                    "endDate": {"type": "string", "format": "date"},
                },
            },
        },
    },
    "required": ["profile", "professionalExperience", "skills", "summary", "urls", "education"],
}


def get_value(obj: dict | None, key: str, default=None):
    """Extract value from Reducto's {value: ..., citations: ...} structure."""
    if obj is None:
        return default
    field = obj.get(key)
    if field is None:
        return default
    if isinstance(field, dict) and "value" in field:
        return field["value"]
    return field


def parse_year(date_str: str | None) -> int | None:
    """Extract year from date string like '2024-01-01'."""
    if not date_str:
        return None
    try:
        return int(date_str.split("-")[0])
    except (ValueError, IndexError):
        return None


async def extract_profile_from_pdf(file_content: bytes) -> FounderProfile:
    """Extract founder profile from PDF using Reducto extract API."""
    logger.info("Starting PDF extraction...")

    client = Reducto(api_key=settings.reducto_api_key)

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_content)
        tmp_path = Path(tmp.name)

    try:
        logger.info("Uploading to Reducto...")
        upload = client.upload(file=tmp_path)

        logger.info("Running extract...")
        result = client.extract.run(
            input=upload,
            instructions={"schema": EXTRACT_SCHEMA},
            settings={"citations": {"enabled": True}},
        )

        # Get result data
        raw = result.result
        if hasattr(raw, "model_dump"):
            raw = raw.model_dump()
        elif hasattr(raw, "dict"):
            raw = raw.dict()

        logger.info(f"Raw extract result keys: {raw.keys() if raw else 'None'}")

        # Parse profile info - handle nested citation structure
        profile_data = raw.get("profile", {})
        # Profile itself might be wrapped in {value: ..., citations: ...}
        if isinstance(profile_data, dict) and "value" in profile_data:
            profile_data = profile_data.get("value", {})

        logger.info(f"Profile data: {profile_data}")

        first_name = get_value(profile_data, "firstName")
        middle_name = get_value(profile_data, "middleName")
        last_name = get_value(profile_data, "lastName")
        current_job_title = get_value(profile_data, "currentJobTitle")

        # Build full name
        name_parts = [p for p in [first_name, middle_name, last_name] if p]
        name = " ".join(name_parts) if name_parts else None

        # Parse social URLs
        phone = None
        social_urls = SocialUrls()
        for url_obj in raw.get("urls", []):
            url_type = get_value(url_obj, "urlType", "")
            url_val = get_value(url_obj, "url", "")
            if not url_val:
                continue
            # Ensure full URL
            if not url_val.startswith("http"):
                url_val = f"https://{url_val}"

            url_type_lower = url_type.lower() if url_type else ""
            if "mobile" in url_type_lower or "phone" in url_type_lower:
                phone = url_val
            elif "linkedin" in url_type_lower:
                social_urls.linkedin = url_val
            elif "github" in url_type_lower:
                social_urls.github = url_val
            elif "twitter" in url_type_lower or "x.com" in url_type_lower:
                social_urls.twitter = url_val
            elif "instagram" in url_type_lower:
                social_urls.instagram = url_val
            elif "facebook" in url_type_lower:
                social_urls.facebook = url_val
            elif "website" in url_type_lower or "personal" in url_type_lower:
                social_urls.website = url_val

        # Parse experience
        experience = []
        for exp in raw.get("professionalExperience", []):
            experience.append(
                Experience(
                    company=get_value(exp, "companyName"),
                    title=get_value(exp, "jobTitle"),
                    description=get_value(exp, "responsibilities"),
                    start_year=parse_year(get_value(exp, "startDate")),
                    end_year=parse_year(get_value(exp, "endDate")),
                )
            )

        # Parse education
        education = []
        for edu in raw.get("education", []):
            education.append(
                Education(
                    institution=get_value(edu, "institutionName"),
                    degree=get_value(edu, "degree"),
                    field_of_study=get_value(edu, "fieldOfStudy"),
                    start_year=parse_year(get_value(edu, "startDate")),
                    end_year=parse_year(get_value(edu, "endDate")),
                )
            )

        # Parse skills
        skills = []
        for skill in raw.get("skills", []):
            skill_name = get_value(skill, "skillName")
            if skill_name:
                skills.append(skill_name)
            elif isinstance(skill, str):
                skills.append(skill)

        logger.info(f"Extracted profile for: {name}")
        logger.info(f"  - First: {first_name}, Last: {last_name}")
        logger.info(f"  - Job title: {current_job_title}")
        logger.info(f"  - {len(experience)} experiences")
        logger.info(f"  - {len(education)} education entries")
        logger.info(f"  - {len(skills)} skills")

        return FounderProfile(
            name=name,
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            current_job_title=current_job_title,
            email=None,
            phone=phone,
            location=None,
            summary=get_value(raw, "summary"),
            skills=skills,
            education=education,
            experience=experience,
            social_urls=social_urls,
        )
    finally:
        tmp_path.unlink(missing_ok=True)

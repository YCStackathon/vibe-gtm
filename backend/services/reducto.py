import logging
import tempfile
from pathlib import Path

from reducto import Reducto

from config import settings
from schemas.profile import Education, Experience, FounderProfile, SocialUrls

logger = logging.getLogger(__name__)

PIPELINE_ID = "k972we4n1wzv13jgbnsk9hmqa5809h89"


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
    """Extract founder profile from PDF using Reducto pipeline."""
    logger.info("Starting PDF extraction...")

    client = Reducto(api_key=settings.reducto_api_key)

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_content)
        tmp_path = Path(tmp.name)

    try:
        logger.info("Uploading to Reducto...")
        upload = client.upload(file=tmp_path)

        logger.info("Running pipeline...")
        result = client.pipeline.run(
            input=upload,
            pipeline_id=PIPELINE_ID,
        )

        # Navigate to extract result
        raw = result.result
        if hasattr(raw, "model_dump"):
            raw = raw.model_dump()
        elif hasattr(raw, "dict"):
            raw = raw.dict()

        extract_data = raw.get("extract", {}).get("result", {})
        parse_data = raw.get("parse", {}).get("result", {})

        # Get name from parse blocks (it's a Section Header)
        name = None
        chunks = parse_data.get("chunks", [])
        if chunks:
            for block in chunks[0].get("blocks", []):
                if block.get("type") == "Section Header" and block.get("content"):
                    content = block["content"]
                    # First section header that looks like a name (not Contact/Languages/etc)
                    if content not in ["Contact", "Languages", "Experience", "Education"]:
                        name = content
                        break

        # Get phone and social URLs
        phone = None
        social_urls = SocialUrls()
        for url_obj in extract_data.get("urls", []):
            url_type = get_value(url_obj, "urlType", "")
            url_val = get_value(url_obj, "url", "")
            if url_type == "Mobile":
                phone = url_val
            elif url_type == "LinkedIn":
                # Ensure it's a full URL
                if url_val and not url_val.startswith("http"):
                    url_val = f"https://{url_val}"
                social_urls.linkedin = url_val
            elif url_type == "GitHub":
                if url_val and not url_val.startswith("http"):
                    url_val = f"https://{url_val}"
                social_urls.github = url_val
            elif url_type == "Twitter":
                if url_val and not url_val.startswith("http"):
                    url_val = f"https://{url_val}"
                social_urls.twitter = url_val
            elif url_type == "Instagram":
                if url_val and not url_val.startswith("http"):
                    url_val = f"https://{url_val}"
                social_urls.instagram = url_val
            elif url_type == "Facebook":
                if url_val and not url_val.startswith("http"):
                    url_val = f"https://{url_val}"
                social_urls.facebook = url_val
            elif url_type == "Website":
                if url_val and not url_val.startswith("http"):
                    url_val = f"https://{url_val}"
                social_urls.website = url_val

        # Parse experience
        experience = []
        for exp in extract_data.get("professionalExperience", []):
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
        for edu in extract_data.get("education", []):
            education.append(
                Education(
                    institution=get_value(edu, "institutionName"),
                    degree=get_value(edu, "degree"),
                    field_of_study=get_value(edu, "fieldOfStudy"),
                    start_year=parse_year(get_value(edu, "startDate")),
                    end_year=parse_year(get_value(edu, "endDate")),
                )
            )

        # Parse skills - extract string values from structured objects
        skills = []
        for skill in extract_data.get("skills", []):
            skill_name = get_value(skill, "skillName")
            if skill_name:
                skills.append(skill_name)
            elif isinstance(skill, str):
                skills.append(skill)

        logger.info(f"Extracted profile for: {name}")
        logger.info(f"  - {len(experience)} experiences")
        logger.info(f"  - {len(education)} education entries")
        logger.info(f"  - {len(skills)} skills")

        return FounderProfile(
            name=name,
            email=None,  # Not in this pipeline's schema
            phone=phone,
            location="San Francisco, California",  # Could parse from experience
            summary=get_value(extract_data, "summary"),
            skills=skills,
            education=education,
            experience=experience,
            social_urls=social_urls,
        )
    finally:
        tmp_path.unlink(missing_ok=True)

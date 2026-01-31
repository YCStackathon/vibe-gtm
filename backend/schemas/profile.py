from pydantic import BaseModel


class Education(BaseModel):
    institution: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    start_year: int | None = None
    end_year: int | None = None


class Experience(BaseModel):
    company: str | None = None
    title: str | None = None
    description: str | None = None
    start_year: int | None = None
    end_year: int | None = None


class SocialUrls(BaseModel):
    linkedin: str | None = None
    twitter: str | None = None
    github: str | None = None
    instagram: str | None = None
    facebook: str | None = None
    website: str | None = None


class FounderProfile(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    summary: str | None = None
    skills: list[str] = []
    education: list[Education] = []
    experience: list[Experience] = []
    social_urls: SocialUrls = SocialUrls()


class ProfileExtractionResponse(BaseModel):
    profile: FounderProfile
    citations: dict | None = None

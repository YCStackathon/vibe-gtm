from pathlib import Path

from pydantic_settings import BaseSettings

ROOT_DIR = Path(__file__).parent.parent


class Settings(BaseSettings):
    mongodb_uri: str
    database_name: str = "vibe_gtm"
    reducto_api_key: str = ""
    firecrawl_api_key: str = ""
    openai_api_key: str = ""

    class Config:
        env_file = ROOT_DIR / ".env"
        extra = "ignore"


settings = Settings()

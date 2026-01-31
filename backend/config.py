from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "vibe_gtm"
    reducto_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

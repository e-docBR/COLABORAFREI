"""Application settings loaded via pydantic-settings."""
from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = Field(default="development", alias="FLASK_ENV")
    secret_key: str = Field(default="dev-key", alias="SECRET_KEY")
    jwt_secret_key: str = Field(default="dev-jwt", alias="JWT_SECRET_KEY")
    database_url: str = Field(default="sqlite:///../data/boletins.db", alias="DATABASE_URL")
    allowed_origins: List[str] = Field(default_factory=lambda: ["http://localhost:5173"], alias="ALLOWED_ORIGINS")
    upload_folder: str = Field(default="../data/uploads", alias="UPLOAD_FOLDER")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "populate_by_name": True,
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

import os
import logging
import sys
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator
from typing import List, Optional

class Settings(BaseSettings):
    DATABASE_BACKEND: str = Field(default="sqlite")
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SECRET_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    SEC_USER_AGENT: Optional[str] = None
    MARKETAUX_API_KEY: Optional[str] = None
    RESEARCH_JOB_TIMEOUT_SECONDS: int = Field(default=3600)
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:5173", "http://127.0.0.1:5173"])
    LOG_LEVEL: str = Field(default="INFO")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode='after')
    def validate_supabase_config(self) -> 'Settings':
        if self.DATABASE_BACKEND.lower() == "supabase":
            if not self.SUPABASE_URL or not self.SUPABASE_SECRET_KEY:
                raise ValueError("SUPABASE_URL and SUPABASE_SECRET_KEY are required when DATABASE_BACKEND is 'supabase'")
        return self

# Centralized settings instance
settings = Settings()

def setup_logging():
    """Configure structured logging for the application."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )

    # Return a configured logger for immediate use
    return logging.getLogger("alpha_terminal")

logger = setup_logging()

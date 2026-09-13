from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: Literal["development", "testing", "staging", "production"] = "development"
    PROJECT_NAME: str = "iTerminal"
    API_V1_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./data/iterminal.db",
        description="SQLAlchemy async connection string",
    )

    # Redis
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection string",
    )
    REDIS_ENABLED: bool = False

    # ChromaDB
    CHROMA_PERSIST_DIRECTORY: str = "./data/chroma"

    # Ingestion & SEC
    SEC_USER_AGENT: str = "iTerminal Research admin@iterminal.local"
    SEC_RATE_LIMIT_PER_SEC: int = 10

    # Temporal
    TEMPORAL_HOST: str = "localhost:7233"
    TEMPORAL_NAMESPACE: str = "default"
    TEMPORAL_TASK_QUEUE: str = "research-task-queue"

    # LLM Providers (Optional for Phase 1 deterministic operations)
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()

"""Pipeline settings loaded from environment/.env."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class PipelineSettings(BaseSettings):
    """Runtime configuration shared by Dagster resources and scrapers."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = Field(
        default="postgresql://groceryview:groceryview@localhost:5432/groceryview",
        validation_alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379", validation_alias="REDIS_URL")
    object_storage_endpoint: str = Field(
        default="http://localhost:9000", validation_alias="OBJECT_STORAGE_ENDPOINT"
    )
    object_storage_bucket: str = Field(
        default="groceryview-raw", validation_alias="OBJECT_STORAGE_BUCKET"
    )
    user_agent: str = Field(
        default="GroceryViewBot/0.1 contact@example.com", validation_alias="USER_AGENT"
    )
    run_mode: str = Field(default="local", validation_alias="RUN_MODE")
    scrape_start_utc: str = Field(default="04:00", validation_alias="SCRAPE_START_UTC")
    scrape_end_utc: str = Field(default="08:45", validation_alias="SCRAPE_END_UTC")


@lru_cache(maxsize=1)
def get_settings() -> PipelineSettings:
    return PipelineSettings()

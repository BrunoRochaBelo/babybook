from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")

    database_url: str = "postgresql+asyncpg://babybook:babybook@localhost:5432/babybook_dev"
    secret_key: str = "dev-secret-key"
    cors_origins: list[str] = ["http://localhost:5173"]
    quota_storage_bytes: int = 2 * 1024 * 1024 * 1024
    quota_moments: int = 60
    quota_recurrent: int = 5


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

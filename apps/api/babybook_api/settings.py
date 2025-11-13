from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")

    database_url: str = "postgresql+asyncpg://babybook:babybook@localhost:5432/babybook_dev"
    secret_key: str = "dev-secret-key"
    cors_origins: list[str] = ["http://localhost:5173"]
    quota_storage_bytes: int = 2 * 1024 * 1024 * 1024
    quota_moments: int = 60
    quota_recurrent: int = 5
    csrf_token_ttl_seconds: int = 3600
    session_ttl_hours: int = 72
    session_cookie_secure: bool = False
    public_base_url: str = "https://share.babybook.dev"
    upload_part_bytes: int = 5 * 1024 * 1024
    upload_url_base: str = "https://uploads.dev.babybook"
    service_api_token: str = "service-token"
    billing_webhook_secret: str = "billing-secret"
    queue_provider: Literal["database", "cloudflare"] = "database"
    queue_visibility_timeout_seconds: int = 60
    cloudflare_account_id: str | None = None
    cloudflare_queue_name: str | None = None
    cloudflare_api_token: str | None = None
    cloudflare_api_base_url: str = "https://api.cloudflare.com/client/v4"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

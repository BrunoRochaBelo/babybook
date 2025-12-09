from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")

    app_env: Literal["local", "staging", "production"] = Field(default="local", alias="ENV")
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
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
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
    inline_worker_enabled: bool = Field(default=True, alias="INLINE_WORKER_ENABLED")
    dev_user_email: str = "bruno@example.com"
    dev_user_password: str = "password"
    
    # Storage - MinIO (local/dev)
    minio_endpoint: str = "http://localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "babybook-dev"
    minio_public_url: str = "http://localhost:9000/babybook-dev"
    
    # Storage - Cloudflare R2 (hot storage - production)
    r2_bucket: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_public_url: str | None = None
    r2_custom_domain: str | None = None
    
    # Storage - Backblaze B2 (cold storage - production)
    b2_bucket: str | None = None
    b2_endpoint: str = "https://s3.us-west-004.backblazeb2.com"
    b2_access_key_id: str | None = None
    b2_secret_access_key: str | None = None
    b2_region: str = "us-west-004"

    # ==========================================================================
    # Feature Flags
    # ==========================================================================
    # Control feature rollout without code changes
    # All flags default to True for new deployments
    
    # B2B2C Partner Portal - vouchers, deliveries, partner accounts
    feature_voucher_b2b2c: bool = Field(default=True, alias="FEATURE_VOUCHER_B2B2C")
    
    # Hybrid Storage - R2 (hot) + B2 (cold) strategy
    feature_r2_hybrid_storage: bool = Field(default=True, alias="FEATURE_R2_HYBRID_STORAGE")
    
    # Client-side transcoding with ffmpeg.wasm
    feature_client_transcode: bool = Field(default=True, alias="FEATURE_CLIENT_TRANSCODE")
    
    # Edge Worker file protection ("Porteiro Digital")
    feature_edge_file_protection: bool = Field(default=True, alias="FEATURE_EDGE_FILE_PROTECTION")
    
    # PIX payment method
    feature_pix_payment: bool = Field(default=False, alias="FEATURE_PIX_PAYMENT")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

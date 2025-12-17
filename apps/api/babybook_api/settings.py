from functools import lru_cache
from typing import Literal

import os

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
    # Se habilitado, o /uploads/complete valida tamanho e assinatura (magic bytes)
    # no storage antes de enfileirar o processamento. Em dev/tests pode ser desligado.
    upload_validation_enabled: bool = Field(default=False, alias="UPLOAD_VALIDATION_ENABLED")
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

    # ======================================================================
    # Deploy hardening (proxy/host)
    # ======================================================================
    # Starlette TrustedHostMiddleware allowlist.
    # - Em local, default "*" para não atrapalhar dev/tests.
    # - Em staging/prod, deve ser definido explicitamente e NÃO pode conter "*".
    allowed_hosts: list[str] = Field(default=["*"], alias="ALLOWED_HOSTS")

    # Lista de proxies confiáveis (IPs ou CIDR) para aceitar X-Forwarded-For.
    # Ex.: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
    trusted_proxy_ips: list[str] = Field(default=[], alias="TRUSTED_PROXY_IPS")

    # ======================================================================
    # Rate limiting / Anti-abuso
    # ======================================================================
    # Desabilitado por padrão para não atrapalhar dev/test.
    # Em staging/produção, habilite via env: RATE_LIMIT_ENABLED=true
    rate_limit_enabled: bool = Field(default=False, alias="RATE_LIMIT_ENABLED")
    
    # Storage - MinIO (local/dev)
    minio_endpoint: str = "http://localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "babybook-dev"
    minio_public_url: str = "http://localhost:9000/babybook-dev"
    
    # Storage - Cloudflare R2 (produção)
    r2_bucket: str | None = None
    r2_access_key_id: str | None = None
    r2_secret_access_key: str | None = None
    r2_public_url: str | None = None
    r2_custom_domain: str | None = None

    # ==========================================================================
    # Feature Flags
    # ==========================================================================
    # Control feature rollout without code changes
    # All flags default to True for new deployments
    
    # B2B2C Partner Portal - vouchers, deliveries, partner accounts
    feature_voucher_b2b2c: bool = Field(default=True, alias="FEATURE_VOUCHER_B2B2C")
    
    # Client-side transcoding with ffmpeg.wasm
    feature_client_transcode: bool = Field(default=True, alias="FEATURE_CLIENT_TRANSCODE")
    
    # Edge Worker file protection ("Porteiro Digital")
    feature_edge_file_protection: bool = Field(default=True, alias="FEATURE_EDGE_FILE_PROTECTION")
    
    # PIX payment method
    feature_pix_payment: bool = Field(default=False, alias="FEATURE_PIX_PAYMENT")

    # Upload resiliente (experimental). Mantemos desligado por padrão
    # até que tenha enforcement/atribuição 100% child-centric end-to-end.
    feature_resumable_uploads: bool = Field(default=False, alias="FEATURE_RESUMABLE_UPLOADS")


def _is_localhost_origin(origin: str) -> bool:
    o = origin.lower().strip()
    return (
        "localhost" in o
        or "127.0.0.1" in o
        or o.startswith("http://localhost")
        or o.startswith("http://127.0.0.1")
    )


def _looks_default_secret(value: str, *, defaults: set[str]) -> bool:
    v = (value or "").strip()
    return (not v) or (v in defaults)


def validate_settings_or_raise(s: "Settings") -> None:
    """Fail fast for unsafe configs in staging/production.

    Objetivo: evitar deploy acidental com defaults de dev.
    """

    if s.app_env == "local":
        return

    # ENV deve ser explicitamente informado em ambientes não-locais
    if os.getenv("ENV") is None:
        raise RuntimeError(
            "[babybook] Config insegura: ENV nao foi definido explicitamente para staging/producao."
        )

    # Host allowlist deve ser explícita (evita rodar com wildcard)
    if os.getenv("ALLOWED_HOSTS") is None:
        raise RuntimeError("[babybook] Config insegura: ALLOWED_HOSTS deve ser definido em staging/producao.")
    if not s.allowed_hosts:
        raise RuntimeError("[babybook] Config insegura: ALLOWED_HOSTS vazio em staging/producao.")
    if "*" in s.allowed_hosts:
        raise RuntimeError("[babybook] Config insegura: ALLOWED_HOSTS nao pode conter '*'.")
    for host in s.allowed_hosts:
        h = (host or "").strip().lower()
        if not h:
            raise RuntimeError("[babybook] Config insegura: ALLOWED_HOSTS contem valor vazio.")
        if h in {"localhost", "127.0.0.1"}:
            raise RuntimeError("[babybook] Config insegura: ALLOWED_HOSTS nao pode conter localhost/127.0.0.1.")

    if _looks_default_secret(s.secret_key, defaults={"dev-secret-key"}):
        raise RuntimeError("[babybook] Config insegura: SECRET_KEY (API_SECRET_KEY) invalido/default.")

    if _looks_default_secret(s.billing_webhook_secret, defaults={"billing-secret"}):
        raise RuntimeError("[babybook] Config insegura: BILLING_WEBHOOK_SECRET invalido/default.")

    if _looks_default_secret(s.service_api_token, defaults={"service-token"}):
        raise RuntimeError("[babybook] Config insegura: SERVICE_API_TOKEN invalido/default.")

    # Sessao por cookie deve ser Secure em prod/staging
    if s.session_cookie_secure is not True:
        raise RuntimeError("[babybook] Config insegura: SESSION_COOKIE_SECURE deve ser true em staging/producao.")

    # URLs publicas devem ser https
    for name, url in (
        ("FRONTEND_URL", s.frontend_url),
        ("PUBLIC_BASE_URL", s.public_base_url),
        ("UPLOAD_URL_BASE", s.upload_url_base),
    ):
        u = (url or "").strip()
        if not u.startswith("https://"):
            raise RuntimeError(f"[babybook] Config insegura: {name} deve usar https:// (atual: {u!r}).")

    # CORS: em staging/prod, nada de localhost e preferencialmente https
    if not s.cors_origins:
        raise RuntimeError("[babybook] Config insegura: CORS_ORIGINS vazio em staging/producao.")
    for origin in s.cors_origins:
        o = (origin or "").strip()
        if _is_localhost_origin(o):
            raise RuntimeError(f"[babybook] Config insegura: CORS_ORIGINS nao pode conter localhost (atual: {o!r}).")
        if not o.startswith("https://"):
            raise RuntimeError(f"[babybook] Config insegura: CORS_ORIGINS deve usar https:// (atual: {o!r}).")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    s = Settings()
    validate_settings_or_raise(s)
    return s


settings = get_settings()

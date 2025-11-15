from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from tempfile import gettempdir


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env(name: str, *fallbacks: str, default: str | None = None) -> str | None:
    candidates = (name, *fallbacks)
    for candidate in candidates:
        if not candidate:
            continue
        value = os.getenv(candidate)
        if value:
            return value
    return default


@dataclass(slots=True)
class WorkerSettings:
    database_url: str
    api_base_url: str
    service_api_token: str
    storage_endpoint: str
    storage_region: str
    storage_access_key: str
    storage_secret_key: str
    bucket_uploads: str
    bucket_derivatives: str
    bucket_exports: str
    force_path_style: bool
    tmp_dir: Path
    ffmpeg_path: str
    ffprobe_path: str


@lru_cache(maxsize=1)
def get_settings() -> WorkerSettings:
    database_url = _env(
        "WORKER_DATABASE_URL",
        "DATABASE_URL",
        default="postgresql+asyncpg://babybook:babybook@localhost:5432/babybook_dev",
    )
    api_base_url = _env("WORKER_API_BASE_URL", "API_BASE_URL", default="http://localhost:8000") or "http://localhost:8000"
    service_api_token = os.getenv("SERVICE_API_TOKEN", "service-token")
    storage_endpoint = _env(
        "STORAGE_ENDPOINT_URL",
        "S3_ENDPOINT_URL",
        "MINIO_ENDPOINT",
        default="http://localhost:9000",
    )
    storage_region = _env("STORAGE_REGION", "MINIO_REGION", default="us-east-1") or "us-east-1"
    storage_access_key = _env(
        "STORAGE_ACCESS_KEY",
        "S3_ACCESS_KEY_ID",
        "MINIO_ROOT_USER",
        default="minioadmin",
    )
    storage_secret_key = _env(
        "STORAGE_SECRET_KEY",
        "S3_SECRET_ACCESS_KEY",
        "MINIO_ROOT_PASSWORD",
        default="minioadmin",
    )
    bucket_uploads = _env("STORAGE_BUCKET_UPLOADS", default="babybook-uploads") or "babybook-uploads"
    bucket_derivatives = _env("STORAGE_BUCKET_DERIVATIVES") or bucket_uploads
    bucket_exports = _env("STORAGE_BUCKET_EXPORTS") or bucket_derivatives
    tmp_base = Path(os.getenv("WORKER_TMP_DIR", os.path.join(gettempdir(), "babybook-workers")))
    tmp_base.mkdir(parents=True, exist_ok=True)
    ffmpeg_path = os.getenv("FFMPEG_PATH", "ffmpeg")
    ffprobe_path = os.getenv("FFPROBE_PATH", "ffprobe")
    return WorkerSettings(
        database_url=database_url or "",
        api_base_url=api_base_url,
        service_api_token=service_api_token,
        storage_endpoint=storage_endpoint or "",
        storage_region=storage_region,
        storage_access_key=storage_access_key or "",
        storage_secret_key=storage_secret_key or "",
        bucket_uploads=bucket_uploads,
        bucket_derivatives=bucket_derivatives,
        bucket_exports=bucket_exports,
        force_path_style=_env_bool("STORAGE_FORCE_PATH_STYLE", True),
        tmp_dir=tmp_base,
        ffmpeg_path=ffmpeg_path,
        ffprobe_path=ffprobe_path,
    )


settings = get_settings()

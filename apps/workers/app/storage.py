from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncIterator

import aioboto3
from botocore.config import Config

from .settings import get_settings, WorkerSettings

logger = logging.getLogger(__name__)


class StorageClient:
    def __init__(self, settings: WorkerSettings | None = None) -> None:
        self._settings = settings or get_settings()
        self._session = aioboto3.Session()
        self._client_kwargs = {
            "endpoint_url": self._settings.storage_endpoint,
            "region_name": self._settings.storage_region,
            "aws_access_key_id": self._settings.storage_access_key,
            "aws_secret_access_key": self._settings.storage_secret_key,
            "config": Config(s3={"addressing_style": "path"}) if self._settings.force_path_style else None,
        }

    @asynccontextmanager
    async def _client(self) -> AsyncIterator[Any]:
        async with self._session.client("s3", **{k: v for k, v in self._client_kwargs.items() if v is not None}) as client:
            yield client

    async def download_file(self, *, bucket: str, key: str, destination: Path) -> None:
        destination.parent.mkdir(parents=True, exist_ok=True)
        logger.debug("Downloading s3://%s/%s -> %s", bucket, key, destination)
        async with self._client() as client:
            await client.download_file(bucket, key, str(destination))

    async def upload_file(
        self,
        *,
        bucket: str,
        key: str,
        source: Path,
        content_type: str | None = None,
    ) -> None:
        logger.debug("Uploading %s -> s3://%s/%s", source, bucket, key)
        extra: dict[str, str] | None = None
        if content_type:
            extra = {"ContentType": content_type}
        async with self._client() as client:
            await client.upload_file(str(source), bucket, key, ExtraArgs=extra)

    async def delete_object(self, *, bucket: str, key: str) -> None:
        logger.debug("Deleting s3://%s/%s", bucket, key)
        async with self._client() as client:
            await client.delete_object(Bucket=bucket, Key=key)

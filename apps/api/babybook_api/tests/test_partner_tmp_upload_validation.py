from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

import pytest

from babybook_api.storage.base import (
    ObjectInfo,
    PresignedUrlResult,
    StorageConfig,
    StorageProvider,
    UploadPartInfo,
)
from babybook_api.storage.partner_service import PartnerStorageService, PartnerUploadValidationError
from babybook_api.schemas.partner_portal import ALLOWED_CONTENT_TYPES, MAX_UPLOAD_SIZE_BYTES


class FakeStorage(StorageProvider):
    def __init__(self, *, header: bytes, size: int) -> None:
        super().__init__(StorageConfig(provider="minio", bucket="test"))
        self._header = header
        self._size = size
        self.deleted: list[str] = []

    @property
    def provider_name(self) -> str:
        return "fake"

    async def initialize(self) -> None:
        return None

    async def close(self) -> None:
        return None

    async def get_object(self, key: str) -> bytes:
        raise NotImplementedError

    async def get_object_range(self, key: str, *, start: int, end: int) -> bytes:
        return self._header

    async def get_object_info(self, key: str) -> ObjectInfo | None:
        return ObjectInfo(key=key, size=self._size, content_type=None, last_modified=datetime.utcnow())

    async def object_exists(self, key: str) -> bool:
        return True

    async def list_objects(self, prefix: str, max_keys: int = 1000, continuation_token: str | None = None):
        raise NotImplementedError

    async def put_object(self, key: str, data: bytes, content_type: str | None = None, metadata: dict[str, str] | None = None) -> ObjectInfo:
        raise NotImplementedError

    async def delete_object(self, key: str) -> bool:
        self.deleted.append(key)
        return True

    async def delete_objects(self, keys: list[str]) -> list[str]:
        raise NotImplementedError

    async def copy_object(self, source_key: str, dest_key: str, dest_bucket: str | None = None) -> ObjectInfo:
        raise NotImplementedError

    async def generate_presigned_get_url(
        self,
        key: str,
        expires_in: timedelta = timedelta(hours=1),
        response_content_type: str | None = None,
        response_content_disposition: str | None = None,
    ) -> PresignedUrlResult:
        raise NotImplementedError

    async def generate_presigned_put_url(
        self,
        key: str,
        expires_in: timedelta = timedelta(hours=1),
        content_type: str | None = None,
        content_length_range: tuple[int, int] | None = None,
        metadata: dict[str, str] | None = None,
    ) -> PresignedUrlResult:
        raise NotImplementedError

    async def create_multipart_upload(self, key: str, content_type: str | None = None, metadata: dict[str, str] | None = None) -> str:
        raise NotImplementedError

    async def generate_presigned_part_urls(
        self,
        key: str,
        upload_id: str,
        part_count: int,
        expires_in: timedelta = timedelta(hours=1),
    ) -> list[UploadPartInfo]:
        raise NotImplementedError

    async def complete_multipart_upload(self, key: str, upload_id: str, parts: list[dict]) -> ObjectInfo:
        raise NotImplementedError

    async def abort_multipart_upload(self, key: str, upload_id: str) -> None:
        raise NotImplementedError


@pytest.mark.asyncio
async def test_validate_tmp_upload_ok() -> None:
    header = b"\xFF\xD8\xFF\xE0" + b"\x00" * 64
    provider = FakeStorage(header=header, size=1234)
    service = PartnerStorageService(provider)

    info = await service.validate_tmp_upload(
        tmp_key="tmp/uploads/1/photo.jpg",
        declared_content_type="image/jpeg",
        declared_size_bytes=1234,
        max_size_bytes=MAX_UPLOAD_SIZE_BYTES,
        allowed_content_types=set(ALLOWED_CONTENT_TYPES),
    )
    assert info.size == 1234
    assert provider.deleted == []


@pytest.mark.asyncio
async def test_validate_tmp_upload_rejects_mismatch_and_deletes() -> None:
    # ftyp isom => video/mp4
    header = b"\x00\x00\x00\x18ftypisom" + b"\x00" * 64
    provider = FakeStorage(header=header, size=100)
    service = PartnerStorageService(provider)

    with pytest.raises(PartnerUploadValidationError) as exc:
        await service.validate_tmp_upload(
            tmp_key="tmp/uploads/1/file.jpg",
            declared_content_type="image/jpeg",
            declared_size_bytes=100,
            max_size_bytes=MAX_UPLOAD_SIZE_BYTES,
            allowed_content_types=set(ALLOWED_CONTENT_TYPES),
        )

    assert exc.value.code in {"upload.signature.invalid", "upload.validation.failed"}
    assert provider.deleted == ["tmp/uploads/1/file.jpg"]


@pytest.mark.asyncio
async def test_validate_tmp_upload_rejects_oversize_and_deletes() -> None:
    header = b"\xFF\xD8\xFF\xE0" + b"\x00" * 64
    provider = FakeStorage(header=header, size=MAX_UPLOAD_SIZE_BYTES + 1)
    service = PartnerStorageService(provider)

    with pytest.raises(PartnerUploadValidationError) as exc:
        await service.validate_tmp_upload(
            tmp_key="tmp/uploads/1/photo.jpg",
            declared_content_type="image/jpeg",
            declared_size_bytes=MAX_UPLOAD_SIZE_BYTES + 1,
            max_size_bytes=MAX_UPLOAD_SIZE_BYTES,
            allowed_content_types=set(ALLOWED_CONTENT_TYPES),
        )

    assert exc.value.code == "upload.size.exceeded"
    assert provider.deleted == ["tmp/uploads/1/photo.jpg"]

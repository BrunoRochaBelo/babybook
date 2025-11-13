from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

AssetKind = Literal["photo", "video", "audio"]
AssetStatus = Literal["queued", "processing", "ready", "failed"]
AssetScope = Literal["moment", "guestbook", "vault", "pod_preview", "health"]


class UploadInitRequest(BaseModel):
    filename: str = Field(..., max_length=255)
    size: int = Field(..., gt=0)
    mime: str = Field(..., max_length=180)
    sha256: str = Field(..., min_length=32, max_length=128)
    kind: AssetKind | None = None
    scope: AssetScope | None = None


class UploadInitResponse(BaseModel):
    asset_id: str
    status: AssetStatus
    upload_id: str | None = None
    key: str | None = None
    parts: list[int] | None = None
    urls: list[str] | None = None
    deduplicated: bool = False


class UploadPartEtag(BaseModel):
    part: int = Field(..., ge=1)
    etag: str = Field(..., min_length=1)


class UploadCompleteRequest(BaseModel):
    upload_id: UUID
    etags: list[UploadPartEtag]


class UploadCompleteResponse(BaseModel):
    asset_id: str
    status: AssetStatus


class AssetVariantInput(BaseModel):
    preset: str = Field(..., max_length=80)
    key: str = Field(..., max_length=255)
    size_bytes: int = Field(..., gt=0)
    width_px: int | None = Field(default=None, ge=1)
    height_px: int | None = Field(default=None, ge=1)
    kind: AssetKind


class AssetStatusUpdate(BaseModel):
    status: AssetStatus | None = None
    duration_ms: int | None = Field(default=None, ge=0)
    error_code: str | None = Field(default=None, max_length=120)
    viewer_accessible: bool | None = None
    variants: list[AssetVariantInput] | None = None

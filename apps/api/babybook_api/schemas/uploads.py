"""
Schemas para Upload Resiliente
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


UploadStatusType = Literal[
    "initiated", "uploading", "processing", "completed", "failed", "expired", "cancelled"
]


class ResumableUploadInitRequest(BaseModel):
    """Request para iniciar upload resumível"""
    filename: str = Field(..., min_length=1, max_length=255)
    mime: str = Field(..., description="Tipo MIME do arquivo")
    size: int = Field(..., gt=0, description="Tamanho total em bytes")
    sha256: str | None = Field(default=None, description="Hash SHA256 para deduplicação")
    part_size: int | None = Field(default=None, ge=5*1024*1024, description="Tamanho de cada parte (min 5MB)")
    kind: Literal["photo", "video", "audio", "document"] | None = None
    scope: Literal["moment", "vault", "delivery"] | None = None
    metadata: dict[str, Any] | None = None


class UploadPartUrl(BaseModel):
    """URL para upload de uma parte"""
    part_number: int
    url: str
    headers: dict[str, str] = {}


class ResumableUploadInitResponse(BaseModel):
    """Response da inicialização de upload resumível"""
    session_id: str
    asset_id: str
    storage_key: str
    total_parts: int
    part_size: int
    part_urls: list[UploadPartUrl]
    expires_at: datetime
    already_uploaded_parts: list[int] = []
    
    # Para deduplicação
    deduplicated: bool = False
    existing_asset_id: str | None = None


class RegisterPartRequest(BaseModel):
    """Request para registrar parte enviada"""
    part_number: int = Field(..., ge=1)
    etag: str = Field(..., min_length=1)
    size: int = Field(..., ge=0)


class RegisterPartResponse(BaseModel):
    """Response do registro de parte"""
    success: bool
    parts_uploaded: int
    parts_remaining: int
    progress_percent: float


class ResumableUploadCompleteRequest(BaseModel):
    """Request para completar upload resumível"""
    session_id: str
    etags: list[str] | None = None  # Opcional se já registradas via register_part


class ResumableUploadCompleteResponse(BaseModel):
    """Response da conclusão de upload"""
    asset_id: str
    storage_key: str
    etag: str
    size: int
    status: UploadStatusType


class UploadSessionStatus(BaseModel):
    """Status completo de uma sessão de upload"""
    session_id: str
    asset_id: str
    filename: str
    mime_type: str
    total_size: int
    status: UploadStatusType
    
    # Progresso
    total_parts: int
    uploaded_parts: int
    bytes_uploaded: int
    progress_percent: float
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    expires_at: datetime | None
    completed_at: datetime | None


class CancelUploadResponse(BaseModel):
    """Response do cancelamento de upload"""
    success: bool
    message: str

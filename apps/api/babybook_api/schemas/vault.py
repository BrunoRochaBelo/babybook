from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

VaultKind = Literal["certidao", "cpf_rg", "sus_plano", "outro"]


class VaultDocumentCreate(BaseModel):
    child_id: UUID
    kind: VaultKind
    asset_id: UUID
    note: str | None = Field(default=None, max_length=2000)


class VaultDocumentResponse(BaseModel):
    id: str
    child_id: str
    kind: VaultKind
    asset_id: str
    note: str | None
    created_at: datetime


class PaginatedVaultDocuments(BaseModel):
    items: list[VaultDocumentResponse]
    next: str | None = None

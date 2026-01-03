from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field
from typing import Literal


GuestbookRelationshipDegree = Literal[
    "mae",
    "pai",
    "tio",
    "tia",
    "irmao_irma",
    "avo",
    "avoa",
    "amigo",
    "madrasta",
    "padrasto",
]


class GuestbookCreate(BaseModel):
    child_id: UUID
    author_name: str = Field(..., min_length=1, max_length=120)
    author_email: str | None = Field(default=None)
    relationship_degree: GuestbookRelationshipDegree
    message: str = Field(..., min_length=1, max_length=2000)
    asset_id: UUID | None = None


class GuestbookEntryResponse(BaseModel):
    id: str
    child_id: str
    author_name: str
    author_email: str | None
    relationship_degree: GuestbookRelationshipDegree
    message: str
    status: str
    created_at: datetime
    asset_id: str | None = None


class PaginatedGuestbook(BaseModel):
    items: list[GuestbookEntryResponse]
    next: str | None = None

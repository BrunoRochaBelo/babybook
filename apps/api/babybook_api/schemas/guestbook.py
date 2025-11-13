from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class GuestbookCreate(BaseModel):
    child_id: UUID
    author_name: str = Field(..., min_length=1, max_length=120)
    author_email: str | None = Field(default=None)
    message: str = Field(..., min_length=1, max_length=2000)


class GuestbookEntryResponse(BaseModel):
    id: str
    child_id: str
    author_name: str
    author_email: str | None
    message: str
    status: str
    created_at: datetime


class PaginatedGuestbook(BaseModel):
    items: list[GuestbookEntryResponse]
    next: str | None = None

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

MomentPrivacy = Literal["private", "people", "public"]
MomentStatus = Literal["draft", "published", "archived"]


class MomentCreate(BaseModel):
    child_id: UUID
    template_key: str | None = None
    title: str = Field(..., min_length=1, max_length=160)
    summary: str | None = Field(default=None, max_length=5000)
    occurred_at: datetime | None = None
    privacy: MomentPrivacy = "private"
    payload: dict[str, Any] | None = None


class MomentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    summary: str | None = Field(default=None, max_length=5000)
    occurred_at: datetime | None = None
    privacy: MomentPrivacy | None = None
    payload: dict[str, Any] | None = None


class MomentResponse(BaseModel):
    id: str
    child_id: str
    template_key: str | None
    title: str
    summary: str | None
    occurred_at: datetime | None
    status: MomentStatus
    privacy: MomentPrivacy
    payload: dict[str, Any] | None
    rev: int
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None


class PaginatedMoments(BaseModel):
    items: list[MomentResponse]
    next: str | None = None


class PublishResponse(BaseModel):
    status: MomentStatus
    published_at: datetime | None

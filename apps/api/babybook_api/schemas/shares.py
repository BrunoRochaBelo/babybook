from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ShareCreate(BaseModel):
    password: str | None = Field(default=None, min_length=6, max_length=128)
    expires_at: datetime | None = None


class ShareCreatedResponse(BaseModel):
    id: str
    moment_id: str
    token: str
    url: str
    expires_at: datetime | None

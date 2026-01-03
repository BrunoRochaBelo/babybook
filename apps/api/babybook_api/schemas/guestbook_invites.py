from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from babybook_api.schemas.guestbook import GuestbookRelationshipDegree


class GuestbookInviteCreate(BaseModel):
    child_id: UUID
    invited_email: EmailStr | None = Field(default=None)
    expires_at: datetime | None = None


class GuestbookInviteCreatedResponse(BaseModel):
    id: str
    token: str
    url: str
    child_id: str
    invited_email: str | None
    expires_at: datetime | None


class GuestbookInvitePublicMeta(BaseModel):
    token: str
    child_id: str
    child_name: str
    invited_email: str | None
    expires_at: datetime | None


class GuestbookPublicCreateFromInvite(BaseModel):
    author_name: str = Field(..., min_length=1, max_length=120)
    author_email: EmailStr | None = Field(default=None)
    relationship_degree: GuestbookRelationshipDegree
    message: str = Field(..., min_length=1, max_length=2000)
    asset_id: UUID | None = None


class GuestbookModerateRequest(BaseModel):
    relationship_degree: GuestbookRelationshipDegree | None = None

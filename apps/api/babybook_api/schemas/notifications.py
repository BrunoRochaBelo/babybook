"""
Schemas para Notificações de Usuário.

Usados tanto no B2C (app) quanto no B2B (partner portal).
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


NotificationType = Literal[
    "milestone",
    "health",
    "guestbook",
    "memory",
    "photo",
    "gift",
    "system",
    "redemption",
    "credits",
]


class NotificationItem(BaseModel):
    """Uma notificação individual."""

    id: str
    type: NotificationType
    title: str
    description: str | None = None
    link: str | None = None
    unread: bool = True
    time: str  # Formato amigável (e.g., "Há 2 horas")
    created_at: datetime


class NotificationsListResponse(BaseModel):
    """Lista de notificações."""

    items: list[NotificationItem] = Field(default_factory=list)
    total: int = 0
    unread_count: int = 0


class UnreadCountResponse(BaseModel):
    """Contagem de notificações não lidas."""

    unread_count: int = 0


class MarkReadRequest(BaseModel):
    """Request para marcar notificação como lida."""

    pass  # Body vazio, usa path param


class MarkAllReadRequest(BaseModel):
    """Request para marcar todas como lidas."""

    pass  # Body vazio


class NotificationPreferences(BaseModel):
    """Preferências de notificação do usuário."""

    # B2C
    notify_milestones: bool = True
    notify_health: bool = True
    notify_guestbook: bool = True
    notify_memories: bool = True
    notify_photos: bool = True
    notify_gifts: bool = True
    notify_updates: bool = False

    # B2B
    notify_redemptions: bool = True
    notify_credits: bool = True

    # Canais
    push_enabled: bool = True
    email_enabled: bool = False


class PreferencesUpdateRequest(BaseModel):
    """Request para atualizar preferências."""

    notify_milestones: bool | None = None
    notify_health: bool | None = None
    notify_guestbook: bool | None = None
    notify_memories: bool | None = None
    notify_photos: bool | None = None
    notify_gifts: bool | None = None
    notify_updates: bool | None = None
    notify_redemptions: bool | None = None
    notify_credits: bool | None = None
    push_enabled: bool | None = None
    email_enabled: bool | None = None

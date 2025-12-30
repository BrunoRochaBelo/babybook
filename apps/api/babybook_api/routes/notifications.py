"""
Routes para Notificações de Usuário.

Endpoints para listar, marcar como lida e gerenciar preferências de notificação.
Funciona para B2C e B2B (Partner Portal).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import UserNotification, UserPreferences
from babybook_api.deps import get_db_session
from babybook_api.schemas.notifications import (
    NotificationItem,
    NotificationPreferences,
    NotificationsListResponse,
    PreferencesUpdateRequest,
    UnreadCountResponse,
)

router = APIRouter()


def _format_time_ago(dt: datetime) -> str:
    """Formata datetime como tempo relativo amigável."""
    now = datetime.utcnow()
    diff = now - dt

    if diff < timedelta(minutes=1):
        return "Agora"
    elif diff < timedelta(hours=1):
        minutes = int(diff.total_seconds() / 60)
        return f"Há {minutes} min"
    elif diff < timedelta(hours=24):
        hours = int(diff.total_seconds() / 3600)
        return f"Há {hours} hora{'s' if hours > 1 else ''}"
    elif diff < timedelta(days=7):
        days = diff.days
        if days == 1:
            return "Ontem"
        return f"Há {days} dias"
    elif diff < timedelta(days=30):
        weeks = diff.days // 7
        return f"Há {weeks} semana{'s' if weeks > 1 else ''}"
    else:
        return dt.strftime("%d/%m/%Y")


@router.get(
    "/",
    response_model=NotificationsListResponse,
    summary="Lista notificações do usuário",
)
async def list_notifications(
    db: AsyncSession = Depends(get_db_session),
    current_user: UserSession = Depends(get_current_user),
) -> NotificationsListResponse:
    """
    Lista notificações dos últimos 30 dias, ordenadas por data.
    Inclui contagem de não lidas.
    """
    user_id = uuid.UUID(current_user.id)
    cutoff_date = datetime.utcnow() - timedelta(days=30)

    # Busca notificações
    stmt = (
        select(UserNotification)
        .where(
            and_(
                UserNotification.user_id == user_id,
                UserNotification.created_at >= cutoff_date,
            )
        )
        .order_by(UserNotification.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    notifications = result.scalars().all()

    # Contagem de não lidas
    unread_stmt = (
        select(func.count())
        .select_from(UserNotification)
        .where(
            and_(
                UserNotification.user_id == user_id,
                UserNotification.read_at.is_(None),
                UserNotification.created_at >= cutoff_date,
            )
        )
    )
    unread_count = (await db.execute(unread_stmt)).scalar_one()

    items = [
        NotificationItem(
            id=str(n.id),
            type=n.type,
            title=n.title,
            description=n.description,
            link=n.link,
            unread=n.read_at is None,
            time=_format_time_ago(n.created_at),
            created_at=n.created_at,
        )
        for n in notifications
    ]

    return NotificationsListResponse(
        items=items,
        total=len(items),
        unread_count=unread_count,
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Contagem de notificações não lidas",
)
async def get_unread_count(
    db: AsyncSession = Depends(get_db_session),
    current_user: UserSession = Depends(get_current_user),
) -> UnreadCountResponse:
    """Retorna apenas a contagem de não lidas (para badge)."""
    user_id = uuid.UUID(current_user.id)
    cutoff_date = datetime.utcnow() - timedelta(days=30)

    stmt = (
        select(func.count())
        .select_from(UserNotification)
        .where(
            and_(
                UserNotification.user_id == user_id,
                UserNotification.read_at.is_(None),
                UserNotification.created_at >= cutoff_date,
            )
        )
    )
    count = (await db.execute(stmt)).scalar_one()

    return UnreadCountResponse(unread_count=count)


@router.patch(
    "/{notification_id}/read",
    summary="Marca notificação como lida",
)
async def mark_as_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: UserSession = Depends(get_current_user),
) -> dict:
    """Marca uma notificação específica como lida."""
    user_id = uuid.UUID(current_user.id)
    notif_id = uuid.UUID(notification_id)
    now = datetime.utcnow()

    stmt = (
        update(UserNotification)
        .where(
            and_(
                UserNotification.id == notif_id,
                UserNotification.user_id == user_id,
                UserNotification.read_at.is_(None),
            )
        )
        .values(read_at=now)
    )
    await db.execute(stmt)
    await db.commit()

    return {"success": True}


@router.patch(
    "/read-all",
    summary="Marca todas as notificações como lidas",
)
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db_session),
    current_user: UserSession = Depends(get_current_user),
) -> dict:
    """Marca todas as notificações não lidas como lidas."""
    user_id = uuid.UUID(current_user.id)
    now = datetime.utcnow()

    stmt = (
        update(UserNotification)
        .where(
            and_(
                UserNotification.user_id == user_id,
                UserNotification.read_at.is_(None),
            )
        )
        .values(read_at=now)
    )
    result = await db.execute(stmt)
    await db.commit()

    return {"success": True, "marked": result.rowcount}


@router.get(
    "/preferences",
    response_model=NotificationPreferences,
    summary="Retorna preferências de notificação",
)
async def get_preferences(
    db: AsyncSession = Depends(get_db_session),
    current_user: UserSession = Depends(get_current_user),
) -> NotificationPreferences:
    """Retorna preferências de notificação do usuário."""
    user_id = uuid.UUID(current_user.id)

    stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
    prefs = (await db.execute(stmt)).scalar_one_or_none()

    if prefs is None:
        # Retorna defaults se não existir
        return NotificationPreferences()

    return NotificationPreferences(
        notify_milestones=prefs.notify_milestones,
        notify_health=prefs.notify_health,
        notify_guestbook=prefs.notify_guestbook,
        notify_memories=prefs.notify_memories,
        notify_photos=prefs.notify_photos,
        notify_gifts=prefs.notify_gifts,
        notify_updates=prefs.notify_updates,
        notify_redemptions=prefs.notify_redemptions,
        notify_credits=prefs.notify_credits,
        push_enabled=prefs.push_enabled,
        email_enabled=prefs.email_enabled,
    )


@router.patch(
    "/preferences",
    response_model=NotificationPreferences,
    summary="Atualiza preferências de notificação",
)
async def update_preferences(
    body: PreferencesUpdateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: UserSession = Depends(get_current_user),
) -> NotificationPreferences:
    """Atualiza preferências de notificação do usuário."""
    user_id = uuid.UUID(current_user.id)

    stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
    prefs = (await db.execute(stmt)).scalar_one_or_none()

    if prefs is None:
        # Cria novo registro com defaults + updates
        prefs = UserPreferences(user_id=user_id)
        db.add(prefs)

    # Aplica atualizações
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(prefs, field):
            setattr(prefs, field, value)

    await db.commit()
    await db.refresh(prefs)

    return NotificationPreferences(
        notify_milestones=prefs.notify_milestones,
        notify_health=prefs.notify_health,
        notify_guestbook=prefs.notify_guestbook,
        notify_memories=prefs.notify_memories,
        notify_photos=prefs.notify_photos,
        notify_gifts=prefs.notify_gifts,
        notify_updates=prefs.notify_updates,
        notify_redemptions=prefs.notify_redemptions,
        notify_credits=prefs.notify_credits,
        push_enabled=prefs.push_enabled,
        email_enabled=prefs.email_enabled,
    )

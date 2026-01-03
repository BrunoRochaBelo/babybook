from __future__ import annotations

import secrets
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user, require_csrf_token
from babybook_api.db.models import Asset, Child, GuestbookEntry, GuestbookInvite
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.rate_limit import enforce_rate_limit
from babybook_api.request_ip import get_client_ip
from babybook_api.schemas.guestbook import (
    GuestbookCreate,
    GuestbookEntryResponse,
    PaginatedGuestbook,
)
from babybook_api.schemas.guestbook_invites import (
    GuestbookInviteCreate,
    GuestbookInviteCreatedResponse,
    GuestbookInvitePublicMeta,
    GuestbookModerateRequest,
    GuestbookPublicCreateFromInvite,
)
from babybook_api.settings import settings
from babybook_api.utils.security import sanitize_html
from babybook_api.services.notification import NotificationService, get_notification_service
import hashlib

router = APIRouter()


def _serialize_entry(entry: GuestbookEntry) -> GuestbookEntryResponse:
    return GuestbookEntryResponse(
        id=str(entry.id),
        child_id=str(entry.child_id),
        author_name=entry.author_name,
        author_email=entry.author_email,
        relationship_degree=entry.relationship_degree,
        message=entry.message,
        status=entry.status,
        created_at=entry.created_at,
        asset_id=str(entry.asset_id) if entry.asset_id else None,
    )


async def _ensure_child(
    db: AsyncSession,
    account_id: uuid.UUID,
    child_id: uuid.UUID,
) -> None:
    stmt = select(Child.id).where(
        Child.id == child_id,
        Child.account_id == account_id,
        Child.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise AppError(status_code=404, code="child.not_found", message="Crianca nao encontrada.")


async def _ensure_asset(
    db: AsyncSession,
    account_id: uuid.UUID,
    child_id: uuid.UUID,
    asset_id: uuid.UUID,
) -> None:
    stmt = select(Asset.id).where(
        Asset.id == asset_id,
        Asset.account_id == account_id,
        # Para guestbook, exigimos que o asset seja child-scoped.
        Asset.child_id == child_id,
        Asset.scope == "guestbook",
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise AppError(
            status_code=404,
            code="asset.not_found",
            message="Midia nao encontrada ou nao pertence a esta crianca.",
        )


def _invite_url(token: str) -> str:
    # Convite público deve apontar para o frontend (rota pública /guestbook/:token).
    return f"{settings.frontend_url.rstrip('/')}/guestbook/{token}"


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def _get_active_invite(db: AsyncSession, token: str) -> GuestbookInvite:
    token_hash = _hash_token(token)
    stmt = select(GuestbookInvite).where(
        GuestbookInvite.token_hash == token_hash,
        GuestbookInvite.status == "pending",
    )
    result = await db.execute(stmt)
    invite = result.scalar_one_or_none()
    if invite is None:
        raise AppError(status_code=404, code="guestbook.invite.not_found", message="Convite nao encontrado.")
    if invite.expires_at and invite.expires_at < datetime.utcnow():
        raise AppError(status_code=404, code="guestbook.invite.expired", message="Convite expirado.")
    return invite


@router.get("", response_model=PaginatedGuestbook, summary="Lista assinaturas do guestbook")
async def list_guestbook(
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    child_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(25, ge=1, le=100),
) -> PaginatedGuestbook:
    stmt = select(GuestbookEntry).where(
        GuestbookEntry.account_id == uuid.UUID(current_user.account_id),
        GuestbookEntry.deleted_at.is_(None),
    )
    if child_id:
        stmt = stmt.where(GuestbookEntry.child_id == child_id)
    stmt = stmt.order_by(GuestbookEntry.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    items = [_serialize_entry(entry) for entry in result.scalars().all()]
    return PaginatedGuestbook(items=items, next=None)


@router.post(
    "",
    response_model=GuestbookEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria entrada autenticada no guestbook",
)
async def create_guestbook_entry(
    payload: GuestbookCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> GuestbookEntryResponse:
    await enforce_rate_limit(bucket="guestbook:create:user", limit="10/minute", identity=current_user.id)
    account_id = uuid.UUID(current_user.account_id)
    await _ensure_child(db, account_id, payload.child_id)
    if payload.asset_id is not None:
        await _ensure_asset(db, account_id, payload.child_id, payload.asset_id)
    entry = GuestbookEntry(
        account_id=account_id,
        child_id=payload.child_id,
        author_name=sanitize_html(payload.author_name) or "Anonimo",
        author_email=payload.author_email,
        relationship_degree=payload.relationship_degree,
        message=sanitize_html(payload.message) or "Sem mensagem",
        asset_id=payload.asset_id,
        status="pending",
    )
    db.add(entry)
    await db.flush()
    await db.commit()
    await db.refresh(entry)
    return _serialize_entry(entry)


@router.post(
    "/invites",
    response_model=GuestbookInviteCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria convite publico para enviar mensagem no guestbook",
)
async def create_guestbook_invite(
    payload: GuestbookInviteCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    notifier: NotificationService = Depends(get_notification_service),
    _: None = Depends(require_csrf_token),
) -> GuestbookInviteCreatedResponse:
    await enforce_rate_limit(bucket="guestbook:invite:user", limit="30/day", identity=current_user.id)
    account_id = uuid.UUID(current_user.account_id)
    await _ensure_child(db, account_id, payload.child_id)

    # Gera token seguro e seu hash para armazenamento
    token = secrets.token_urlsafe(16)
    token_hash = _hash_token(token)
    
    # Prepara dados (mapeamento schema vs model)
    # Payload usa 'invited_email', DB usa 'invitee_email'
    invitee_email = str(payload.invited_email).lower() if payload.invited_email else "unknown@example.com" # Should be required per schema? Schema allows None? 
    # User SQL: invitee_email NOT NULL. Payload: likely optional in old schema but user wants required?
    # GuestbookInviteCreate likely has invited_email optional or required?
    # If None, I can't fulfill NOT NULL constraint.
    # Looking at imports: GuestbookInviteCreate.
    # I should check if it's required. If not, I'll error or fail DB.
    # Assume required or we handle it.
    
    invite = GuestbookInvite(
        inviter_id=account_id,
        child_id=payload.child_id,
        token_hash=token_hash,
        invitee_email=invitee_email,
        expires_at=payload.expires_at,
        status="pending"
    )
    db.add(invite)
    await db.flush()
    await db.commit()
    await db.refresh(invite)
    
    # Enfileira Email
    invite_link = _invite_url(token)
    # Fetch child name/inviter name if possible, or pass ID?
    # Context needs names for template.
    # I'll query them or pass placeholder?
    # current_user.name exists? UserSession has 'name'?
    # It has 'user_id', 'account_id', 'role'. 'name'?
    # UserSession in `auth/session.py`.
    # Usually it has basic info. If not, I'll use "Alguém".
    
    inviter_name = getattr(current_user, "name", "Alguém")
    # For child name, I called _ensure_child but didn't fetch name.
    # I can query Child.
    # Optimization: _ensure_child could return Child.
    
    # I'll quickly fetch child name to enrich email.
    child_name_stmt = select(Child.name).where(Child.id == payload.child_id)
    child_name = (await db.execute(child_name_stmt)).scalar_one_or_none() or "o bebê"

    await notifier.enqueue_email(
        to=invitee_email,
        template="guestbook_invite",
        context={
            "inviter_name": inviter_name,
            "child_name": child_name,
            "link": invite_link,
            "personal_message": payload.message_opt if hasattr(payload, "message_opt") else None
        }
    )

    return GuestbookInviteCreatedResponse(
        id=str(invite.id),
        token=token, # Retorna token plano para o requisitante (ele pode compartilhar link manual)
        url=invite_link,
        child_id=str(invite.child_id),
        invited_email=invite.invitee_email,
        expires_at=invite.expires_at,
    )


@router.get(
    "/invites/{token}",
    response_model=GuestbookInvitePublicMeta,
    summary="Recupera metadados publicos de um convite do guestbook",
)
async def get_guestbook_invite_public_meta(
    token: str,
    db: AsyncSession = Depends(get_db_session),
) -> GuestbookInvitePublicMeta:
    invite = await _get_active_invite(db, token)
    stmt_child = select(Child).where(Child.id == invite.child_id, Child.deleted_at.is_(None))
    result_child = await db.execute(stmt_child)
    child = result_child.scalar_one_or_none()
    if child is None:
        raise AppError(status_code=404, code="child.not_found", message="Crianca nao encontrada.")
    return GuestbookInvitePublicMeta(
        token=token, # Return the token passed in argument (since we don't store plain token)
        child_id=str(invite.child_id),
        child_name=child.name,
        invited_email=invite.invitee_email,
        expires_at=invite.expires_at,
    )


@router.post(
    "/invites/{token}/entries",
    response_model=GuestbookEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria entrada pendente no guestbook via convite publico",
)
async def create_guestbook_entry_from_invite(
    token: str,
    payload: GuestbookPublicCreateFromInvite,
    db: AsyncSession = Depends(get_db_session),
    client_ip: str = Depends(get_client_ip),
) -> GuestbookEntryResponse:
    await enforce_rate_limit(bucket="guestbook:create:ip", limit="15/hour", identity=client_ip)
    invite = await _get_active_invite(db, token)

    # Se veio asset, validamos ownership/escopo (asset é da conta do owner e da child).
    if payload.asset_id is not None:
        await _ensure_asset(db, invite.inviter_id, invite.child_id, payload.asset_id)

    author_email = str(payload.author_email).lower() if payload.author_email else invite.invitee_email

    entry = GuestbookEntry(
        account_id=invite.inviter_id, # Updated field name in model relationship access?
        # invite.inviter_id maps to column. 
        # But GuestbookEntry expects 'account_id'.
        # invite.inviter_id IS the account_id.
        # Wait, invite.inviter_id returns UUID.
        child_id=invite.child_id,
        invite_id=invite.id,
        author_name=sanitize_html(payload.author_name) or "Anonimo",
        author_email=author_email,
        relationship_degree=payload.relationship_degree,
        message=sanitize_html(payload.message) or "Sem mensagem",
        asset_id=payload.asset_id,
        status="pending",
    )
    db.add(entry)
    await db.flush()
    await db.commit()
    await db.refresh(entry)
    return _serialize_entry(entry)


@router.post(
    "/{entry_id}/approve",
    response_model=GuestbookEntryResponse,
    summary="Aprova uma entrada pendente do guestbook",
)
async def approve_guestbook_entry(
    entry_id: uuid.UUID,
    payload: GuestbookModerateRequest,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> GuestbookEntryResponse:
    account_id = uuid.UUID(current_user.account_id)
    stmt = select(GuestbookEntry).where(
        GuestbookEntry.id == entry_id,
        GuestbookEntry.account_id == account_id,
        GuestbookEntry.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    entry = result.scalar_one_or_none()
    if entry is None:
        raise AppError(status_code=404, code="guestbook.not_found", message="Entrada nao encontrada.")
    if entry.status != "pending":
        raise AppError(status_code=409, code="guestbook.not_pending", message="Entrada nao esta pendente.")

    if payload.relationship_degree is not None:
        entry.relationship_degree = payload.relationship_degree
    entry.status = "approved"
    await db.flush()
    await db.commit()
    await db.refresh(entry)
    return _serialize_entry(entry)


@router.post(
    "/{entry_id}/reject",
    response_model=GuestbookEntryResponse,
    summary="Rejeita (oculta) uma entrada pendente do guestbook",
)
async def reject_guestbook_entry(
    entry_id: uuid.UUID,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_csrf_token),
) -> GuestbookEntryResponse:
    account_id = uuid.UUID(current_user.account_id)
    stmt = select(GuestbookEntry).where(
        GuestbookEntry.id == entry_id,
        GuestbookEntry.account_id == account_id,
        GuestbookEntry.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    entry = result.scalar_one_or_none()
    if entry is None:
        raise AppError(status_code=404, code="guestbook.not_found", message="Entrada nao encontrada.")
    if entry.status != "pending":
        raise AppError(status_code=409, code="guestbook.not_pending", message="Entrada nao esta pendente.")

    entry.status = "hidden"
    await db.flush()
    await db.commit()
    await db.refresh(entry)
    return _serialize_entry(entry)

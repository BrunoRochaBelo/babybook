from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Asset, Child, VaultDocument
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.vault import PaginatedVaultDocuments, VaultDocumentCreate, VaultDocumentResponse

router = APIRouter()


def _serialize_document(doc: VaultDocument) -> VaultDocumentResponse:
    return VaultDocumentResponse(
        id=str(doc.id),
        child_id=str(doc.child_id),
        kind=doc.kind,  # type: ignore[arg-type]
        asset_id=str(doc.asset_id),
        note=doc.note,
        created_at=doc.created_at,
    )


async def _ensure_child(db: AsyncSession, account_id: uuid.UUID, child_id: uuid.UUID) -> None:
    stmt = select(Child.id).where(
        Child.id == child_id,
        Child.account_id == account_id,
        Child.deleted_at.is_(None),
    )
    if (await db.execute(stmt)).scalar_one_or_none() is None:
        raise AppError(status_code=404, code="child.not_found", message="Crianca nao encontrada.")


async def _get_asset(db: AsyncSession, account_id: uuid.UUID, asset_id: uuid.UUID) -> Asset:
    stmt = select(Asset).where(Asset.id == asset_id, Asset.account_id == account_id)
    result = await db.execute(stmt)
    asset = result.scalar_one_or_none()
    if asset is None:
        raise AppError(status_code=404, code="asset.not_found", message="Asset nao encontrado.")
    return asset


@router.get(
    "/vault/documents",
    response_model=PaginatedVaultDocuments,
    summary="Lista documentos do cofre",
)
async def list_vault_documents(
    child_id: uuid.UUID | None = Query(default=None),
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    limit: int = Query(50, ge=1, le=200),
) -> PaginatedVaultDocuments:
    stmt = select(VaultDocument).where(VaultDocument.account_id == uuid.UUID(current_user.account_id))
    if child_id:
        stmt = stmt.where(VaultDocument.child_id == child_id)
    stmt = stmt.order_by(VaultDocument.created_at.desc()).limit(limit)
    docs = (await db.execute(stmt)).scalars().all()
    return PaginatedVaultDocuments(items=[_serialize_document(doc) for doc in docs], next=None)


@router.post(
    "/vault/documents",
    response_model=VaultDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria documento do cofre",
)
async def create_vault_document(
    payload: VaultDocumentCreate,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> VaultDocumentResponse:
    account_id = uuid.UUID(current_user.account_id)
    await _ensure_child(db, account_id, payload.child_id)
    asset = await _get_asset(db, account_id, payload.asset_id)
    document = VaultDocument(
        account_id=account_id,
        child_id=payload.child_id,
        kind=payload.kind,
        asset_id=payload.asset_id,
        note=payload.note,
    )
    asset.scope = "vault"
    asset.viewer_accessible = True
    db.add(document)
    await db.flush()
    await db.commit()
    await db.refresh(document)
    return _serialize_document(document)

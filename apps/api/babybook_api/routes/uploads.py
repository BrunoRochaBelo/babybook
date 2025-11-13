from __future__ import annotations

import math
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Account, Asset, UploadSession
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.assets import (
    AssetKind,
    UploadCompleteRequest,
    UploadCompleteResponse,
    UploadInitRequest,
    UploadInitResponse,
)
from babybook_api.services.queue import QueuePublisher, get_queue_publisher
from babybook_api.settings import settings

router = APIRouter()


def _infer_kind(mime: str) -> AssetKind:
    if mime.startswith("video/"):
        return "video"
    if mime.startswith("audio/"):
        return "audio"
    return "photo"


async def _get_account(db: AsyncSession, account_id: uuid.UUID) -> Account:
    account = await db.get(Account, account_id)
    if account is None:
        raise AppError(status_code=404, code="account.not_found", message="Conta nao encontrada.")
    return account


@router.post(
    "/init",
    response_model=UploadInitResponse,
    summary="Inicia sessao de upload multiparte",
)
async def init_upload(
    payload: UploadInitRequest,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> UploadInitResponse:
    account_id = uuid.UUID(current_user.account_id)
    stmt = select(Asset).where(
        Asset.account_id == account_id,
        Asset.sha256 == payload.sha256,
        Asset.status != "failed",
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing is not None:
        return UploadInitResponse(
            asset_id=str(existing.id),
            status=existing.status,  # type: ignore[arg-type]
            deduplicated=True,
        )

    account = await _get_account(db, account_id)
    if account.storage_bytes_used + payload.size > (account.plan_storage_bytes or settings.quota_storage_bytes):
        raise AppError(status_code=413, code="quota.bytes.exceeded", message="Quota de armazenamento excedida.")

    kind: AssetKind = payload.kind or _infer_kind(payload.mime)
    asset_id = uuid.uuid4()
    asset = Asset(
        id=asset_id,
        account_id=account_id,
        kind=kind,
        status="queued",
        mime=payload.mime,
        size_bytes=payload.size,
        sha256=payload.sha256,
        scope=payload.scope or "moment",
    )
    asset.key_original = f"accounts/{account_id}/uploads/{asset_id}/{payload.filename}"
    account.storage_bytes_used += payload.size

    part_size = settings.upload_part_bytes
    part_count = max(1, math.ceil(payload.size / part_size))
    upload = UploadSession(
        account_id=account_id,
        asset=asset,
        filename=payload.filename,
        mime=payload.mime,
        size_bytes=payload.size,
        sha256=payload.sha256,
        part_size=part_size,
        part_count=part_count,
    )
    db.add_all([asset, upload])
    await db.flush()
    await db.commit()
    await db.refresh(upload)

    parts = list(range(1, upload.part_count + 1))
    urls = [f"{settings.upload_url_base}/{upload.id}/part/{part}" for part in parts]
    return UploadInitResponse(
        asset_id=str(asset_id),
        status=asset.status,  # type: ignore[arg-type]
        upload_id=str(upload.id),
        key=asset.key_original,
        parts=parts,
        urls=urls,
    )


@router.post(
    "/complete",
    response_model=UploadCompleteResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Conclui upload multiparte",
)
async def complete_upload(
    payload: UploadCompleteRequest,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    queue: QueuePublisher = Depends(get_queue_publisher),
) -> UploadCompleteResponse:
    account_id = uuid.UUID(current_user.account_id)
    stmt = (
        select(UploadSession)
        .where(
            UploadSession.id == payload.upload_id,
            UploadSession.account_id == account_id,
        )
        .options(selectinload(UploadSession.asset))
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if session is None:
        raise AppError(status_code=404, code="upload.not_found", message="Upload nao encontrado.")
    asset = session.asset
    if asset is None:
        raise AppError(status_code=404, code="asset.not_found", message="Asset nao encontrado.")

    if session.status == "completed":
        return UploadCompleteResponse(asset_id=str(asset.id), status=asset.status)  # type: ignore[arg-type]

    if len(payload.etags) != session.part_count:
        raise AppError(status_code=400, code="upload.parts.mismatch", message="Partes incompletas.")

    session.status = "completed"
    session.completed_at = datetime.utcnow()
    session.etags = [etag.model_dump() for etag in payload.etags]
    asset.status = "processing"
    await db.flush()
    job_kind = _job_kind_for_asset(asset.kind)
    await queue.publish(
        kind=job_kind,
        payload={
            "asset_id": str(asset.id),
            "account_id": str(asset.account_id),
            "key": asset.key_original,
            "kind": asset.kind,
        },
        metadata={
            "upload_id": str(session.id),
            "user_id": current_user.id,
        },
    )
    await db.commit()
    return UploadCompleteResponse(asset_id=str(asset.id), status=asset.status)  # type: ignore[arg-type]
def _job_kind_for_asset(kind: AssetKind) -> str:
    if kind == "video":
        return "video.transcode"
    if kind == "photo":
        return "image.thumbnail"
    return "export.zip"

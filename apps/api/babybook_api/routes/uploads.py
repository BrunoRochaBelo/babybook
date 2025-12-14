from __future__ import annotations

import math
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Account, Asset, UploadSession
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.observability import get_trace_id
from babybook_api.rate_limit import enforce_rate_limit
from babybook_api.schemas.assets import (
    AssetKind,
    UploadCompleteRequest,
    UploadCompleteResponse,
    UploadInitRequest,
    UploadInitResponse,
)
from babybook_api.services.queue import QueuePublisher, get_queue_publisher
from babybook_api.settings import settings
from babybook_api.storage import get_cold_storage
from babybook_api.uploads.file_validation import validate_magic_bytes

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
    await enforce_rate_limit(bucket="uploads:init:user", limit="60/minute", identity=current_user.id)
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
    request: Request,
    current_user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    queue: QueuePublisher = Depends(get_queue_publisher),
) -> UploadCompleteResponse:
    await enforce_rate_limit(bucket="uploads:complete:user", limit="120/minute", identity=current_user.id)
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

    # Validation: Magic Bytes & Size
    # Verifica se o arquivo enviado corresponde ao tipo e tamanho declarados.
    try:
        storage = await get_cold_storage()
        
        # 1. Valida tamanho real no storage vs declarado
        info = await storage.get_object_info(asset.key_original)
        if info is None:
            raise AppError(status_code=404, code="upload.file.not_found", message="Arquivo nao encontrado no storage.")
        
        # Permite pequena margem de erro apenas se for multipart complexo, mas idealmente deve ser exato.
        # Para segurança estrita: deve ser exato.
        if info.size != session.size_bytes:
             raise ValueError(f"Tamanho incorreto. Esperado: {session.size_bytes}, Real: {info.size}")

        # 2. Valida Magic Bytes (assinatura)
        # Lê os primeiros 512 bytes para verificação de assinatura
        header = await storage.get_object_range(asset.key_original, start=0, end=511)
        validate_magic_bytes(
            declared_content_type=asset.mime,
            header=header,
            # Não passamos allowed_content_types aqui pois a lista global pode ser restrita demais
            # para o B2C (que pode aceitar mais tipos no futuro). O importante é bater com o mime.
        )
    except Exception as e:
        # Se falhar, marcamos como falha e retornamos erro
        asset.status = "failed"
        session.status = "failed"
        await db.commit()
        raise AppError(
            status_code=400,
            code="upload.validation.failed",
            message=f"Validacao do arquivo falhou: {str(e)}"
        )

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
            "mime": asset.mime,
            "scope": asset.scope,
        },
        metadata={
            "upload_id": str(session.id),
            "user_id": current_user.id,
            "trace_id": get_trace_id(request),
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

from __future__ import annotations

import math
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.db.models import Account, Asset, Child, UploadSession
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
from babybook_api.storage.paths import secure_filename
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


async def _get_child_or_404(db: AsyncSession, *, account_id: uuid.UUID, child_id: uuid.UUID) -> Child:
    stmt = select(Child).where(
        Child.id == child_id,
        Child.account_id == account_id,
        Child.deleted_at.is_(None),
    )
    child = (await db.execute(stmt)).scalar_one_or_none()
    if child is None:
        raise AppError(status_code=404, code="child.not_found", message="Crianca nao encontrada.")
    return child


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
        Asset.child_id == payload.child_id,
        Asset.sha256 == payload.sha256,
        Asset.status != "failed",
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing is not None:
        return UploadInitResponse(
            asset_id=str(existing.id),
            status=existing.status,  # type: ignore[arg-type]
            key=existing.key_original,
            deduplicated=True,
        )

    account = await _get_account(db, account_id)

    # Quota enforcement (child-centric, always)
    child = await _get_child_or_404(db, account_id=account_id, child_id=payload.child_id)
    stmt_used = (
        select(func.coalesce(func.sum(Asset.size_bytes), 0))
        .where(
            Asset.account_id == account_id,
            Asset.child_id == child.id,
            Asset.status != "failed",
        )
    )
    bytes_used = (await db.execute(stmt_used)).scalar_one()
    if bytes_used + payload.size > child.storage_quota_bytes:
        raise AppError(status_code=413, code="quota.bytes.exceeded", message="Quota de armazenamento excedida.")

    kind: AssetKind = payload.kind or _infer_kind(payload.mime)
    asset_id = uuid.uuid4()
    safe_name = secure_filename(payload.filename)
    suffix = Path(safe_name).suffix or ".bin"
    # Key final (viewer-accessible via Edge) — o worker coloca variantes no mesmo prefixo.
    # Observação: o Edge valida `u/{account_id}/...` via claim `account_id` do JWT.
    key_original = f"u/{account_id}/assets/{asset_id}/original{suffix}"
    asset = Asset(
        id=asset_id,
        account_id=account_id,
        child_id=payload.child_id,
        kind=kind,
        status="queued",
        mime=payload.mime,
        size_bytes=payload.size,
        sha256=payload.sha256,
        scope=payload.scope or "moment",
    )
    asset.key_original = key_original

    part_size = settings.upload_part_bytes
    part_count = max(1, math.ceil(payload.size / part_size))
    upload = UploadSession(
        account_id=account_id,
        asset=asset,
        filename=safe_name,
        mime=payload.mime,
        size_bytes=payload.size,
        sha256=payload.sha256,
        part_size=part_size,
        part_count=part_count,
    )

    db.add_all([asset, upload])
    await db.flush()

    # Gera URLs presigned diretamente no storage (opção mais barata, sem gateway).
    # - part_count == 1  -> PUT simples
    # - part_count > 1   -> multipart (upload_part)
    try:
        storage = await get_cold_storage()
        metadata = {
            "bb_asset_id": str(asset_id),
            "bb_account_id": str(account_id),
            "bb_sha256": payload.sha256,
        }

        if part_count > 1:
            storage_upload_id = await storage.create_multipart_upload(
                key=key_original,
                content_type=payload.mime,
                metadata=metadata,
            )
            upload.storage_upload_id = storage_upload_id
            part_infos = await storage.generate_presigned_part_urls(
                key=key_original,
                upload_id=storage_upload_id,
                part_count=part_count,
                expires_in=timedelta(hours=2),
            )
            parts = [p.part_number for p in part_infos]
            urls = [p.url for p in part_infos]
        else:
            presigned = await storage.generate_presigned_put_url(
                key=key_original,
                content_type=payload.mime,
                expires_in=timedelta(hours=1),
                metadata=metadata,
            )
            parts = [1]
            urls = [presigned.url]
    except AppError:
        raise
    except Exception as e:
        await db.rollback()
        raise AppError(
            status_code=500,
            code="upload.init.failed",
            message=f"Falha ao preparar upload: {str(e)}",
        )

    # Atualiza uso após prepararmos o upload com sucesso.
    account.storage_bytes_used += payload.size
    await db.commit()
    await db.refresh(upload)

    return UploadInitResponse(
        asset_id=str(asset_id),
        status=asset.status,  # type: ignore[arg-type]
        upload_id=str(upload.id),
        key=key_original,
        part_size=part_size,
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

    # Se multipart, precisamos finalizar no provider antes de validar/enfileirar.
    if session.part_count > 1:
        if not session.storage_upload_id:
            raise AppError(
                status_code=409,
                code="upload.missing_storage_upload_id",
                message="Sessao multipart sem upload_id do storage.",
            )
        try:
            storage = await get_cold_storage()
            ordered = sorted(payload.etags, key=lambda e: e.part)
            await storage.complete_multipart_upload(
                asset.key_original,
                session.storage_upload_id,
                parts=[{"PartNumber": e.part, "ETag": e.etag} for e in ordered],
            )
        except Exception as e:
            raise AppError(
                status_code=400,
                code="upload.complete.failed",
                message=f"Falha ao concluir upload multipart: {str(e)}",
            )

    if settings.upload_validation_enabled:
        # Validation: Magic Bytes & Size
        # Verifica se o arquivo enviado corresponde ao tipo e tamanho declarados.
        try:
            storage = await get_cold_storage()

            # 1. Valida tamanho real no storage vs declarado
            info = await storage.get_object_info(asset.key_original)
            if info is None:
                raise AppError(status_code=404, code="upload.file.not_found", message="Arquivo nao encontrado no storage.")

            # Para segurança estrita: deve ser exato.
            if info.size != session.size_bytes:
                raise ValueError(f"Tamanho incorreto. Esperado: {session.size_bytes}, Real: {info.size}")

            # 2. Valida Magic Bytes (assinatura)
            # Lê os primeiros 512 bytes para verificação de assinatura
            header = await storage.get_object_range(asset.key_original, start=0, end=511)
            validate_magic_bytes(
                declared_content_type=asset.mime,
                header=header,
            )
        except Exception as e:
            # Best-effort cleanup para evitar lixo em caso de validação falhar.
            try:
                storage = await get_cold_storage()
                await storage.delete_object(asset.key_original)
            except Exception:
                pass
            # Se falhar, marcamos como falha e retornamos erro
            asset.status = "failed"
            session.status = "failed"
            await db.commit()
            raise AppError(
                status_code=400,
                code="upload.validation.failed",
                message=f"Validacao do arquivo falhou: {str(e)}",
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

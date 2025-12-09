"""
Rotas API para Upload Resiliente

Endpoints para uploads multipart resumíveis compatíveis com:
- Uppy (frontend) via @uppy/aws-s3-multipart
- Navegadores com suporte a Background Sync
- Mobile apps com upload em background

@see docs/PLANO_ATUALIZACAO_ADAPTACAO_MONOREPO.md - Fase 5
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.deps import get_db_session
from babybook_api.errors import AppError
from babybook_api.schemas.uploads import (
    ResumableUploadInitRequest,
    ResumableUploadInitResponse,
    UploadPartUrl,
    RegisterPartRequest,
    RegisterPartResponse,
    ResumableUploadCompleteRequest,
    ResumableUploadCompleteResponse,
    UploadSessionStatus,
    CancelUploadResponse,
)
from babybook_api.storage.resumable_upload import (
    ResumableUploadService,
    get_upload_service,
)

router = APIRouter()


@router.post(
    "/resumable/init",
    response_model=ResumableUploadInitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Inicia upload resumível multipart",
    description="""
    Inicia uma sessão de upload resumível.
    
    Retorna URLs pré-assinadas para cada parte do arquivo.
    O cliente deve fazer upload das partes em paralelo ou sequencial.
    
    Se o upload for interrompido, chame `/resumable/{session_id}/resume` para obter
    URLs apenas das partes pendentes.
    """,
)
async def init_resumable_upload(
    payload: ResumableUploadInitRequest,
    current_user: UserSession = Depends(get_current_user),
    upload_service: ResumableUploadService = Depends(get_upload_service),
) -> ResumableUploadInitResponse:
    # TODO: Verificar quota de storage
    # TODO: Verificar deduplicação via sha256
    
    result = await upload_service.init_upload(
        account_id=current_user.account_id,
        filename=payload.filename,
        mime_type=payload.mime,
        total_size=payload.size,
        sha256=payload.sha256,
        part_size=payload.part_size,
        metadata={
            "kind": payload.kind,
            "scope": payload.scope,
            **(payload.metadata or {}),
        },
    )
    
    return ResumableUploadInitResponse(
        session_id=result.session_id,
        asset_id=result.asset_id,
        storage_key=result.storage_key,
        total_parts=result.total_parts,
        part_size=result.part_size,
        part_urls=[
            UploadPartUrl(
                part_number=p.part_number,
                url=p.url,
                headers=p.headers,
            )
            for p in result.part_urls
        ],
        expires_at=result.expires_at,
        already_uploaded_parts=result.already_uploaded_parts,
    )


@router.post(
    "/resumable/{session_id}/resume",
    response_model=ResumableUploadInitResponse,
    summary="Retoma upload interrompido",
    description="""
    Retoma um upload que foi interrompido.
    
    Retorna URLs apenas para as partes que ainda não foram enviadas.
    As partes já enviadas são listadas em `already_uploaded_parts`.
    """,
)
async def resume_upload(
    session_id: str,
    current_user: UserSession = Depends(get_current_user),
    upload_service: ResumableUploadService = Depends(get_upload_service),
) -> ResumableUploadInitResponse:
    result = await upload_service.resume_upload(
        session_id=session_id,
        account_id=current_user.account_id,
    )
    
    if result is None:
        raise AppError(
            status_code=404,
            code="upload.session_not_found",
            message="Sessão de upload não encontrada ou expirada.",
        )
    
    return ResumableUploadInitResponse(
        session_id=result.session_id,
        asset_id=result.asset_id,
        storage_key=result.storage_key,
        total_parts=result.total_parts,
        part_size=result.part_size,
        part_urls=[
            UploadPartUrl(
                part_number=p.part_number,
                url=p.url,
                headers=p.headers,
            )
            for p in result.part_urls
        ],
        expires_at=result.expires_at,
        already_uploaded_parts=result.already_uploaded_parts,
    )


@router.post(
    "/resumable/{session_id}/part",
    response_model=RegisterPartResponse,
    summary="Registra parte enviada",
    description="""
    Registra que uma parte do upload foi enviada com sucesso.
    
    Chamado pelo frontend após cada parte ser enviada ao storage.
    O ETag é retornado pelo storage após o upload da parte.
    """,
)
async def register_part_uploaded(
    session_id: str,
    payload: RegisterPartRequest,
    current_user: UserSession = Depends(get_current_user),
    upload_service: ResumableUploadService = Depends(get_upload_service),
) -> RegisterPartResponse:
    success = await upload_service.register_part_uploaded(
        session_id=session_id,
        part_number=payload.part_number,
        etag=payload.etag,
        size=payload.size,
    )
    
    if not success:
        raise AppError(
            status_code=404,
            code="upload.session_not_found",
            message="Sessão de upload não encontrada.",
        )
    
    # Obter status atualizado
    session = await upload_service.get_session_status(
        session_id=session_id,
        account_id=current_user.account_id,
    )
    
    if session is None:
        raise AppError(status_code=404, code="upload.session_not_found", message="Sessão não encontrada.")
    
    return RegisterPartResponse(
        success=True,
        parts_uploaded=len(session.uploaded_parts),
        parts_remaining=len(session.get_pending_parts()),
        progress_percent=session.progress_percent,
    )


@router.post(
    "/resumable/{session_id}/complete",
    response_model=ResumableUploadCompleteResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Finaliza upload multipart",
    description="""
    Finaliza o upload multipart após todas as partes serem enviadas.
    
    O storage irá combinar as partes em um único arquivo.
    O asset será marcado para processamento (geração de thumbnails, etc).
    """,
)
async def complete_resumable_upload(
    session_id: str,
    payload: ResumableUploadCompleteRequest | None = None,
    current_user: UserSession = Depends(get_current_user),
    upload_service: ResumableUploadService = Depends(get_upload_service),
) -> ResumableUploadCompleteResponse:
    try:
        etags = payload.etags if payload else None
        result = await upload_service.complete_upload(
            session_id=session_id,
            account_id=current_user.account_id,
            etags=etags,
        )
    except ValueError as e:
        raise AppError(
            status_code=400,
            code="upload.incomplete",
            message=str(e),
        )
    except Exception as e:
        raise AppError(
            status_code=500,
            code="upload.complete_failed",
            message=f"Falha ao finalizar upload: {str(e)}",
        )
    
    if result is None:
        raise AppError(
            status_code=404,
            code="upload.session_not_found",
            message="Sessão de upload não encontrada.",
        )
    
    # TODO: Enfileirar job para processamento (thumbnails, transcode)
    
    return ResumableUploadCompleteResponse(
        asset_id=result.asset_id,
        storage_key=result.storage_key,
        etag=result.etag,
        size=result.size,
        status=result.status.value,  # type: ignore
    )


@router.get(
    "/resumable/{session_id}",
    response_model=UploadSessionStatus,
    summary="Obtém status de upload",
)
async def get_upload_status(
    session_id: str,
    current_user: UserSession = Depends(get_current_user),
    upload_service: ResumableUploadService = Depends(get_upload_service),
) -> UploadSessionStatus:
    session = await upload_service.get_session_status(
        session_id=session_id,
        account_id=current_user.account_id,
    )
    
    if session is None:
        raise AppError(
            status_code=404,
            code="upload.session_not_found",
            message="Sessão de upload não encontrada.",
        )
    
    return UploadSessionStatus(
        session_id=session.id,
        asset_id=session.asset_id,
        filename=session.filename,
        mime_type=session.mime_type,
        total_size=session.total_size,
        status=session.status.value,  # type: ignore
        total_parts=session.total_parts,
        uploaded_parts=len(session.uploaded_parts),
        bytes_uploaded=session.bytes_uploaded,
        progress_percent=session.progress_percent,
        created_at=session.created_at,
        updated_at=session.updated_at,
        expires_at=session.expires_at,
        completed_at=session.completed_at,
    )


@router.delete(
    "/resumable/{session_id}",
    response_model=CancelUploadResponse,
    summary="Cancela upload em andamento",
)
async def cancel_upload(
    session_id: str,
    current_user: UserSession = Depends(get_current_user),
    upload_service: ResumableUploadService = Depends(get_upload_service),
) -> CancelUploadResponse:
    success = await upload_service.cancel_upload(
        session_id=session_id,
        account_id=current_user.account_id,
    )
    
    if not success:
        raise AppError(
            status_code=404,
            code="upload.session_not_found",
            message="Sessão de upload não encontrada ou já finalizada.",
        )
    
    return CancelUploadResponse(
        success=True,
        message="Upload cancelado com sucesso.",
    )

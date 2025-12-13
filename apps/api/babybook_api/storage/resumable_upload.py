"""
Serviço de Upload Resiliente

Implementa uploads multipart resumíveis com:
- Suporte a retomada após falha de rede
- Integração com storage S3-compatible (R2)
- Tracking de progresso
- Cleanup de uploads abandonados

Compatível com:
- Uppy (frontend) via tus-js-client ou @uppy/aws-s3-multipart
- S3 multipart API nativa
"""
from __future__ import annotations

import math
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Literal

from babybook_api.storage.base import StorageType, UploadPartInfo
from babybook_api.storage.hybrid_service import HybridStorageService


class UploadStatus(str, Enum):
    """Status de uma sessão de upload"""
    INITIATED = "initiated"    # Upload criado, aguardando partes
    UPLOADING = "uploading"    # Partes sendo enviadas
    PROCESSING = "processing"  # Upload completo, aguardando processamento
    COMPLETED = "completed"    # Upload finalizado com sucesso
    FAILED = "failed"          # Falha no upload
    EXPIRED = "expired"        # Upload expirado (cleanup)
    CANCELLED = "cancelled"    # Cancelado pelo usuário


@dataclass
class UploadPart:
    """Informação de uma parte do upload"""
    part_number: int
    etag: str | None = None
    size: int = 0
    uploaded_at: datetime | None = None
    
    @property
    def is_uploaded(self) -> bool:
        return self.etag is not None


@dataclass
class ResumableUploadSession:
    """Sessão de upload resumível"""
    id: str
    account_id: str
    asset_id: str
    filename: str
    mime_type: str
    total_size: int
    
    # Storage
    storage_type: StorageType
    storage_key: str
    storage_upload_id: str  # ID do multipart no S3/R2
    
    # Partes
    part_size: int
    total_parts: int
    parts: list[UploadPart] = field(default_factory=list)
    
    # Status e timestamps
    status: UploadStatus = UploadStatus.INITIATED
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime | None = None
    completed_at: datetime | None = None
    
    # Metadados
    sha256: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    
    @property
    def uploaded_parts(self) -> list[UploadPart]:
        return [p for p in self.parts if p.is_uploaded]
    
    @property
    def bytes_uploaded(self) -> int:
        return sum(p.size for p in self.uploaded_parts)
    
    @property
    def progress_percent(self) -> float:
        if self.total_size == 0:
            return 0.0
        return (self.bytes_uploaded / self.total_size) * 100
    
    @property
    def is_complete(self) -> bool:
        return len(self.uploaded_parts) == self.total_parts
    
    @property
    def can_resume(self) -> bool:
        return self.status in (UploadStatus.INITIATED, UploadStatus.UPLOADING)
    
    def get_pending_parts(self) -> list[int]:
        """Retorna números das partes ainda não enviadas"""
        uploaded_numbers = {p.part_number for p in self.uploaded_parts}
        return [n for n in range(1, self.total_parts + 1) if n not in uploaded_numbers]


@dataclass
class UploadInitResult:
    """Resultado da inicialização de um upload"""
    session_id: str
    asset_id: str
    storage_key: str
    total_parts: int
    part_size: int
    part_urls: list[UploadPartInfo]
    expires_at: datetime
    
    # Para retomada
    already_uploaded_parts: list[int] = field(default_factory=list)


@dataclass
class UploadCompleteResult:
    """Resultado da finalização de um upload"""
    asset_id: str
    storage_key: str
    etag: str
    size: int
    status: UploadStatus


class ResumableUploadService:
    """
    Serviço para gerenciar uploads resumíveis multipart.
    
    Fluxo típico:
    1. Cliente chama init_upload() → recebe URLs pré-assinadas para cada parte
    2. Cliente faz upload das partes em paralelo ou sequencial
    3. Em caso de falha, cliente chama resume_upload() → recebe URLs das partes pendentes
    4. Cliente chama complete_upload() quando todas as partes foram enviadas
    5. Servidor valida e finaliza o multipart
    
    Background:
    - Job periódico limpa uploads expirados (abort_expired_uploads)
    """
    
    # Configurações padrão
    DEFAULT_PART_SIZE = 5 * 1024 * 1024  # 5MB
    MIN_PART_SIZE = 5 * 1024 * 1024      # 5MB (mínimo S3)
    MAX_PART_SIZE = 100 * 1024 * 1024    # 100MB
    MAX_PARTS = 10000                     # Máximo S3
    DEFAULT_EXPIRY_HOURS = 24
    URL_EXPIRY_HOURS = 2
    
    def __init__(self, storage_service: HybridStorageService) -> None:
        self.storage = storage_service
        # Em produção, isso seria persistido no banco de dados
        self._sessions: dict[str, ResumableUploadSession] = {}
    
    def _calculate_parts(self, total_size: int, part_size: int | None = None) -> tuple[int, int]:
        """Calcula número e tamanho das partes"""
        if part_size is None:
            part_size = self.DEFAULT_PART_SIZE
        
        part_size = max(self.MIN_PART_SIZE, min(part_size, self.MAX_PART_SIZE))
        part_count = max(1, math.ceil(total_size / part_size))
        
        if part_count > self.MAX_PARTS:
            # Ajustar tamanho da parte para caber no limite
            part_size = math.ceil(total_size / self.MAX_PARTS)
            part_count = math.ceil(total_size / part_size)
        
        return part_count, part_size
    
    async def init_upload(
        self,
        account_id: str,
        filename: str,
        mime_type: str,
        total_size: int,
        sha256: str | None = None,
        part_size: int | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> UploadInitResult:
        """
        Inicia uma nova sessão de upload resumível.
        
        Args:
            account_id: ID da conta do usuário
            filename: Nome do arquivo
            mime_type: Tipo MIME
            total_size: Tamanho total em bytes
            sha256: Hash SHA256 para deduplicação (opcional)
            part_size: Tamanho preferido de cada parte (opcional)
            metadata: Metadados adicionais (opcional)
        
        Returns:
            UploadInitResult com URLs pré-assinadas para cada parte
        """
        asset_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        
        # Calcular partes
        part_count, actual_part_size = self._calculate_parts(total_size, part_size)
        
        # Preparar upload no storage
        upload_target = await self.storage.prepare_upload(
            account_id=account_id,
            asset_id=asset_id,
            filename=filename,
            mime_type=mime_type,
            size_bytes=total_size,
            use_multipart=True,
            part_count=part_count,
        )
        
        # Criar sessão
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=self.DEFAULT_EXPIRY_HOURS)
        
        session = ResumableUploadSession(
            id=session_id,
            account_id=account_id,
            asset_id=asset_id,
            filename=filename,
            mime_type=mime_type,
            total_size=total_size,
            storage_type=upload_target.storage_type,
            storage_key=upload_target.key,
            storage_upload_id=upload_target.upload_id or "",
            part_size=actual_part_size,
            total_parts=part_count,
            parts=[UploadPart(part_number=i) for i in range(1, part_count + 1)],
            status=UploadStatus.INITIATED,
            created_at=now,
            updated_at=now,
            expires_at=expires_at,
            sha256=sha256,
            metadata=metadata or {},
        )
        
        # Salvar sessão (em produção, persistir no DB)
        self._sessions[session_id] = session
        
        return UploadInitResult(
            session_id=session_id,
            asset_id=asset_id,
            storage_key=upload_target.key,
            total_parts=part_count,
            part_size=actual_part_size,
            part_urls=upload_target.multipart_urls or [],
            expires_at=expires_at,
        )
    
    async def resume_upload(
        self,
        session_id: str,
        account_id: str,
    ) -> UploadInitResult | None:
        """
        Retoma um upload interrompido.
        
        Retorna URLs apenas para as partes que ainda não foram enviadas.
        """
        session = self._sessions.get(session_id)
        
        if session is None:
            return None
        
        if session.account_id != account_id:
            return None
        
        if not session.can_resume:
            return None
        
        # Verificar expiração
        if session.expires_at and datetime.now(timezone.utc) > session.expires_at:
            session.status = UploadStatus.EXPIRED
            return None
        
        # Gerar URLs apenas para partes pendentes
        pending_parts = session.get_pending_parts()
        
        if not pending_parts:
            # Todas as partes foram enviadas, só falta completar
            return UploadInitResult(
                session_id=session_id,
                asset_id=session.asset_id,
                storage_key=session.storage_key,
                total_parts=session.total_parts,
                part_size=session.part_size,
                part_urls=[],
                expires_at=session.expires_at or datetime.now(timezone.utc),
                already_uploaded_parts=[p.part_number for p in session.uploaded_parts],
            )
        
        # Gerar novas URLs para partes pendentes
        provider = self.storage._get_provider(session.storage_type)
        part_urls = []
        
        for part_number in pending_parts:
            url = await provider._client.generate_presigned_url(
                "upload_part",
                Params={
                    "Bucket": provider.config.bucket,
                    "Key": session.storage_key,
                    "UploadId": session.storage_upload_id,
                    "PartNumber": part_number,
                },
                ExpiresIn=int(timedelta(hours=self.URL_EXPIRY_HOURS).total_seconds()),
            )
            part_urls.append(UploadPartInfo(part_number=part_number, url=url))
        
        session.status = UploadStatus.UPLOADING
        session.updated_at = datetime.now(timezone.utc)
        
        return UploadInitResult(
            session_id=session_id,
            asset_id=session.asset_id,
            storage_key=session.storage_key,
            total_parts=session.total_parts,
            part_size=session.part_size,
            part_urls=part_urls,
            expires_at=session.expires_at or datetime.now(timezone.utc),
            already_uploaded_parts=[p.part_number for p in session.uploaded_parts],
        )
    
    async def register_part_uploaded(
        self,
        session_id: str,
        part_number: int,
        etag: str,
        size: int,
    ) -> bool:
        """
        Registra que uma parte foi enviada com sucesso.
        
        Chamado pelo frontend após cada parte completar.
        """
        session = self._sessions.get(session_id)
        
        if session is None:
            return False
        
        for part in session.parts:
            if part.part_number == part_number:
                part.etag = etag.strip('"')
                part.size = size
                part.uploaded_at = datetime.now(timezone.utc)
                session.updated_at = datetime.now(timezone.utc)
                session.status = UploadStatus.UPLOADING
                return True
        
        return False
    
    async def complete_upload(
        self,
        session_id: str,
        account_id: str,
        etags: list[str] | None = None,
    ) -> UploadCompleteResult | None:
        """
        Finaliza um upload multipart.
        
        Args:
            session_id: ID da sessão
            account_id: ID da conta (para validação)
            etags: Lista de ETags de cada parte (opcional se já registradas)
        
        Returns:
            UploadCompleteResult com informações do arquivo final
        """
        session = self._sessions.get(session_id)
        
        if session is None:
            return None
        
        if session.account_id != account_id:
            return None
        
        # Se ETags foram fornecidos, registrar
        if etags:
            for i, etag in enumerate(etags, 1):
                await self.register_part_uploaded(session_id, i, etag, session.part_size)
        
        # Verificar se todas as partes foram enviadas
        if not session.is_complete:
            pending = session.get_pending_parts()
            raise ValueError(f"Upload incompleto. Partes pendentes: {pending}")
        
        # Preparar lista de partes para completar
        parts = [
            {"PartNumber": p.part_number, "ETag": p.etag}
            for p in sorted(session.parts, key=lambda x: x.part_number)
            if p.etag
        ]
        
        # Completar multipart no storage
        try:
            result = await self.storage.complete_multipart_upload(
                storage_type=session.storage_type,
                key=session.storage_key,
                upload_id=session.storage_upload_id,
                parts=parts,
            )
            
            session.status = UploadStatus.COMPLETED
            session.completed_at = datetime.now(timezone.utc)
            session.updated_at = datetime.now(timezone.utc)
            
            return UploadCompleteResult(
                asset_id=session.asset_id,
                storage_key=session.storage_key,
                etag=result.etag or "",
                size=result.size,
                status=UploadStatus.COMPLETED,
            )
        except Exception as e:
            session.status = UploadStatus.FAILED
            session.updated_at = datetime.now(timezone.utc)
            session.metadata["error"] = str(e)
            raise
    
    async def cancel_upload(
        self,
        session_id: str,
        account_id: str,
    ) -> bool:
        """Cancela um upload em andamento"""
        session = self._sessions.get(session_id)
        
        if session is None:
            return False
        
        if session.account_id != account_id:
            return False
        
        if session.status in (UploadStatus.COMPLETED, UploadStatus.CANCELLED):
            return False
        
        # Abortar multipart no storage
        try:
            provider = self.storage._get_provider(session.storage_type)
            await provider.abort_multipart_upload(
                session.storage_key,
                session.storage_upload_id,
            )
        except Exception:
            pass  # Ignorar erros de abort
        
        session.status = UploadStatus.CANCELLED
        session.updated_at = datetime.now(timezone.utc)
        
        return True
    
    async def get_session_status(
        self,
        session_id: str,
        account_id: str,
    ) -> ResumableUploadSession | None:
        """Obtém status de uma sessão de upload"""
        session = self._sessions.get(session_id)
        
        if session is None:
            return None
        
        if session.account_id != account_id:
            return None
        
        return session
    
    async def cleanup_expired_uploads(self) -> int:
        """
        Limpa uploads expirados.
        
        Deve ser executado periodicamente (ex: a cada hora).
        Retorna número de sessões limpas.
        """
        now = datetime.now(timezone.utc)
        cleaned = 0
        
        expired_sessions = [
            s for s in self._sessions.values()
            if s.expires_at and now > s.expires_at and s.status not in (
                UploadStatus.COMPLETED,
                UploadStatus.CANCELLED,
                UploadStatus.EXPIRED,
            )
        ]
        
        for session in expired_sessions:
            try:
                provider = self.storage._get_provider(session.storage_type)
                await provider.abort_multipart_upload(
                    session.storage_key,
                    session.storage_upload_id,
                )
            except Exception:
                pass
            
            session.status = UploadStatus.EXPIRED
            session.updated_at = now
            cleaned += 1
        
        return cleaned


# ==================== Dependency Injection ====================

_upload_service: ResumableUploadService | None = None


async def get_upload_service() -> ResumableUploadService:
    """Dependency para injetar o serviço de upload"""
    global _upload_service
    if _upload_service is None:
        from babybook_api.storage.hybrid_service import get_hybrid_storage
        storage = await get_hybrid_storage()
        _upload_service = ResumableUploadService(storage)
    return _upload_service

"""
Serviço de Storage Híbrido

Coordena o uso de hot storage (R2) e cold storage (B2) para:
- Uploads de originais → Cold (B2) em u/{user_id}/m/{moment_id}/
- Previews/thumbs → Hot (R2) para CDN
- Transferência entre storages (worker jobs)

Estrutura de pastas seguindo paths.py:
├── tmp/uploads/          <-- Upload em andamento (lifecycle 1 dia)
├── tmp/processing/       <-- Processamento (lifecycle 1 dia)
├── partners/{id}/{del}/ <-- Entregas de parceiros (lifecycle 365 dias)
├── u/{user_id}/m/{mid}/ <-- Momentos do usuário (sem versioning)
└── sys/defaults/        <-- Assets do sistema (permanente)
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import timedelta
from typing import Literal

from babybook_api.storage.base import (
    StorageProvider,
    StorageType,
    ObjectInfo,
    PresignedUrlResult,
    UploadPartInfo,
)
from babybook_api.storage.factory import (
    get_hot_storage,
    get_cold_storage,
    should_use_hot_storage,
)
from babybook_api.storage.paths import (
    StoragePath,
    PathPrefix,
    tmp_upload_path,
    tmp_processing_path,
    user_moment_path,
    user_thumb_path,
    user_preview_path,
    list_user_moment_prefix,
    secure_filename,
    require_uuid,
)


@dataclass
class UploadTarget:
    """Informações sobre onde e como fazer upload"""
    storage_type: StorageType
    key: str
    presigned_url: PresignedUrlResult | None = None
    multipart_urls: list[UploadPartInfo] | None = None
    upload_id: str | None = None


@dataclass
class AssetLocation:
    """Localização de um asset nos storages"""
    original_key: str | None = None
    original_storage: StorageType | None = None
    preview_key: str | None = None
    preview_storage: StorageType | None = None
    thumbnail_key: str | None = None
    thumbnail_storage: StorageType | None = None


class HybridStorageService:
    """
    Serviço que coordena operações entre hot e cold storage.
    
    Responsabilidades:
    - Decidir onde armazenar cada tipo de asset
    - Gerar URLs pré-assinadas apropriadas
    - Coordenar cópia entre storages
    - Gerenciar lifecycle e cleanup
    """
    
    def __init__(
        self,
        hot_provider: StorageProvider,
        cold_provider: StorageProvider,
    ) -> None:
        self.hot = hot_provider
        self.cold = cold_provider
    
    @classmethod
    async def create(cls) -> "HybridStorageService":
        """Factory method que inicializa os providers"""
        hot = await get_hot_storage()
        cold = await get_cold_storage()
        return cls(hot, cold)
    
    def _get_provider(self, storage_type: StorageType) -> StorageProvider:
        """Retorna o provider apropriado para o tipo de storage"""
        return self.hot if storage_type == StorageType.HOT else self.cold
    
    # ==================== Upload de Originais ====================
    
    async def prepare_upload(
        self,
        user_id: str,
        moment_id: str,
        filename: str,
        mime_type: str,
        size_bytes: int,
        use_multipart: bool = False,
        part_count: int = 1,
    ) -> UploadTarget:
        """
        Prepara URLs para upload de um novo asset.
        
        Fluxo:
        1. Upload vai para tmp/uploads/{upload_id}/ (lifecycle 1 dia)
        2. Após confirmação, move para u/{user_id}/m/{moment_id}/
        
        Decide automaticamente se vai para hot ou cold storage baseado no tipo e tamanho.
        """
        use_hot = should_use_hot_storage(mime_type, size_bytes, is_preview=False)
        storage_type = StorageType.HOT if use_hot else StorageType.COLD
        provider = self._get_provider(storage_type)
        
        # Upload vai para tmp primeiro, depois é movido
        upload_id = str(uuid.uuid4())
        tmp_path = tmp_upload_path(upload_id, filename)
        key = tmp_path.path
        
        if use_multipart and part_count > 1:
            # Upload multipart
            mp_upload_id = await provider.create_multipart_upload(
                key=key,
                content_type=mime_type,
            )
            part_urls = await provider.generate_presigned_part_urls(
                key=key,
                upload_id=mp_upload_id,
                part_count=part_count,
                expires_in=timedelta(hours=2),
            )
            return UploadTarget(
                storage_type=storage_type,
                key=key,
                upload_id=mp_upload_id,
                multipart_urls=part_urls,
            )
        else:
            # Upload simples
            presigned = await provider.generate_presigned_put_url(
                key=key,
                content_type=mime_type,
                expires_in=timedelta(hours=1),
            )
            return UploadTarget(
                storage_type=storage_type,
                key=key,
                presigned_url=presigned,
            )
    
    async def complete_multipart_upload(
        self,
        storage_type: StorageType,
        key: str,
        upload_id: str,
        parts: list[dict],
    ) -> ObjectInfo:
        """Finaliza um upload multipart"""
        provider = self._get_provider(storage_type)
        return await provider.complete_multipart_upload(key, upload_id, parts)
    
    # ==================== Previews e Thumbnails ====================
    
    async def store_preview(
        self,
        user_id: str,
        moment_id: str,
        filename: str,
        data: bytes,
        variant: Literal["thumb", "preview"] = "thumb",
        content_type: str = "image/webp",
    ) -> ObjectInfo:
        """
        Armazena um preview/thumbnail no hot storage.
        
        Previews sempre vão para R2 para acesso rápido via CDN.
        Path: u/{user_id}/m/{moment_id}/thumb/{filename}
        """
        if variant == "thumb":
            path = user_thumb_path(user_id, moment_id, filename)
        else:
            path = user_preview_path(user_id, moment_id, filename)
        
        return await self.hot.put_object(
            key=path.path,
            data=data,
            content_type=content_type,
        )
    
    async def get_preview_url(
        self,
        user_id: str,
        moment_id: str,
        filename: str,
        variant: Literal["thumb", "preview"] = "thumb",
        use_public: bool = True,
    ) -> str | None:
        """
        Obtém URL para um preview.
        
        Prefere URL pública (CDN) quando disponível.
        """
        if variant == "thumb":
            path = user_thumb_path(user_id, moment_id, filename)
        else:
            path = user_preview_path(user_id, moment_id, filename)
        
        if use_public:
            public_url = self.hot.get_public_url(path.path)
            if public_url:
                return public_url
        
        # Fallback para presigned URL
        result = await self.hot.generate_presigned_get_url(path.path)
        return result.url
    
    # ==================== Acesso a Originais ====================
    
    async def get_original_url(
        self,
        user_id: str,
        moment_id: str,
        filename: str,
        expires_in: timedelta = timedelta(hours=1),
        for_download: bool = False,
    ) -> PresignedUrlResult:
        """
        Gera URL pré-assinada para download de original.
        
        Originais estão no cold storage (B2).
        Path: u/{user_id}/m/{moment_id}/{filename}
        """
        path = user_moment_path(user_id, moment_id, filename)
        
        disposition = None
        if for_download:
            safe_name = secure_filename(filename)
            disposition = f'attachment; filename="{safe_name}"'
        
        return await self.cold.generate_presigned_get_url(
            key=path.path,
            expires_in=expires_in,
            response_content_disposition=disposition,
        )
    
    # ==================== Transferência entre Storages ====================
    
    async def copy_to_hot_storage(
        self,
        source_key: str,
        dest_key: str,
    ) -> ObjectInfo:
        """
        Copia um objeto do cold storage para o hot storage.
        
        Usado para promover assets frequentemente acessados.
        Nota: Requer download e re-upload pois são buckets diferentes.
        """
        data = await self.cold.get_object(source_key)
        info = await self.cold.get_object_info(source_key)
        
        return await self.hot.put_object(
            key=dest_key,
            data=data,
            content_type=info.content_type if info else None,
        )
    
    async def copy_to_cold_storage(
        self,
        source_key: str,
        dest_key: str,
    ) -> ObjectInfo:
        """
        Copia um objeto do hot storage para o cold storage.
        
        Usado para arquivamento ou backup.
        """
        data = await self.hot.get_object(source_key)
        info = await self.hot.get_object_info(source_key)
        
        return await self.cold.put_object(
            key=dest_key,
            data=data,
            content_type=info.content_type if info else None,
        )
    
    # ==================== Confirm Upload ====================
    
    async def confirm_upload(
        self,
        user_id: str,
        moment_id: str,
        upload_id: str,
        filename: str,
        content_type: str,
    ) -> StoragePath:
        """
        Confirma upload e move de tmp/ para u/{user_id}/m/{moment_id}/.
        
        Usa copy server-side (B2 b2_copy_file) + delete original.
        
        Args:
            user_id: UUID do usuário
            moment_id: UUID do momento
            upload_id: ID do upload retornado por prepare_upload
            filename: Nome do arquivo
            content_type: MIME type
            
        Returns:
            StoragePath final do arquivo
        """
        user_id = require_uuid(user_id, "user_id")
        moment_id = require_uuid(moment_id, "moment_id")
        
        # Path de origem (tmp)
        source_path = tmp_upload_path(upload_id, filename)
        
        # Path de destino (u/{user_id}/m/{moment_id}/)
        dest_path = user_moment_path(user_id, moment_id, filename)
        
        # Copy server-side (no cold storage)
        await self.cold.copy_object(
            source_key=source_path.path,
            dest_key=dest_path.path,
        )
        
        # Delete original do tmp
        await self.cold.delete_object(source_path.path)
        
        return dest_path
    
    # ==================== Cleanup ====================
    
    async def delete_moment_files(
        self,
        user_id: str,
        moment_id: str,
    ) -> dict[str, list[str]]:
        """
        Remove todos os arquivos de um momento de ambos os storages.
        
        Path: u/{user_id}/m/{moment_id}/
        
        Retorna dicionário com erros por storage, se houver.
        """
        errors: dict[str, list[str]] = {"hot": [], "cold": []}
        
        prefix = list_user_moment_prefix(user_id, moment_id)
        
        # Listar e deletar do hot storage (previews/thumbs)
        hot_objects, _ = await self.hot.list_objects(prefix, max_keys=500)
        if hot_objects:
            hot_errors = await self.hot.delete_objects([o.key for o in hot_objects])
            errors["hot"] = hot_errors
        
        # Listar e deletar do cold storage (originais)
        cold_objects, _ = await self.cold.list_objects(prefix, max_keys=500)
        if cold_objects:
            cold_errors = await self.cold.delete_objects([o.key for o in cold_objects])
            errors["cold"] = cold_errors
        
        return errors
    
    # ==================== Estatísticas ====================
    
    async def get_user_storage_usage(
        self,
        user_id: str,
    ) -> dict[str, int]:
        """
        Calcula uso de storage de um usuário em ambos os storages.
        
        Path: u/{user_id}/
        
        Retorna bytes usados em cada storage.
        """
        usage: dict[str, int] = {"hot": 0, "cold": 0}
        
        prefix = f"{PathPrefix.USER}/{user_id}/"
        
        # Hot storage
        hot_objects, token = await self.hot.list_objects(prefix, max_keys=1000)
        usage["hot"] = sum(o.size for o in hot_objects)
        
        while token:
            more_objects, token = await self.hot.list_objects(prefix, continuation_token=token)
            usage["hot"] += sum(o.size for o in more_objects)
        
        # Cold storage
        cold_objects, token = await self.cold.list_objects(prefix, max_keys=1000)
        usage["cold"] = sum(o.size for o in cold_objects)
        
        while token:
            more_objects, token = await self.cold.list_objects(prefix, continuation_token=token)
            usage["cold"] += sum(o.size for o in more_objects)
        
        return usage


# ==================== Dependency Injection ====================

_hybrid_service: HybridStorageService | None = None


async def get_hybrid_storage() -> HybridStorageService:
    """Dependency para injetar o serviço de storage híbrido"""
    global _hybrid_service
    if _hybrid_service is None:
        _hybrid_service = await HybridStorageService.create()
    return _hybrid_service

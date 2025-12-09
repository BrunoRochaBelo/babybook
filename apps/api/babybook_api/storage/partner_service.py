"""
Partner Storage Service

Serviço especializado para operações de storage do Partner Portal:
- Upload de fotos para pasta temporária do parceiro
- Listagem de assets de uma entrega
- Cópia server-side no resgate de voucher
- Limpeza de arquivos

Usa a estrutura de pastas:
├── tmp/uploads/{upload_id}/       <-- Upload em andamento
├── partners/{partner_id}/{delivery_id}/  <-- Entrega pronta
└── u/{user_id}/m/{moment_id}/     <-- Após resgate

@see storage/paths.py
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Literal

from babybook_api.storage.base import (
    StorageProvider,
    StorageType,
    ObjectInfo,
    PresignedUrlResult,
)
from babybook_api.storage.factory import get_cold_storage
from babybook_api.storage.paths import (
    StoragePath,
    PathPrefix,
    tmp_upload_path,
    partner_delivery_path,
    partner_thumb_path,
    user_moment_path,
    list_partner_delivery_prefix,
    list_user_moment_prefix,
    secure_filename,
    require_uuid,
)


@dataclass
class PartnerUploadTarget:
    """Informações para upload de arquivo de parceiro"""
    upload_id: str
    key: str
    presigned_url: str
    expires_at: datetime
    content_type: str


@dataclass
class DeliveryAsset:
    """Informações de um asset em uma entrega"""
    key: str
    filename: str
    size_bytes: int
    content_type: str | None
    last_modified: datetime | None


@dataclass
class CopyResult:
    """Resultado de cópia server-side"""
    source_key: str
    dest_key: str
    success: bool
    error: str | None = None


class PartnerStorageService:
    """
    Serviço de storage para operações do Partner Portal.
    
    Responsabilidades:
    - Gerar URLs presigned para upload de fotos
    - Mover arquivos de tmp/ para partners/
    - Copiar arquivos de partners/ para u/ (no resgate)
    - Gerenciar lifecycle de arquivos
    """
    
    def __init__(self, cold_storage: StorageProvider) -> None:
        self.storage = cold_storage
    
    @classmethod
    async def create(cls) -> "PartnerStorageService":
        """Factory method"""
        cold = await get_cold_storage()
        return cls(cold)
    
    # ==================== Upload Flow ====================
    
    async def init_partner_upload(
        self,
        partner_id: str,
        delivery_id: str,
        filename: str,
        content_type: str,
        size_bytes: int,
    ) -> PartnerUploadTarget:
        """
        Inicializa upload de arquivo para entrega de parceiro.
        
        Fluxo:
        1. Gera path em tmp/uploads/{upload_id}/
        2. Gera URL presigned PUT
        3. Após upload, move para partners/{partner_id}/{delivery_id}/
        
        Args:
            partner_id: UUID do parceiro
            delivery_id: UUID da entrega
            filename: Nome original do arquivo
            content_type: MIME type
            size_bytes: Tamanho esperado
            
        Returns:
            PartnerUploadTarget com URL para upload direto
        """
        partner_id = require_uuid(partner_id, "partner_id")
        delivery_id = require_uuid(delivery_id, "delivery_id")
        upload_id = str(uuid.uuid4())
        
        # Path temporário
        tmp_path = tmp_upload_path(upload_id, filename)
        
        # Gera URL presigned para PUT
        expires_in = timedelta(hours=1)
        presigned = await self.storage.generate_presigned_put_url(
            key=tmp_path.path,
            content_type=content_type,
            expires_in=expires_in,
        )
        
        return PartnerUploadTarget(
            upload_id=upload_id,
            key=tmp_path.path,
            presigned_url=presigned.url,
            expires_at=presigned.expires_at,
            content_type=content_type,
        )
    
    async def confirm_partner_upload(
        self,
        partner_id: str,
        delivery_id: str,
        upload_id: str,
        filename: str,
        content_type: str,
    ) -> StoragePath:
        """
        Confirma upload e move arquivo de tmp/ para partners/.
        
        Usa copy server-side seguido de delete do original.
        
        Args:
            partner_id: UUID do parceiro
            delivery_id: UUID da entrega
            upload_id: ID do upload retornado por init_partner_upload
            filename: Nome do arquivo
            content_type: MIME type para determinar subfolder
            
        Returns:
            StoragePath final do arquivo
        """
        partner_id = require_uuid(partner_id, "partner_id")
        delivery_id = require_uuid(delivery_id, "delivery_id")
        
        # Path de origem (tmp)
        source_path = tmp_upload_path(upload_id, filename)
        
        # Path de destino (partners)
        subfolder: Literal["photos", "videos", ""] = "photos"
        if content_type.startswith("video/"):
            subfolder = "videos"
        
        dest_path = partner_delivery_path(
            partner_id=partner_id,
            delivery_id=delivery_id,
            filename=filename,
            subfolder=subfolder,
        )
        
        # Copy server-side
        await self.storage.copy_object(
            source_key=source_path.path,
            dest_key=dest_path.path,
        )
        
        # Delete original do tmp
        await self.storage.delete_object(source_path.path)
        
        return dest_path
    
    # ==================== Delivery Assets ====================
    
    async def list_delivery_assets(
        self,
        partner_id: str,
        delivery_id: str,
    ) -> list[DeliveryAsset]:
        """
        Lista todos os assets de uma entrega.
        
        Args:
            partner_id: UUID do parceiro
            delivery_id: UUID da entrega
            
        Returns:
            Lista de DeliveryAsset
        """
        prefix = list_partner_delivery_prefix(partner_id, delivery_id)
        
        assets: list[DeliveryAsset] = []
        objects, token = await self.storage.list_objects(prefix, max_keys=500)
        
        for obj in objects:
            # Extrai filename do key
            filename = obj.key.split("/")[-1]
            if filename in ("thumb.webp", "thumb.jpg"):
                continue  # Pula thumbnail
            
            assets.append(DeliveryAsset(
                key=obj.key,
                filename=filename,
                size_bytes=obj.size,
                content_type=obj.content_type,
                last_modified=obj.last_modified,
            ))
        
        # Continua paginação se necessário
        while token:
            more_objects, token = await self.storage.list_objects(
                prefix, continuation_token=token, max_keys=500
            )
            for obj in more_objects:
                filename = obj.key.split("/")[-1]
                if filename in ("thumb.webp", "thumb.jpg"):
                    continue
                assets.append(DeliveryAsset(
                    key=obj.key,
                    filename=filename,
                    size_bytes=obj.size,
                    content_type=obj.content_type,
                    last_modified=obj.last_modified,
                ))
        
        return assets
    
    async def get_delivery_asset_url(
        self,
        partner_id: str,
        delivery_id: str,
        filename: str,
        subfolder: Literal["photos", "videos", ""] = "photos",
        expires_in: timedelta = timedelta(hours=1),
    ) -> str:
        """
        Gera URL presigned para acessar um asset da entrega.
        
        Args:
            partner_id: UUID do parceiro
            delivery_id: UUID da entrega
            filename: Nome do arquivo
            subfolder: Subpasta
            expires_in: Tempo de expiração
            
        Returns:
            URL presigned para GET
        """
        path = partner_delivery_path(partner_id, delivery_id, filename, subfolder=subfolder)
        result = await self.storage.generate_presigned_get_url(path.path, expires_in=expires_in)
        return result.url
    
    async def delete_delivery_asset(
        self,
        partner_id: str,
        delivery_id: str,
        asset_key: str,
    ) -> bool:
        """
        Deleta um asset específico da entrega.
        
        Args:
            partner_id: UUID do parceiro (para validação)
            delivery_id: UUID da entrega (para validação)
            asset_key: Key completa do asset
            
        Returns:
            True se deletado com sucesso
        """
        # Valida que o key pertence à entrega correta
        expected_prefix = list_partner_delivery_prefix(partner_id, delivery_id)
        if not asset_key.startswith(expected_prefix):
            raise ValueError("Asset não pertence a esta entrega")
        
        await self.storage.delete_object(asset_key)
        return True
    
    # ==================== Voucher Redemption (Copy) ====================
    
    async def copy_delivery_to_user(
        self,
        partner_id: str,
        delivery_id: str,
        target_user_id: str,
        target_moment_id: str,
    ) -> list[CopyResult]:
        """
        Copia todos os assets de uma entrega para a pasta do usuário.
        
        Usado quando um voucher é resgatado. Utiliza b2_copy_file para
        cópia server-side (instantânea, não consome banda).
        
        Args:
            partner_id: UUID do parceiro
            delivery_id: UUID da entrega
            target_user_id: UUID do usuário que resgatou
            target_moment_id: UUID do momento criado
            
        Returns:
            Lista de CopyResult com status de cada arquivo
        """
        target_user_id = require_uuid(target_user_id, "target_user_id")
        target_moment_id = require_uuid(target_moment_id, "target_moment_id")
        
        # Lista assets da entrega
        assets = await self.list_delivery_assets(partner_id, delivery_id)
        
        results: list[CopyResult] = []
        
        for asset in assets:
            # Calcula destino
            dest_path = user_moment_path(
                user_id=target_user_id,
                moment_id=target_moment_id,
                filename=asset.filename,
            )
            
            try:
                await self.storage.copy_object(
                    source_key=asset.key,
                    dest_key=dest_path.path,
                )
                results.append(CopyResult(
                    source_key=asset.key,
                    dest_key=dest_path.path,
                    success=True,
                ))
            except Exception as e:
                results.append(CopyResult(
                    source_key=asset.key,
                    dest_key=dest_path.path,
                    success=False,
                    error=str(e),
                ))
        
        return results
    
    async def get_delivery_stats(
        self,
        partner_id: str,
        delivery_id: str,
    ) -> dict:
        """
        Retorna estatísticas de uma entrega.
        
        Returns:
            Dict com total_files, total_bytes, file_types
        """
        assets = await self.list_delivery_assets(partner_id, delivery_id)
        
        total_bytes = sum(a.size_bytes for a in assets)
        file_types: dict[str, int] = {}
        
        for asset in assets:
            ct = asset.content_type or "unknown"
            file_types[ct] = file_types.get(ct, 0) + 1
        
        return {
            "total_files": len(assets),
            "total_bytes": total_bytes,
            "file_types": file_types,
        }
    
    # ==================== Cleanup ====================
    
    async def delete_delivery(
        self,
        partner_id: str,
        delivery_id: str,
    ) -> int:
        """
        Deleta todos os arquivos de uma entrega.
        
        Usado quando uma entrega é cancelada ou excluída.
        
        Returns:
            Número de arquivos deletados
        """
        prefix = list_partner_delivery_prefix(partner_id, delivery_id)
        
        deleted_count = 0
        objects, token = await self.storage.list_objects(prefix, max_keys=1000)
        
        if objects:
            keys = [o.key for o in objects]
            await self.storage.delete_objects(keys)
            deleted_count += len(keys)
        
        while token:
            more_objects, token = await self.storage.list_objects(
                prefix, continuation_token=token, max_keys=1000
            )
            if more_objects:
                keys = [o.key for o in more_objects]
                await self.storage.delete_objects(keys)
                deleted_count += len(keys)
        
        return deleted_count


# ==================== Dependency Injection ====================

_partner_storage_service: PartnerStorageService | None = None


async def get_partner_storage() -> PartnerStorageService:
    """Dependency para injetar o serviço de storage de parceiros"""
    global _partner_storage_service
    if _partner_storage_service is None:
        _partner_storage_service = await PartnerStorageService.create()
    return _partner_storage_service

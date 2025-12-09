"""
Storage Paths - Baby Book

Módulo centralizado para geração de caminhos no storage.
Implementa a estratégia de pastas conforme documentação:

bb-production-v1/
├── tmp/                      <-- Arquivos temporários (lifecycle: 1 dia)
│   ├── uploads/              <-- Uploads em andamento (chunked)
│   └── processing/           <-- Arquivos aguardando processamento
│
├── partners/                 <-- Zona B2B2C (lifecycle: 365 dias)
│   └── {partner_uuid}/       <-- Pasta do Fotógrafo
│       └── {delivery_uuid}/  <-- Pacote de entrega
│           ├── thumb.jpg     <-- Capa do convite
│           └── photos/       <-- As fotos originais
│
├── u/                        <-- Cofre dos Usuários (permanente)
│   └── {user_uuid}/          <-- Pasta isolada por usuário
│       ├── avatar.webp
│       └── m/                <-- Momentos
│           └── {moment_uuid}/
│               ├── video_720p.mp4
│               ├── photo_01_2048.jpg
│               └── ...
│
└── sys/                      <-- Assets do Sistema
    └── defaults/             <-- Placeholders, ícones padrão

@see docs/PLANO_ATUALIZACAO_ADAPTACAO_MONOREPO.md
"""
from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import PurePosixPath
from typing import Literal


class PathPrefix(str, Enum):
    """Prefixos raiz do bucket"""
    TMP = "tmp"
    PARTNERS = "partners"
    USERS = "u"
    SYSTEM = "sys"


class TmpSubfolder(str, Enum):
    """Subpastas do /tmp"""
    UPLOADS = "uploads"
    PROCESSING = "processing"


@dataclass(frozen=True)
class StoragePath:
    """Representa um caminho seguro no storage"""
    path: str
    prefix: PathPrefix
    
    def __str__(self) -> str:
        return self.path
    
    @property
    def parent(self) -> str:
        """Retorna o diretório pai"""
        return str(PurePosixPath(self.path).parent)
    
    @property
    def filename(self) -> str:
        """Retorna apenas o nome do arquivo"""
        return PurePosixPath(self.path).name


# =============================================================================
# Funções de Segurança
# =============================================================================

def secure_filename(filename: str) -> str:
    """
    Sanitiza o nome do arquivo removendo caracteres perigosos.
    Previne ataques de path traversal (../../etc/passwd).
    
    Args:
        filename: Nome original do arquivo
        
    Returns:
        Nome seguro, apenas alfanuméricos, hífens, underscores e um ponto
    """
    # Remove caracteres de path traversal
    filename = filename.replace("..", "").replace("/", "").replace("\\", "")
    
    # Mantém apenas caracteres seguros
    # Permite: letras, números, hífen, underscore, ponto
    safe_chars = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    
    # Remove pontos duplicados
    while ".." in safe_chars:
        safe_chars = safe_chars.replace("..", ".")
    
    # Remove pontos no início (arquivos ocultos)
    safe_chars = safe_chars.lstrip(".")
    
    # Se ficou vazio, usa um nome genérico
    if not safe_chars:
        safe_chars = "file"
    
    # Limita o tamanho
    if len(safe_chars) > 200:
        # Preserva a extensão
        parts = safe_chars.rsplit(".", 1)
        if len(parts) == 2:
            name, ext = parts
            safe_chars = f"{name[:190]}.{ext[:10]}"
        else:
            safe_chars = safe_chars[:200]
    
    return safe_chars


def validate_uuid(value: str) -> bool:
    """Valida se string é um UUID válido"""
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, TypeError):
        return False


def require_uuid(value: str, name: str = "id") -> str:
    """Valida e retorna UUID, ou levanta exceção"""
    if not validate_uuid(value):
        raise ValueError(f"{name} deve ser um UUID válido, recebido: {value}")
    return str(value)


# =============================================================================
# Geradores de Path - Temporários (/tmp)
# =============================================================================

def tmp_upload_path(
    upload_id: str,
    filename: str,
    *,
    chunk_number: int | None = None,
) -> StoragePath:
    """
    Gera path para upload temporário (chunked ou direto).
    
    Lifecycle: 1 dia (auto-delete)
    
    Args:
        upload_id: ID único do upload
        filename: Nome original do arquivo
        chunk_number: Número do chunk (se multipart)
        
    Returns:
        StoragePath para tmp/uploads/{upload_id}/...
    """
    upload_id = require_uuid(upload_id, "upload_id")
    safe_name = secure_filename(filename)
    
    if chunk_number is not None:
        path = f"{PathPrefix.TMP}/{TmpSubfolder.UPLOADS}/{upload_id}/chunks/{chunk_number:05d}"
    else:
        path = f"{PathPrefix.TMP}/{TmpSubfolder.UPLOADS}/{upload_id}/{safe_name}"
    
    return StoragePath(path=path, prefix=PathPrefix.TMP)


def tmp_processing_path(
    job_id: str,
    filename: str,
) -> StoragePath:
    """
    Gera path para arquivo em processamento.
    
    Lifecycle: 1 dia (auto-delete)
    
    Args:
        job_id: ID do job de processamento
        filename: Nome do arquivo processado
        
    Returns:
        StoragePath para tmp/processing/{job_id}/...
    """
    job_id = require_uuid(job_id, "job_id")
    safe_name = secure_filename(filename)
    
    path = f"{PathPrefix.TMP}/{TmpSubfolder.PROCESSING}/{job_id}/{safe_name}"
    return StoragePath(path=path, prefix=PathPrefix.TMP)


# =============================================================================
# Geradores de Path - Parceiros (/partners)
# =============================================================================

def partner_delivery_path(
    partner_id: str,
    delivery_id: str,
    filename: str,
    *,
    subfolder: Literal["photos", "videos", ""] = "photos",
) -> StoragePath:
    """
    Gera path para arquivos de entrega de parceiro (fotógrafo).
    
    Lifecycle: 365 dias (se voucher não resgatado)
    
    Args:
        partner_id: UUID do parceiro
        delivery_id: UUID da entrega
        filename: Nome do arquivo
        subfolder: Subpasta (photos, videos, ou raiz)
        
    Returns:
        StoragePath para partners/{partner_id}/{delivery_id}/...
    """
    partner_id = require_uuid(partner_id, "partner_id")
    delivery_id = require_uuid(delivery_id, "delivery_id")
    safe_name = secure_filename(filename)
    
    if subfolder:
        path = f"{PathPrefix.PARTNERS}/{partner_id}/{delivery_id}/{subfolder}/{safe_name}"
    else:
        path = f"{PathPrefix.PARTNERS}/{partner_id}/{delivery_id}/{safe_name}"
    
    return StoragePath(path=path, prefix=PathPrefix.PARTNERS)


def partner_thumb_path(
    partner_id: str,
    delivery_id: str,
) -> StoragePath:
    """
    Gera path para thumbnail da entrega (capa do cartão-convite).
    
    Args:
        partner_id: UUID do parceiro
        delivery_id: UUID da entrega
        
    Returns:
        StoragePath para partners/{partner_id}/{delivery_id}/thumb.webp
    """
    partner_id = require_uuid(partner_id, "partner_id")
    delivery_id = require_uuid(delivery_id, "delivery_id")
    
    path = f"{PathPrefix.PARTNERS}/{partner_id}/{delivery_id}/thumb.webp"
    return StoragePath(path=path, prefix=PathPrefix.PARTNERS)


# =============================================================================
# Geradores de Path - Usuários (/u)
# =============================================================================

def user_avatar_path(user_id: str) -> StoragePath:
    """
    Gera path para avatar do usuário.
    
    Args:
        user_id: UUID do usuário
        
    Returns:
        StoragePath para u/{user_id}/avatar.webp
    """
    user_id = require_uuid(user_id, "user_id")
    path = f"{PathPrefix.USERS}/{user_id}/avatar.webp"
    return StoragePath(path=path, prefix=PathPrefix.USERS)


def user_moment_path(
    user_id: str,
    moment_id: str,
    filename: str,
    *,
    variant: str | None = None,
) -> StoragePath:
    """
    Gera path para arquivo de momento do usuário.
    
    Lifecycle: Permanente (dados do usuário)
    
    Args:
        user_id: UUID do usuário
        moment_id: UUID do momento
        filename: Nome base do arquivo
        variant: Variante (ex: "720p", "thumb", "2048")
        
    Returns:
        StoragePath para u/{user_id}/m/{moment_id}/...
    """
    user_id = require_uuid(user_id, "user_id")
    moment_id = require_uuid(moment_id, "moment_id")
    
    if variant:
        # Insere variante antes da extensão
        parts = filename.rsplit(".", 1)
        if len(parts) == 2:
            safe_name = f"{secure_filename(parts[0])}_{variant}.{parts[1]}"
        else:
            safe_name = f"{secure_filename(filename)}_{variant}"
    else:
        safe_name = secure_filename(filename)
    
    path = f"{PathPrefix.USERS}/{user_id}/m/{moment_id}/{safe_name}"
    return StoragePath(path=path, prefix=PathPrefix.USERS)


def user_thumb_path(
    user_id: str,
    moment_id: str,
    filename: str,
) -> StoragePath:
    """
    Gera path para thumbnail de momento.
    
    Thumbnails são armazenados no hot storage (R2) para CDN.
    Path: u/{user_id}/m/{moment_id}/thumb/{filename}
    
    Args:
        user_id: UUID do usuário
        moment_id: UUID do momento
        filename: Nome do arquivo (geralmente .webp)
        
    Returns:
        StoragePath para u/{user_id}/m/{moment_id}/thumb/{filename}
    """
    user_id = require_uuid(user_id, "user_id")
    moment_id = require_uuid(moment_id, "moment_id")
    safe_name = secure_filename(filename)
    
    path = f"{PathPrefix.USERS}/{user_id}/m/{moment_id}/thumb/{safe_name}"
    return StoragePath(path=path, prefix=PathPrefix.USERS)


def user_preview_path(
    user_id: str,
    moment_id: str,
    filename: str,
) -> StoragePath:
    """
    Gera path para preview de momento.
    
    Previews são versões menores (ex: 1080p) para visualização rápida.
    Path: u/{user_id}/m/{moment_id}/preview/{filename}
    
    Args:
        user_id: UUID do usuário
        moment_id: UUID do momento
        filename: Nome do arquivo
        
    Returns:
        StoragePath para u/{user_id}/m/{moment_id}/preview/{filename}
    """
    user_id = require_uuid(user_id, "user_id")
    moment_id = require_uuid(moment_id, "moment_id")
    safe_name = secure_filename(filename)
    
    path = f"{PathPrefix.USERS}/{user_id}/m/{moment_id}/preview/{safe_name}"
    return StoragePath(path=path, prefix=PathPrefix.USERS)


def user_vault_path(
    user_id: str,
    filename: str,
) -> StoragePath:
    """
    Gera path para arquivo no cofre do usuário.
    
    Args:
        user_id: UUID do usuário
        filename: Nome do arquivo
        
    Returns:
        StoragePath para u/{user_id}/vault/{filename}
    """
    user_id = require_uuid(user_id, "user_id")
    safe_name = secure_filename(filename)
    
    path = f"{PathPrefix.USERS}/{user_id}/vault/{safe_name}"
    return StoragePath(path=path, prefix=PathPrefix.USERS)


def user_child_path(
    user_id: str,
    child_id: str,
    filename: str,
) -> StoragePath:
    """
    Gera path para arquivo de perfil de criança.
    
    Args:
        user_id: UUID do usuário (dono)
        child_id: UUID da criança
        filename: Nome do arquivo
        
    Returns:
        StoragePath para u/{user_id}/children/{child_id}/{filename}
    """
    user_id = require_uuid(user_id, "user_id")
    child_id = require_uuid(child_id, "child_id")
    safe_name = secure_filename(filename)
    
    path = f"{PathPrefix.USERS}/{user_id}/children/{child_id}/{safe_name}"
    return StoragePath(path=path, prefix=PathPrefix.USERS)


# =============================================================================
# Geradores de Path - Sistema (/sys)
# =============================================================================

def system_default_path(filename: str) -> StoragePath:
    """
    Gera path para assets padrão do sistema.
    
    Args:
        filename: Nome do arquivo
        
    Returns:
        StoragePath para sys/defaults/{filename}
    """
    safe_name = secure_filename(filename)
    path = f"{PathPrefix.SYSTEM}/defaults/{safe_name}"
    return StoragePath(path=path, prefix=PathPrefix.SYSTEM)


# =============================================================================
# Utilidades de Cópia (Server-Side)
# =============================================================================

def get_copy_destination(
    source_path: StoragePath,
    target_user_id: str,
    target_moment_id: str,
) -> StoragePath:
    """
    Calcula o destino para cópia server-side (ex: resgate de voucher).
    
    Quando um voucher é resgatado, os arquivos são copiados de
    partners/{p_id}/{d_id}/photos/* para u/{user_id}/m/{moment_id}/*
    
    Usa b2_copy_file (server-side, não consome banda).
    
    Args:
        source_path: Caminho original (na pasta do parceiro)
        target_user_id: UUID do usuário que resgatou
        target_moment_id: UUID do novo momento criado
        
    Returns:
        StoragePath de destino na pasta do usuário
    """
    target_user_id = require_uuid(target_user_id, "target_user_id")
    target_moment_id = require_uuid(target_moment_id, "target_moment_id")
    
    # Extrai o nome do arquivo do source
    filename = source_path.filename
    
    # Gera o destino na pasta do usuário
    return user_moment_path(target_user_id, target_moment_id, filename)


def list_partner_delivery_prefix(partner_id: str, delivery_id: str) -> str:
    """
    Retorna o prefixo para listar todos os arquivos de uma entrega.
    
    Usado para operações de batch (listar, copiar, deletar).
    
    Args:
        partner_id: UUID do parceiro
        delivery_id: UUID da entrega
        
    Returns:
        Prefixo: partners/{partner_id}/{delivery_id}/
    """
    partner_id = require_uuid(partner_id, "partner_id")
    delivery_id = require_uuid(delivery_id, "delivery_id")
    
    return f"{PathPrefix.PARTNERS}/{partner_id}/{delivery_id}/"


def list_user_moment_prefix(user_id: str, moment_id: str) -> str:
    """
    Retorna o prefixo para listar todos os arquivos de um momento.
    
    Args:
        user_id: UUID do usuário
        moment_id: UUID do momento
        
    Returns:
        Prefixo: u/{user_id}/m/{moment_id}/
    """
    user_id = require_uuid(user_id, "user_id")
    moment_id = require_uuid(moment_id, "moment_id")
    
    return f"{PathPrefix.USERS}/{user_id}/m/{moment_id}/"


# =============================================================================
# Validação de Acesso (para Workers/Edge)
# =============================================================================

def validate_user_access(user_id: str, requested_path: str) -> bool:
    """
    Valida se um usuário tem acesso a um determinado path.
    
    Regra: Usuário só pode acessar arquivos em /u/{seu_uuid}/
    
    Usado pelo Cloudflare Worker para validar token JWT vs URL solicitada.
    
    Args:
        user_id: UUID do usuário (do token JWT)
        requested_path: Path completo solicitado
        
    Returns:
        True se o acesso é permitido
    """
    if not validate_uuid(user_id):
        return False
    
    # Path deve começar com u/{user_id}/
    expected_prefix = f"{PathPrefix.USERS}/{user_id}/"
    return requested_path.startswith(expected_prefix)


def validate_partner_access(partner_id: str, requested_path: str) -> bool:
    """
    Valida se um parceiro tem acesso a um determinado path.
    
    Regra: Parceiro só pode acessar arquivos em /partners/{seu_uuid}/
    
    Args:
        partner_id: UUID do parceiro (do token/sessão)
        requested_path: Path completo solicitado
        
    Returns:
        True se o acesso é permitido
    """
    if not validate_uuid(partner_id):
        return False
    
    expected_prefix = f"{PathPrefix.PARTNERS}/{partner_id}/"
    return requested_path.startswith(expected_prefix)


# =============================================================================
# Lifecycle Configuration Helpers
# =============================================================================

@dataclass(frozen=True)
class LifecycleRule:
    """Configuração de lifecycle rule para o bucket"""
    prefix: str
    days_to_delete: int
    description: str


def get_lifecycle_rules() -> list[LifecycleRule]:
    """
    Retorna as regras de lifecycle recomendadas para configurar no B2.
    
    Configurar no painel B2 → Bucket Settings → Lifecycle Rules
    
    Returns:
        Lista de regras de lifecycle
    """
    return [
        LifecycleRule(
            prefix=f"{PathPrefix.TMP}/",
            days_to_delete=1,
            description="Limpar uploads falhados e arquivos de processamento",
        ),
        LifecycleRule(
            prefix=f"{PathPrefix.PARTNERS}/",
            days_to_delete=365,
            description="Deletar entregas não resgatadas após 1 ano",
        ),
    ]

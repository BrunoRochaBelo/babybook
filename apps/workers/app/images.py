from __future__ import annotations

import asyncio
import logging
import shutil
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps

from .api_client import patch_asset
from .file_validation import validate_file_on_disk
from .settings import WorkerSettings, get_settings
from .storage import StorageClient
from .types import AssetJobPayload, VariantData, log_prefix

logger = logging.getLogger(__name__)
_SETTINGS: WorkerSettings = get_settings()
_STORAGE = StorageClient(_SETTINGS)

IMAGE_PRESETS: list[tuple[str, int]] = [
    ("thumb", 400),
    ("card", 800),
    ("full", 1600),
]


async def create_thumbnail(payload: dict[str, Any], metadata: dict[str, Any]) -> None:
    job = AssetJobPayload.parse(payload, metadata)
    prefix = log_prefix(job.trace_id)
    settings = _SETTINGS
    storage = _STORAGE
    tmpdir = Path(tempfile.mkdtemp(dir=settings.tmp_dir, prefix="thumb-"))
    try:
        source_path = tmpdir / "original"
        await storage.download_file(bucket=settings.bucket_uploads, key=job.key, destination=source_path)

        # Validação de assinatura (magic bytes) antes de processar.
        # Evita que arquivos maliciosos/inesperados cheguem ao PIL.
        try:
            validate_file_on_disk(path=source_path, declared_content_type=job.mime or "application/octet-stream")
        except Exception as exc:
            logger.warning(
                "%sArquivo com assinatura inválida para asset %s (mime=%s): %s",
                prefix,
                job.asset_id,
                job.mime,
                exc,
            )
            await patch_asset(job.asset_id, status="failed", error_code="invalid_file_signature", viewer_accessible=False)
            try:
                await storage.delete_object(bucket=settings.bucket_uploads, key=job.key)
            except Exception:
                pass
            return

        original_key = _canonical_original_key(job)
        await storage.upload_file(
            bucket=settings.bucket_derivatives,
            key=original_key,
            source=source_path,
            content_type=job.mime or "application/octet-stream",
        )
        variants = await _generate_variants(tmpdir, source_path, job, storage, settings)
        await patch_asset(
            job.asset_id,
            status="ready",
            viewer_accessible=True,
            key_original=original_key,
            variants=variants,
        )
        logger.info("%sThumbnails gerados para asset %s", prefix, job.asset_id)
    except Exception:
        logger.exception("%sFalha ao gerar thumbnails para asset %s", prefix, job.asset_id)
        await patch_asset(job.asset_id, status="failed", error_code="thumbnail_error", viewer_accessible=False)
        raise
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def _generate_variants(
    tmpdir: Path,
    source: Path,
    job: AssetJobPayload,
    storage: StorageClient,
    settings,
) -> list[VariantData]:
    processed = await asyncio.to_thread(_resize_variants, source)
    variants: list[VariantData] = []
    for preset, resized_path, width, height in processed:
        dest_key = f"u/{job.account_id}/assets/{job.asset_id}/{preset}.webp"
        await storage.upload_file(
            bucket=settings.bucket_derivatives,
            key=dest_key,
            source=resized_path,
            content_type="image/webp",
        )
        variants.append(
            VariantData(
                preset=preset,
                key=dest_key,
                size_bytes=resized_path.stat().st_size,
                width_px=width,
                height_px=height,
                kind="photo",
            )
        )
    return variants


def _resize_variants(source: Path) -> list[tuple[str, Path, int, int]]:
    image = Image.open(source)
    image = ImageOps.exif_transpose(image)
    image = image.convert("RGB")
    results: list[tuple[str, Path, int, int]] = []
    for preset, max_width in IMAGE_PRESETS:
        variant = image.copy()
        variant.thumbnail((max_width, max_width * 2), Image.Resampling.LANCZOS)
        width, height = variant.size
        dest = source.parent / f"{preset}.webp"
        variant.save(dest, format="WEBP", quality=90, method=6)
        results.append((preset, dest, width, height))
    return results


def _canonical_original_key(job: AssetJobPayload) -> str:
    suffix = Path(job.key).suffix or ".bin"
    return f"u/{job.account_id}/assets/{job.asset_id}/original{suffix}"

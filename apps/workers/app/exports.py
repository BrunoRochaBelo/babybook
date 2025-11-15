from __future__ import annotations

import asyncio
import logging
import shutil
import tempfile
from pathlib import Path
from typing import Any
from zipfile import ZIP_DEFLATED, ZipFile

from .settings import WorkerSettings, get_settings
from .storage import StorageClient
from .types import ExportJobPayload, log_prefix

logger = logging.getLogger(__name__)
_SETTINGS: WorkerSettings = get_settings()
_STORAGE = StorageClient(_SETTINGS)


async def build_export_zip(payload: dict[str, Any], metadata: dict[str, Any]) -> None:
    job = ExportJobPayload.parse(payload, metadata)
    prefix = log_prefix(job.trace_id)
    settings = _SETTINGS
    storage = _STORAGE
    tmpdir = Path(tempfile.mkdtemp(dir=settings.tmp_dir, prefix="export-"))
    try:
        downloaded = await _download_items(tmpdir, storage, settings.bucket_derivatives, job)
        archive_path = tmpdir / f"{job.export_id}.zip"
        await _create_zip(archive_path, downloaded)
        dest_key = f"exports/{job.account_id}/{job.export_id}.zip"
        await storage.upload_file(
            bucket=settings.bucket_exports,
            key=dest_key,
            source=archive_path,
            content_type="application/zip",
        )
        logger.info("%sExport %s pronta (%s arquivos)", prefix, job.export_id, len(downloaded))
    except Exception:
        logger.exception("%sFalha ao construir export %s", prefix, job.export_id)
        raise
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def _download_items(
    tmpdir: Path,
    storage: StorageClient,
    bucket: str,
    job: ExportJobPayload,
) -> list[tuple[Path, str]]:
    files: list[tuple[Path, str]] = []
    for item in job.items:
        local_path = tmpdir / item.filename
        local_path.parent.mkdir(parents=True, exist_ok=True)
        await storage.download_file(bucket=bucket, key=item.key, destination=local_path)
        files.append((local_path, item.filename))
    return files


async def _create_zip(archive: Path, files: list[tuple[Path, str]]) -> None:
    def _write() -> None:
        with ZipFile(archive, "w", ZIP_DEFLATED) as zip_file:
            for path, arcname in files:
                zip_file.write(path, arcname=arcname)

    await asyncio.to_thread(_write)

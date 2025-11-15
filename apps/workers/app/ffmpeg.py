from __future__ import annotations

import asyncio
import json
import logging
import shutil
import tempfile
from pathlib import Path
from typing import Any

from .api_client import patch_asset
from .settings import WorkerSettings, get_settings
from .storage import StorageClient
from .types import AssetJobPayload, VariantData, log_prefix

logger = logging.getLogger(__name__)
_SETTINGS: WorkerSettings = get_settings()
_STORAGE = StorageClient(_SETTINGS)

VIDEO_PRESETS: list[tuple[str, int]] = [
    ("video_1080p", 1920),
    ("video_720p", 1280),
]


async def transcode_video(payload: dict[str, Any], metadata: dict[str, Any]) -> None:
    job = AssetJobPayload.parse(payload, metadata)
    prefix = log_prefix(job.trace_id)
    settings = _SETTINGS
    storage = _STORAGE
    tmpdir = Path(tempfile.mkdtemp(dir=settings.tmp_dir, prefix="video-"))
    try:
        source_path = tmpdir / "source"
        await storage.download_file(bucket=settings.bucket_uploads, key=job.key, destination=source_path)
        original_key = _canonical_original_key(job)
        await storage.upload_file(
            bucket=settings.bucket_derivatives,
            key=original_key,
            source=source_path,
            content_type=job.mime or "application/octet-stream",
        )
        variants, duration_ms = await _transcode_variants(tmpdir, source_path, job, settings, storage)
        await patch_asset(
            job.asset_id,
            status="ready",
            duration_ms=duration_ms,
            viewer_accessible=True,
            key_original=original_key,
            variants=variants,
        )
        logger.info("%sTranscodificacao concluida para asset %s", prefix, job.asset_id)
    except Exception:
        logger.exception("%sFalha ao transcodificar asset %s", prefix, job.asset_id)
        await patch_asset(
            job.asset_id,
            status="failed",
            error_code="transcode_error",
            viewer_accessible=False,
        )
        raise
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def _transcode_variants(
    tmpdir: Path,
    source: Path,
    job: AssetJobPayload,
    settings,
    storage: StorageClient,
) -> tuple[list[VariantData], int]:
    variants: list[VariantData] = []
    duration_ms = 0
    for preset, max_width in VIDEO_PRESETS:
        output_path = tmpdir / f"{preset}.mp4"
        await _run_ffmpeg(
            settings.ffmpeg_path,
            [
                "-y",
                "-hide_banner",
                "-i",
                str(source),
                "-vf",
                f"scale=min({max_width},iw):-2",
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-crf",
                "22",
                "-movflags",
                "+faststart",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                str(output_path),
            ],
        )
        width, height, duration_ms = await _probe_video(settings.ffprobe_path, output_path)
        dest_key = f"media/u/{job.account_id}/{job.asset_id}/{preset}.mp4"
        await storage.upload_file(
            bucket=settings.bucket_derivatives,
            key=dest_key,
            source=output_path,
            content_type="video/mp4",
        )
        variants.append(
            VariantData(
                preset=preset,
                key=dest_key,
                size_bytes=output_path.stat().st_size,
                width_px=width,
                height_px=height,
                kind="video",
            )
        )
    return variants, duration_ms


async def _run_ffmpeg(executable: str, args: list[str]) -> None:
    process = await asyncio.create_subprocess_exec(
        executable,
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate()
    if process.returncode != 0:
        raise RuntimeError(
            f"ffmpeg exit {process.returncode}: {stderr.decode() or stdout.decode()}".strip()
        )


async def _probe_video(executable: str, path: Path) -> tuple[int, int, int]:
    process = await asyncio.create_subprocess_exec(
        executable,
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-show_entries",
        "format=duration",
        "-print_format",
        "json",
        str(path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate()
    if process.returncode != 0:
        raise RuntimeError(f"ffprobe exit {process.returncode}: {stderr.decode()}")
    data = json.loads(stdout.decode() or "{}")
    width = int((data.get("streams") or [{}])[0].get("width") or 0)
    height = int((data.get("streams") or [{}])[0].get("height") or 0)
    duration_raw = data.get("format", {}).get("duration")
    duration_ms = int(float(duration_raw) * 1000) if duration_raw else 0
    return width, height, duration_ms


def _canonical_original_key(job: AssetJobPayload) -> str:
    suffix = Path(job.key).suffix or ".bin"
    return f"media/u/{job.account_id}/{job.asset_id}/original{suffix}"

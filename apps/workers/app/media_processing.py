"""
Media Processing Job Handlers

Job handlers for server-side fallback media processing.
These handlers process jobs queued by the API when client-side 
processing (ffmpeg.wasm) is unavailable or fails.

Supports:
- Video transcoding (4K → 720p/1080p/480p)
- Video thumbnail extraction
- Image optimization and variant generation
"""

from __future__ import annotations

import asyncio
import logging
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any

from .api_client import patch_asset
from .file_validation import validate_file_prefix_on_disk
from .settings import WorkerSettings, get_settings
from .storage import StorageClient
from .types import VariantData

logger = logging.getLogger(__name__)
_SETTINGS: WorkerSettings = get_settings()
_STORAGE = StorageClient(_SETTINGS)


# Resolution presets matching client-side options
RESOLUTION_PRESETS = {
    "480p": {"width": 854, "height": 480, "bitrate": "1500k", "crf": 28},
    "720p": {"width": 1280, "height": 720, "bitrate": "2500k", "crf": 23},
    "1080p": {"width": 1920, "height": 1080, "bitrate": "5000k", "crf": 20},
}

# Quality presets
QUALITY_PRESETS = {
    "low": {"crf": 28, "preset": "fast"},
    "medium": {"crf": 23, "preset": "medium"},
    "high": {"crf": 18, "preset": "slow"},
}


async def process_transcode_job(payload: dict[str, Any], metadata: dict[str, Any]) -> None:
    """
    Process a video transcoding job from the fallback queue.
    
    Payload format:
    {
        "job_id": str,
        "asset_id": str,
        "source_key": str,
        "options": {
            "resolution": "720p" | "1080p" | "480p",
            "format": "mp4" | "webm",
            "quality": "low" | "medium" | "high",
            "generate_thumbnail": bool,
            "thumbnail_time_seconds": float
        }
    }
    """
    trace_id = metadata.get("trace_id", "unknown")
    prefix = f"[{trace_id}] "
    settings = _SETTINGS
    storage = _STORAGE
    
    job_id = payload.get("job_id", "unknown")
    asset_id = payload.get("asset_id")
    source_key = payload.get("source_key")
    options = payload.get("options", {})
    
    if not asset_id or not source_key:
        raise ValueError("Missing required fields: asset_id or source_key")
    
    resolution = options.get("resolution", "720p")
    format_type = options.get("format", "mp4")
    quality = options.get("quality", "medium")
    generate_thumbnail = options.get("generate_thumbnail", True)
    thumbnail_time = options.get("thumbnail_time_seconds", 1.0)
    
    tmpdir = Path(tempfile.mkdtemp(dir=settings.tmp_dir, prefix=f"transcode-{job_id[:8]}-"))
    start_time = datetime.utcnow()
    
    try:
        logger.info("%sStarting transcode job %s for asset %s", prefix, job_id, asset_id)
        
        # Download source file
        source_path = tmpdir / "source"
        await storage.download_file(
            bucket=settings.bucket_uploads,
            key=source_key,
            destination=source_path,
        )
        logger.info("%sDownloaded source file for job %s", prefix, job_id)

        try:
            # O payload deste handler não traz o MIME com confiabilidade.
            # Ainda assim, validar assinatura ajuda a bloquear casos óbvios.
            validate_file_prefix_on_disk(path=source_path, allowed_prefixes=("video/",))
        except Exception as exc:
            logger.warning("%sArquivo com assinatura inválida (fallback transcode) asset=%s: %s", prefix, asset_id, exc)
            await patch_asset(
                asset_id,
                status="failed",
                error_code="invalid_file_signature",
                viewer_accessible=False,
            )
            try:
                await storage.delete_object(bucket=settings.bucket_uploads, key=source_key)
            except Exception:
                pass
            return
        
        # Get resolution and quality settings
        res_config = RESOLUTION_PRESETS.get(resolution, RESOLUTION_PRESETS["720p"])
        quality_config = QUALITY_PRESETS.get(quality, QUALITY_PRESETS["medium"])
        
        # Build output filename
        output_filename = f"transcoded.{format_type}"
        output_path = tmpdir / output_filename
        
        # Build ffmpeg command
        args = [
            "-y",
            "-hide_banner",
            "-i", str(source_path),
            "-vf", f"scale={res_config['width']}:{res_config['height']}:force_original_aspect_ratio=decrease,pad={res_config['width']}:{res_config['height']}:(ow-iw)/2:(oh-ih)/2",
        ]
        
        if format_type == "webm":
            args.extend([
                "-c:v", "libvpx-vp9",
                "-crf", str(quality_config["crf"]),
                "-b:v", res_config["bitrate"],
                "-c:a", "libopus",
                "-b:a", "128k",
            ])
        else:  # mp4
            args.extend([
                "-c:v", "libx264",
                "-preset", quality_config["preset"],
                "-crf", str(quality_config["crf"]),
                "-movflags", "+faststart",
                "-c:a", "aac",
                "-b:a", "128k",
            ])
        
        args.append(str(output_path))
        
        # Run ffmpeg
        await _run_ffmpeg(settings.ffmpeg_path, args)
        logger.info("%sTranscoding complete for job %s", prefix, job_id)
        
        # Upload transcoded file
        dest_key = f"media/processed/{asset_id}/transcoded_{resolution}.{format_type}"
        content_type = "video/webm" if format_type == "webm" else "video/mp4"
        
        await storage.upload_file(
            bucket=settings.bucket_derivatives,
            key=dest_key,
            source=output_path,
            content_type=content_type,
        )
        
        # Probe video for metadata
        width, height, duration_ms = await _probe_video(settings.ffprobe_path, output_path)
        
        variants = [
            VariantData(
                preset=f"video_{resolution}",
                key=dest_key,
                size_bytes=output_path.stat().st_size,
                width_px=width,
                height_px=height,
                kind="video",
            )
        ]
        
        # Generate thumbnail if requested
        thumbnail_key = None
        if generate_thumbnail:
            thumb_path = tmpdir / "thumbnail.jpg"
            await _extract_thumbnail(
                settings.ffmpeg_path,
                source_path,
                thumb_path,
                thumbnail_time,
                width=320,
                height=180,
            )
            
            thumbnail_key = f"media/processed/{asset_id}/thumbnail.jpg"
            await storage.upload_file(
                bucket=settings.bucket_derivatives,
                key=thumbnail_key,
                source=thumb_path,
                content_type="image/jpeg",
            )
            
            variants.append(
                VariantData(
                    preset="thumbnail",
                    key=thumbnail_key,
                    size_bytes=thumb_path.stat().st_size,
                    width_px=320,
                    height_px=180,
                    kind="image",
                )
            )
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Update asset with results
        await patch_asset(
            asset_id,
            status="ready",
            duration_ms=duration_ms,
            viewer_accessible=True,
            key_original=source_key,
            variants=[v.__dict__ for v in variants],
        )
        
        logger.info(
            "%sTranscode job %s completed in %.2fs for asset %s",
            prefix, job_id, processing_time, asset_id
        )
        
    except Exception:
        logger.exception("%sFailed transcode job %s for asset %s", prefix, job_id, asset_id)
        await patch_asset(
            asset_id,
            status="failed",
            error_code="transcode_fallback_error",
            viewer_accessible=False,
        )
        raise
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def process_image_optimize_job(payload: dict[str, Any], metadata: dict[str, Any]) -> None:
    """
    Process an image optimization job from the fallback queue.
    
    Payload format:
    {
        "job_id": str,
        "asset_id": str,
        "source_key": str,
        "options": {
            "max_width": int,
            "max_height": int,
            "quality": int (1-100),
            "format": "webp" | "jpeg" | "png",
            "generate_variants": bool,
            "variant_widths": list[int]
        }
    }
    """
    trace_id = metadata.get("trace_id", "unknown")
    prefix = f"[{trace_id}] "
    settings = _SETTINGS
    storage = _STORAGE
    
    job_id = payload.get("job_id", "unknown")
    asset_id = payload.get("asset_id")
    source_key = payload.get("source_key")
    options = payload.get("options", {})
    
    if not asset_id or not source_key:
        raise ValueError("Missing required fields: asset_id or source_key")
    
    max_width = options.get("max_width", 1920)
    max_height = options.get("max_height", 1080)
    quality = options.get("quality", 85)
    format_type = options.get("format", "webp")
    generate_variants = options.get("generate_variants", True)
    variant_widths = options.get("variant_widths", [320, 640, 1280, 1920])
    
    tmpdir = Path(tempfile.mkdtemp(dir=settings.tmp_dir, prefix=f"optimize-{job_id[:8]}-"))
    start_time = datetime.utcnow()
    
    try:
        logger.info("%sStarting image optimize job %s for asset %s", prefix, job_id, asset_id)
        
        # Download source file
        source_path = tmpdir / "source"
        await storage.download_file(
            bucket=settings.bucket_uploads,
            key=source_key,
            destination=source_path,
        )

        try:
            validate_file_prefix_on_disk(path=source_path, allowed_prefixes=("image/",))
        except Exception as exc:
            logger.warning("%sArquivo com assinatura inválida (image optimize) asset=%s: %s", prefix, asset_id, exc)
            await patch_asset(
                asset_id,
                status="failed",
                error_code="invalid_file_signature",
                viewer_accessible=False,
            )
            try:
                await storage.delete_object(bucket=settings.bucket_uploads, key=source_key)
            except Exception:
                pass
            return
        
        variants: list[VariantData] = []
        
        # Generate main optimized version
        main_output = tmpdir / f"optimized.{format_type}"
        await _optimize_image(
            settings.ffmpeg_path,
            source_path,
            main_output,
            max_width,
            max_height,
            quality,
            format_type,
        )
        
        main_key = f"media/processed/{asset_id}/optimized.{format_type}"
        content_type = _get_image_content_type(format_type)
        
        await storage.upload_file(
            bucket=settings.bucket_derivatives,
            key=main_key,
            source=main_output,
            content_type=content_type,
        )
        
        # Get dimensions
        width, height = await _get_image_dimensions(settings.ffprobe_path, main_output)
        
        variants.append(
            VariantData(
                preset="optimized",
                key=main_key,
                size_bytes=main_output.stat().st_size,
                width_px=width,
                height_px=height,
                kind="image",
            )
        )
        
        # Generate size variants if requested
        if generate_variants:
            for vw in variant_widths:
                if vw >= max_width:
                    continue  # Skip variants larger than main
                
                variant_output = tmpdir / f"variant_{vw}.{format_type}"
                await _optimize_image(
                    settings.ffmpeg_path,
                    source_path,
                    variant_output,
                    vw,
                    int(vw * (max_height / max_width)),
                    quality,
                    format_type,
                )
                
                variant_key = f"media/processed/{asset_id}/variant_{vw}.{format_type}"
                await storage.upload_file(
                    bucket=settings.bucket_derivatives,
                    key=variant_key,
                    source=variant_output,
                    content_type=content_type,
                )
                
                vwidth, vheight = await _get_image_dimensions(settings.ffprobe_path, variant_output)
                
                variants.append(
                    VariantData(
                        preset=f"variant_{vw}",
                        key=variant_key,
                        size_bytes=variant_output.stat().st_size,
                        width_px=vwidth,
                        height_px=vheight,
                        kind="image",
                    )
                )
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        await patch_asset(
            asset_id,
            status="ready",
            viewer_accessible=True,
            key_original=source_key,
            variants=[v.__dict__ for v in variants],
        )
        
        logger.info(
            "%sImage optimize job %s completed in %.2fs for asset %s with %d variants",
            prefix, job_id, processing_time, asset_id, len(variants)
        )
        
    except Exception:
        logger.exception("%sFailed image optimize job %s for asset %s", prefix, job_id, asset_id)
        await patch_asset(
            asset_id,
            status="failed",
            error_code="image_optimize_error",
            viewer_accessible=False,
        )
        raise
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


async def process_thumbnail_job(payload: dict[str, Any], metadata: dict[str, Any]) -> None:
    """
    Process a thumbnail extraction job from the fallback queue.
    
    Payload format:
    {
        "job_id": str,
        "asset_id": str,
        "source_key": str,
        "options": {
            "time_seconds": float,
            "width": int,
            "height": int,
            "format": "jpeg" | "webp" | "png"
        }
    }
    """
    trace_id = metadata.get("trace_id", "unknown")
    prefix = f"[{trace_id}] "
    settings = _SETTINGS
    storage = _STORAGE
    
    job_id = payload.get("job_id", "unknown")
    asset_id = payload.get("asset_id")
    source_key = payload.get("source_key")
    options = payload.get("options", {})
    
    if not asset_id or not source_key:
        raise ValueError("Missing required fields: asset_id or source_key")
    
    time_seconds = options.get("time_seconds", 1.0)
    width = options.get("width", 320)
    height = options.get("height", 180)
    format_type = options.get("format", "jpeg")
    
    tmpdir = Path(tempfile.mkdtemp(dir=settings.tmp_dir, prefix=f"thumb-{job_id[:8]}-"))
    
    try:
        logger.info("%sStarting thumbnail job %s for asset %s", prefix, job_id, asset_id)
        
        source_path = tmpdir / "source"
        await storage.download_file(
            bucket=settings.bucket_uploads,
            key=source_key,
            destination=source_path,
        )

        try:
            validate_file_prefix_on_disk(path=source_path, allowed_prefixes=("video/",))
        except Exception as exc:
            logger.warning("%sArquivo com assinatura inválida (thumbnail) asset=%s: %s", prefix, asset_id, exc)
            await patch_asset(
                asset_id,
                status="failed",
                error_code="invalid_file_signature",
                viewer_accessible=False,
            )
            try:
                await storage.delete_object(bucket=settings.bucket_uploads, key=source_key)
            except Exception:
                pass
            return
        
        output_path = tmpdir / f"thumbnail.{format_type}"
        await _extract_thumbnail(
            settings.ffmpeg_path,
            source_path,
            output_path,
            time_seconds,
            width,
            height,
        )
        
        thumbnail_key = f"media/processed/{asset_id}/thumbnail.{format_type}"
        content_type = _get_image_content_type(format_type)
        
        await storage.upload_file(
            bucket=settings.bucket_derivatives,
            key=thumbnail_key,
            source=output_path,
            content_type=content_type,
        )
        
        await patch_asset(
            asset_id,
            status="ready",
            viewer_accessible=True,
            variants=[{
                "preset": "thumbnail",
                "key": thumbnail_key,
                "size_bytes": output_path.stat().st_size,
                "width_px": width,
                "height_px": height,
                "kind": "image",
            }],
        )
        
        logger.info("%sThumbnail job %s completed for asset %s", prefix, job_id, asset_id)
        
    except Exception:
        logger.exception("%sFailed thumbnail job %s for asset %s", prefix, job_id, asset_id)
        await patch_asset(
            asset_id,
            status="failed",
            error_code="thumbnail_error",
            viewer_accessible=False,
        )
        raise
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


# ============================================================
# Helper Functions
# ============================================================

async def _run_ffmpeg(executable: str, args: list[str]) -> None:
    """Run ffmpeg with given arguments."""
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
    """Probe video for dimensions and duration."""
    import json
    
    process = await asyncio.create_subprocess_exec(
        executable,
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-show_entries", "format=duration",
        "-print_format", "json",
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


async def _get_image_dimensions(executable: str, path: Path) -> tuple[int, int]:
    """Get image dimensions using ffprobe."""
    import json
    
    process = await asyncio.create_subprocess_exec(
        executable,
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-print_format", "json",
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
    return width, height


async def _extract_thumbnail(
    executable: str,
    source: Path,
    output: Path,
    time_seconds: float,
    width: int,
    height: int,
) -> None:
    """Extract a thumbnail from a video."""
    await _run_ffmpeg(executable, [
        "-ss", str(time_seconds),
        "-i", str(source),
        "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease",
        "-frames:v", "1",
        "-q:v", "2",
        "-y", str(output),
    ])


async def _optimize_image(
    executable: str,
    source: Path,
    output: Path,
    max_width: int,
    max_height: int,
    quality: int,
    format_type: str,
) -> None:
    """Optimize an image with resize and compression."""
    # Quality mapping (1-100 to ffmpeg scale)
    q_value = max(1, min(31, int((100 - quality) / 3) + 1))
    
    args = [
        "-i", str(source),
        "-vf", f"scale='min({max_width},iw)':min'({max_height},ih)':force_original_aspect_ratio=decrease",
    ]
    
    if format_type == "webp":
        args.extend(["-quality", str(quality)])
    else:
        args.extend(["-q:v", str(q_value)])
    
    args.extend(["-y", str(output)])
    
    await _run_ffmpeg(executable, args)


def _get_image_content_type(format_type: str) -> str:
    """Get MIME type for image format."""
    content_types = {
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }
    return content_types.get(format_type, "image/jpeg")

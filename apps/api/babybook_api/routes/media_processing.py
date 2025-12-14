"""
Media Processing Routes (Server-Side Fallback)

API endpoints for server-side media processing when client-side
processing (ffmpeg.wasm) is unavailable or fails.

Jobs are queued to Cloudflare Queues and processed by workers with ffmpeg.
"""

from datetime import datetime
from typing import Optional
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.deps import get_db
from babybook_api.auth.session import UserSession, get_current_user
from babybook_api.settings import settings
from babybook_api.schemas.media_processing import (
    TranscodeJobRequest,
    ImageOptimizeJobRequest,
    ThumbnailJobRequest,
    BatchProcessingRequest,
    ProcessingJobResponse,
    ProcessingJobStatusResponse,
    BatchProcessingResponse,
    ProcessingStatus,
)

router = APIRouter()


# In-memory job store (replace with Redis/DB in production)
# This is a simplified implementation - production would use a persistent store
_job_store: dict[str, dict] = {}


def _validate_callback_url(callback_url: Optional[str]) -> Optional[str]:
    """Valida callback_url para evitar SSRF.

    Regra atual (conservadora): permite apenas URLs absolutas apontando para o MESMO
    host do FRONTEND_URL (settings.frontend_url). Em staging/prod isso implica https.

    Obs: hoje callback_url é apenas armazenado (não é chamado). Ainda assim, validar
    desde já evita que esse campo vire vetor de SSRF quando o worker passar a executar callbacks.
    """
    if callback_url is None:
        return None

    raw = callback_url.strip()
    if raw == "":
        return None

    parsed = urlparse(raw)

    allowed_schemes = {"http", "https"} if settings.app_env == "local" else {"https"}
    if parsed.scheme not in allowed_schemes:
        raise HTTPException(status_code=400, detail="Invalid callback_url")

    if not parsed.netloc or parsed.hostname is None:
        raise HTTPException(status_code=400, detail="Invalid callback_url")

    # Bloqueia credenciais na URL (ex.: https://user:pass@host)
    if parsed.username or parsed.password:
        raise HTTPException(status_code=400, detail="Invalid callback_url")

    frontend_host = urlparse(settings.frontend_url).hostname
    if not frontend_host:
        # Guardrail: frontend_url deve ser válido; se não for, rejeita callbacks
        raise HTTPException(status_code=400, detail="Invalid callback_url")

    if parsed.hostname.lower() != frontend_host.lower():
        raise HTTPException(status_code=400, detail="Invalid callback_url")

    # Se houver porta explícita, deve bater com a do FRONTEND_URL (quando definida)
    frontend_port = urlparse(settings.frontend_url).port
    if parsed.port is not None:
        if frontend_port is not None and parsed.port != frontend_port:
            raise HTTPException(status_code=400, detail="Invalid callback_url")
        if frontend_port is None:
            default_port = 443 if parsed.scheme == "https" else 80
            if parsed.port != default_port:
                raise HTTPException(status_code=400, detail="Invalid callback_url")

    return raw


def generate_job_id() -> str:
    """Generate a unique job ID."""
    return f"job_{uuid4().hex[:16]}"


async def queue_processing_job(
    job_id: str,
    job_type: str,
    asset_id: str,
    source_key: str,
    options: dict,
    priority: int,
    callback_url: Optional[str],
    user_id: str,
) -> int:
    """
    Queue a processing job to Cloudflare Queues.
    
    In production, this would:
    1. Publish message to Cloudflare Queue
    2. Store job metadata in database
    3. Return queue position
    
    For now, we store in memory and simulate queue position.
    """
    job_data = {
        "job_id": job_id,
        "job_type": job_type,
        "asset_id": asset_id,
        "source_key": source_key,
        "options": options,
        "priority": priority,
        "callback_url": callback_url,
        "user_id": user_id,
        "status": ProcessingStatus.PENDING,
        "progress": 0.0,
        "stage": None,
        "output_key": None,
        "output_url": None,
        "thumbnail_key": None,
        "thumbnail_url": None,
        "variants": None,
        "error_message": None,
        "processing_time_seconds": None,
        "created_at": datetime.utcnow(),
        "started_at": None,
        "completed_at": None,
    }
    
    _job_store[job_id] = job_data
    
    # Simulate queue position based on pending jobs
    pending_count = sum(
        1 for j in _job_store.values()
        if j["status"] == ProcessingStatus.PENDING
    )
    
    return pending_count


@router.post(
    "/transcode",
    response_model=ProcessingJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Queue video transcoding job",
    description="""
    Queue a video for server-side transcoding. Use this endpoint when:
    - Client doesn't support SharedArrayBuffer (required for ffmpeg.wasm)
    - Client-side processing failed
    - Device has limited resources (mobile, low-end)
    
    The job will be processed by workers and the result stored in the
    appropriate storage tier (R2-only; hot/cold são distinções lógicas).
    """,
)
async def queue_transcode_job(
    request: TranscodeJobRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> ProcessingJobResponse:
    """Queue a video transcoding job."""
    
    job_id = generate_job_id()
    
    options = {
        "resolution": request.resolution,
        "format": request.format,
        "quality": request.quality,
        "generate_thumbnail": request.generate_thumbnail,
        "thumbnail_time_seconds": request.thumbnail_time_seconds,
    }
    
    queue_position = await queue_processing_job(
        job_id=job_id,
        job_type="transcode",
        asset_id=request.asset_id,
        source_key=request.source_key,
        options=options,
        priority=request.priority,
        callback_url=_validate_callback_url(request.callback_url),
        user_id=str(current_user.id),
    )
    
    # Estimate completion time based on queue position and average processing time
    # Assume ~30 seconds per video on average
    estimated_seconds = queue_position * 30
    
    return ProcessingJobResponse(
        job_id=job_id,
        asset_id=request.asset_id,
        status=ProcessingStatus.PENDING,
        queue_position=queue_position,
        estimated_completion_seconds=estimated_seconds,
        created_at=datetime.utcnow(),
    )


@router.post(
    "/optimize-image",
    response_model=ProcessingJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Queue image optimization job",
)
async def queue_image_optimize_job(
    request: ImageOptimizeJobRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> ProcessingJobResponse:
    """Queue an image optimization job."""
    
    job_id = generate_job_id()
    
    options = {
        "max_width": request.max_width,
        "max_height": request.max_height,
        "quality": request.quality,
        "format": request.format,
        "generate_variants": request.generate_variants,
        "variant_widths": request.variant_widths,
    }
    
    queue_position = await queue_processing_job(
        job_id=job_id,
        job_type="optimize_image",
        asset_id=request.asset_id,
        source_key=request.source_key,
        options=options,
        priority=request.priority,
        callback_url=_validate_callback_url(request.callback_url),
        user_id=str(current_user.id),
    )
    
    # Image processing is faster, ~5 seconds average
    estimated_seconds = queue_position * 5
    
    return ProcessingJobResponse(
        job_id=job_id,
        asset_id=request.asset_id,
        status=ProcessingStatus.PENDING,
        queue_position=queue_position,
        estimated_completion_seconds=estimated_seconds,
        created_at=datetime.utcnow(),
    )


@router.post(
    "/thumbnail",
    response_model=ProcessingJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Queue thumbnail extraction job",
)
async def queue_thumbnail_job(
    request: ThumbnailJobRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> ProcessingJobResponse:
    """Queue a video thumbnail extraction job."""
    
    job_id = generate_job_id()
    
    options = {
        "time_seconds": request.time_seconds,
        "width": request.width,
        "height": request.height,
        "format": request.format,
    }
    
    queue_position = await queue_processing_job(
        job_id=job_id,
        job_type="thumbnail",
        asset_id=request.asset_id,
        source_key=request.source_key,
        options=options,
        priority=8,  # Thumbnails are high priority
        callback_url=None,
        user_id=str(current_user.id),
    )
    
    # Thumbnail extraction is fast, ~3 seconds
    estimated_seconds = queue_position * 3
    
    return ProcessingJobResponse(
        job_id=job_id,
        asset_id=request.asset_id,
        status=ProcessingStatus.PENDING,
        queue_position=queue_position,
        estimated_completion_seconds=estimated_seconds,
        created_at=datetime.utcnow(),
    )


@router.post(
    "/batch",
    response_model=BatchProcessingResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Queue batch processing job",
    description="Queue multiple assets for processing in a single request.",
)
async def queue_batch_processing(
    request: BatchProcessingRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> BatchProcessingResponse:
    """Queue multiple assets for processing."""
    
    batch_id = f"batch_{uuid4().hex[:12]}"
    jobs: list[ProcessingJobResponse] = []
    errors: list[str] = []
    
    for asset_id in request.asset_ids:
        try:
            job_id = generate_job_id()
            
            if request.processing_type == "video":
                options = {
                    "resolution": request.video_resolution,
                    "format": request.video_format,
                    "quality": request.video_quality,
                    "generate_thumbnail": True,
                }
                job_type = "transcode"
            else:
                options = {
                    "max_width": request.image_max_width,
                    "max_height": request.image_max_height,
                    "quality": request.image_quality,
                    "format": request.image_format,
                    "generate_variants": True,
                }
                job_type = "optimize_image"
            
            queue_position = await queue_processing_job(
                job_id=job_id,
                job_type=job_type,
                asset_id=asset_id,
                source_key=f"uploads/{asset_id}",  # Infer source key
                options=options,
                priority=request.priority,
                callback_url=None,
                user_id=str(current_user.id),
            )
            
            jobs.append(ProcessingJobResponse(
                job_id=job_id,
                asset_id=asset_id,
                status=ProcessingStatus.PENDING,
                queue_position=queue_position,
                created_at=datetime.utcnow(),
            ))
        except Exception as e:
            errors.append(f"Failed to queue {asset_id}: {str(e)}")
    
    return BatchProcessingResponse(
        batch_id=batch_id,
        jobs=jobs,
        total_jobs=len(request.asset_ids),
        queued_jobs=len(jobs),
        failed_to_queue=len(errors),
        errors=errors,
    )


@router.get(
    "/jobs/{job_id}",
    response_model=ProcessingJobStatusResponse,
    summary="Get job status",
    description="Get detailed status of a processing job.",
)
async def get_job_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> ProcessingJobStatusResponse:
    """Get the status of a processing job."""
    
    job = _job_store.get(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )
    
    # Check ownership
    if job["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this job",
        )
    
    # Calculate current queue position for pending jobs
    queue_position = None
    if job["status"] == ProcessingStatus.PENDING:
        pending_jobs = [
            j for j in _job_store.values()
            if j["status"] == ProcessingStatus.PENDING
            and j["created_at"] <= job["created_at"]
        ]
        queue_position = len(pending_jobs)
    
    return ProcessingJobStatusResponse(
        job_id=job["job_id"],
        asset_id=job["asset_id"],
        status=job["status"],
        progress=job["progress"],
        stage=job["stage"],
        queue_position=queue_position,
        output_key=job["output_key"],
        output_url=job["output_url"],
        thumbnail_key=job["thumbnail_key"],
        thumbnail_url=job["thumbnail_url"],
        variants=job["variants"],
        error_message=job["error_message"],
        processing_time_seconds=job["processing_time_seconds"],
        created_at=job["created_at"],
        started_at=job["started_at"],
        completed_at=job["completed_at"],
    )


@router.delete(
    "/jobs/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel job",
    description="Cancel a pending processing job.",
)
async def cancel_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> None:
    """Cancel a pending processing job."""
    
    job = _job_store.get(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )
    
    if job["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this job",
        )
    
    if job["status"] != ProcessingStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel job in {job['status']} status",
        )
    
    # Remove from store
    del _job_store[job_id]


@router.get(
    "/jobs",
    response_model=list[ProcessingJobStatusResponse],
    summary="List user's jobs",
    description="List all processing jobs for the current user.",
)
async def list_jobs(
    status_filter: Optional[ProcessingStatus] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
) -> list[ProcessingJobStatusResponse]:
    """List processing jobs for the current user."""
    
    user_jobs = [
        j for j in _job_store.values()
        if j["user_id"] == str(current_user.id)
    ]
    
    if status_filter:
        user_jobs = [j for j in user_jobs if j["status"] == status_filter]
    
    # Sort by created_at descending
    user_jobs.sort(key=lambda j: j["created_at"], reverse=True)
    
    # Apply limit
    user_jobs = user_jobs[:limit]
    
    return [
        ProcessingJobStatusResponse(
            job_id=j["job_id"],
            asset_id=j["asset_id"],
            status=j["status"],
            progress=j["progress"],
            stage=j["stage"],
            queue_position=None,
            output_key=j["output_key"],
            output_url=j["output_url"],
            thumbnail_key=j["thumbnail_key"],
            thumbnail_url=j["thumbnail_url"],
            variants=j["variants"],
            error_message=j["error_message"],
            processing_time_seconds=j["processing_time_seconds"],
            created_at=j["created_at"],
            started_at=j["started_at"],
            completed_at=j["completed_at"],
        )
        for j in user_jobs
    ]

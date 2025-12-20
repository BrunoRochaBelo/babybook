"""
Media Processing Schemas

Pydantic schemas for server-side media processing endpoints.
Used when client-side processing (ffmpeg.wasm) is unavailable or fails.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class MediaType(str, Enum):
    """Supported media types for processing."""
    VIDEO = "video"
    IMAGE = "image"


class ProcessingStatus(str, Enum):
    """Processing job status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class VideoResolution(str, Enum):
    """Supported video resolutions."""
    RES_480P = "480p"
    RES_720P = "720p"
    RES_1080P = "1080p"


class VideoFormat(str, Enum):
    """Supported video output formats."""
    MP4 = "mp4"
    WEBM = "webm"


class VideoQuality(str, Enum):
    """Video quality presets."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ImageFormat(str, Enum):
    """Supported image output formats."""
    JPEG = "jpeg"
    PNG = "png"
    WEBP = "webp"


# ============================================================
# Request Schemas
# ============================================================

class TranscodeJobRequest(BaseModel):
    """Request to queue a video transcoding job."""

    model_config = ConfigDict(use_enum_values=True)

    asset_id: str = Field(..., description="ID of the uploaded asset to process")
    source_key: str = Field(..., description="Storage key of the source file")
    resolution: VideoResolution = Field(
        default=VideoResolution.RES_720P,
        description="Target resolution for transcoding"
    )
    format: VideoFormat = Field(
        default=VideoFormat.MP4,
        description="Output video format"
    )
    quality: VideoQuality = Field(
        default=VideoQuality.MEDIUM,
        description="Encoding quality preset"
    )
    generate_thumbnail: bool = Field(
        default=True,
        description="Whether to generate a thumbnail"
    )
    thumbnail_time_seconds: float = Field(
        default=1.0,
        ge=0,
        description="Time position for thumbnail extraction"
    )
    priority: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Job priority (1=lowest, 10=highest)"
    )
    callback_url: Optional[str] = Field(
        default=None,
        description="Webhook URL to call when processing completes"
    )


class ImageOptimizeJobRequest(BaseModel):
    """Request to queue an image optimization job."""

    model_config = ConfigDict(use_enum_values=True)

    asset_id: str = Field(..., description="ID of the uploaded asset to process")
    source_key: str = Field(..., description="Storage key of the source file")
    max_width: int = Field(
        default=1920,
        ge=1,
        le=4096,
        description="Maximum output width"
    )
    max_height: int = Field(
        default=1080,
        ge=1,
        le=4096,
        description="Maximum output height"
    )
    quality: int = Field(
        default=85,
        ge=1,
        le=100,
        description="Output quality (1-100)"
    )
    format: ImageFormat = Field(
        default=ImageFormat.WEBP,
        description="Output image format"
    )
    generate_variants: bool = Field(
        default=True,
        description="Generate multiple size variants"
    )
    variant_widths: List[int] = Field(
        default=[320, 640, 1280, 1920],
        description="Widths for variant generation"
    )
    priority: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Job priority"
    )
    callback_url: Optional[str] = Field(
        default=None,
        description="Webhook URL for completion"
    )


class ThumbnailJobRequest(BaseModel):
    """Request to extract a thumbnail from a video."""

    asset_id: str = Field(..., description="ID of the video asset")
    source_key: str = Field(..., description="Storage key of the source video")
    time_seconds: float = Field(
        default=1.0,
        ge=0,
        description="Time position for thumbnail"
    )
    width: int = Field(default=320, ge=1, le=1920)
    height: int = Field(default=180, ge=1, le=1080)
    format: ImageFormat = Field(default=ImageFormat.JPEG)


class BatchProcessingRequest(BaseModel):
    """Request to process multiple assets in batch."""

    asset_ids: List[str] = Field(..., min_length=1, max_length=100)
    processing_type: MediaType
    # Common options applied to all assets
    video_resolution: Optional[VideoResolution] = VideoResolution.RES_720P
    video_format: Optional[VideoFormat] = VideoFormat.MP4
    video_quality: Optional[VideoQuality] = VideoQuality.MEDIUM
    image_max_width: Optional[int] = 1920
    image_max_height: Optional[int] = 1080
    image_quality: Optional[int] = 85
    image_format: Optional[ImageFormat] = ImageFormat.WEBP
    priority: int = Field(default=3, ge=1, le=10)


# ============================================================
# Response Schemas
# ============================================================

class ProcessingJobResponse(BaseModel):
    """Response after queuing a processing job."""

    job_id: str = Field(..., description="Unique job identifier")
    asset_id: str = Field(..., description="Asset being processed")
    status: ProcessingStatus = Field(
        default=ProcessingStatus.PENDING,
        description="Current job status"
    )
    queue_position: Optional[int] = Field(
        default=None,
        description="Position in processing queue"
    )
    estimated_completion_seconds: Optional[int] = Field(
        default=None,
        description="Estimated seconds until completion"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Job creation timestamp"
    )


class ProcessingJobStatusResponse(BaseModel):
    """Detailed status of a processing job."""

    job_id: str
    asset_id: str
    status: ProcessingStatus
    progress: float = Field(
        default=0.0,
        ge=0,
        le=100,
        description="Processing progress percentage"
    )
    stage: Optional[str] = Field(
        default=None,
        description="Current processing stage"
    )
    queue_position: Optional[int] = None
    output_key: Optional[str] = Field(
        default=None,
        description="Storage key of processed output"
    )
    output_url: Optional[str] = Field(
        default=None,
        description="URL to access processed output"
    )
    thumbnail_key: Optional[str] = None
    thumbnail_url: Optional[str] = None
    variants: Optional[List[dict]] = Field(
        default=None,
        description="Generated variants with keys and URLs"
    )
    error_message: Optional[str] = None
    processing_time_seconds: Optional[float] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class BatchProcessingResponse(BaseModel):
    """Response for batch processing request."""

    batch_id: str = Field(..., description="Unique batch identifier")
    jobs: List[ProcessingJobResponse] = Field(
        default_factory=list,
        description="Individual job details"
    )
    total_jobs: int
    queued_jobs: int
    failed_to_queue: int = 0
    errors: List[str] = Field(default_factory=list)


# ============================================================
# Webhook Schemas
# ============================================================

class ProcessingWebhookPayload(BaseModel):
    """Payload sent to callback URL on job completion."""

    job_id: str
    asset_id: str
    status: ProcessingStatus
    output_key: Optional[str] = None
    output_url: Optional[str] = None
    thumbnail_key: Optional[str] = None
    thumbnail_url: Optional[str] = None
    variants: Optional[List[dict]] = None
    error_message: Optional[str] = None
    processing_time_seconds: Optional[float] = None
    completed_at: datetime

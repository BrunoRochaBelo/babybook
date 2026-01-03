from __future__ import annotations

import asyncio
import logging
import os
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from importlib import import_module
from typing import Any, Protocol

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from babybook_api.db.models import WorkerJob

logger = logging.getLogger(__name__)


@dataclass
class QueueMessage:
    id: str
    kind: str
    payload: dict[str, Any]
    metadata: dict[str, Any] = field(default_factory=dict)
    receipt: str | None = None


class JobHandler(Protocol):
    async def __call__(self, payload: dict[str, Any], metadata: dict[str, Any]) -> None: ...


class QueueBackend(Protocol):
    async def fetch(self, batch_size: int) -> list[QueueMessage]: ...

    async def ack(self, message: QueueMessage, *, success: bool, error: str | None = None) -> None: ...

    async def close(self) -> None: ...


def _lazy_handler(path: str) -> JobHandler:
    module_name, attr = path.split(":", 1)

    async def _runner(payload: dict[str, Any], metadata: dict[str, Any]) -> None:
        module = import_module(module_name)
        handler = getattr(module, attr)
        return await handler(payload, metadata)

    return _runner


JOB_MAP: dict[str, JobHandler] = {
    "video.transcode": _lazy_handler("app.ffmpeg:transcode_video"),
    "image.thumbnail": _lazy_handler("app.images:create_thumbnail"),
    "export.zip": _lazy_handler("app.exports:build_export_zip"),
    # Fallback media processing jobs (from client-side failure)
    "media.transcode": _lazy_handler("app.media_processing:process_transcode_job"),
    "media.optimize_image": _lazy_handler("app.media_processing:process_image_optimize_job"),
    "media.thumbnail": _lazy_handler("app.media_processing:process_thumbnail_job"),
    # Notifications
    "notification": _lazy_handler("app.notifications:process_notification_job"),
}


def _trace_prefix(metadata: dict[str, Any]) -> str:
    trace_id = metadata.get("trace_id")
    return f"[{trace_id}] " if trace_id else ""


class InMemoryQueueBackend:
    def __init__(self) -> None:
        self._queue: asyncio.Queue[QueueMessage] = asyncio.Queue()
        self._prefill_demo_job()

    def _prefill_demo_job(self) -> None:
        self._queue.put_nowait(
            QueueMessage(
                id=str(uuid.uuid4()),
                kind="video.transcode",
                payload={"path": "/tmp/video.mp4"},
            )
        )

    async def fetch(self, batch_size: int) -> list[QueueMessage]:
        try:
            first = await asyncio.wait_for(self._queue.get(), timeout=1)
        except asyncio.TimeoutError:
            return []
        items = [first]
        for _ in range(batch_size - 1):
            try:
                items.append(self._queue.get_nowait())
            except asyncio.QueueEmpty:
                break
        return items

    async def ack(self, message: QueueMessage, *, success: bool, error: str | None = None) -> None:
        if not success:
            logger.warning("Mem-queue job %s failed: %s", message.id, error)

    async def close(self) -> None:  # pragma: no cover - noop
        return None


class DatabaseQueueBackend:
    def __init__(self, database_url: str, visibility_timeout: int, max_attempts: int) -> None:
        self._engine = create_async_engine(database_url, future=True)
        self._sessionmaker: async_sessionmaker[AsyncSession] = async_sessionmaker(
            self._engine,
            expire_on_commit=False,
        )
        self._visibility_timeout = timedelta(seconds=visibility_timeout)
        self._max_attempts = max_attempts

    async def fetch(self, batch_size: int) -> list[QueueMessage]:
        async with self._sessionmaker() as session:
            stmt = (
                select(WorkerJob)
                .where(WorkerJob.status == "pending", WorkerJob.available_at <= func.now())
                .order_by(WorkerJob.created_at)
                .limit(batch_size)
                .with_for_update(skip_locked=True)
            )
            result = await session.execute(stmt)
            jobs = result.scalars().all()
            if not jobs:
                return []

            messages: list[QueueMessage] = []
            for job in jobs:
                job.status = "running"
                job.attempts += 1
                job.available_at = datetime.utcnow() + self._visibility_timeout
                messages.append(
                    QueueMessage(
                        id=str(job.id),
                        kind=job.kind,
                        payload=job.payload or {},
                        metadata=job.job_metadata or {},
                    )
                )
            await session.commit()
            return messages

    async def ack(self, message: QueueMessage, *, success: bool, error: str | None = None) -> None:
        async with self._sessionmaker() as session:
            job = await session.get(WorkerJob, uuid.UUID(message.id))
            if job is None:
                return
            if success:
                await session.delete(job)
            else:
                job.last_error = error
                if job.attempts >= self._max_attempts:
                    job.status = "failed"
                else:
                    job.status = "pending"
                    job.available_at = datetime.utcnow() + self._visibility_timeout
            await session.commit()

    async def close(self) -> None:
        await self._engine.dispose()


class CloudflareQueueBackend:
    def __init__(self, *, account_id: str, queue_name: str, token: str, base_url: str, visibility_timeout: int) -> None:
        self._account_id = account_id
        self._queue_name = queue_name
        self._base_url = base_url.rstrip("/")
        self._token = token
        self._visibility_timeout = visibility_timeout
        self._client = httpx.AsyncClient(timeout=10.0)

    def _endpoint(self, suffix: str) -> str:
        return (
            f"{self._base_url}/accounts/{self._account_id}/queues/"
            f"{self._queue_name}/{suffix.lstrip('/')}"
        )

    async def fetch(self, batch_size: int) -> list[QueueMessage]:
        payload = {
            "batch_size": batch_size,
            "visibility_timeout": self._visibility_timeout,
        }
        resp = await self._client.post(self._endpoint("messages/consume"), json=payload, headers=self._headers)
        resp.raise_for_status()
        data = resp.json()
        messages: list[QueueMessage] = []
        for item in data.get("result", {}).get("messages", []):
            body = item.get("body") or {}
            messages.append(
                QueueMessage(
                    id=item.get("id") or item.get("ack_id") or str(uuid.uuid4()),
                    kind=body.get("kind", ""),
                    payload=body.get("payload") or {},
                    metadata=item.get("metadata") or {},
                    receipt=item.get("ack_id") or item.get("receipt_handle"),
                )
            )
        return messages

    async def ack(self, message: QueueMessage, *, success: bool, error: str | None = None) -> None:
        if not message.receipt:
            return
        endpoint = "messages/ack" if success else "messages/nack"
        payload = {"ack_ids": [message.receipt]}
        resp = await self._client.post(self._endpoint(endpoint), json=payload, headers=self._headers)
        resp.raise_for_status()

    @property
    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._token}", "Content-Type": "application/json"}

    async def close(self) -> None:
        await self._client.aclose()


class QueueConsumer:
    def __init__(self, concurrency: int = 2, *, exit_on_idle: bool = False) -> None:
        self.concurrency = concurrency
        self.poll_interval = float(os.getenv("QUEUE_POLL_INTERVAL", "2"))
        self.exit_on_idle = exit_on_idle
        self.backend = self._build_backend()

    def _build_backend(self) -> QueueBackend:
        provider = os.getenv("QUEUE_PROVIDER", "database").lower()
        visibility = int(os.getenv("QUEUE_VISIBILITY_TIMEOUT", "60"))
        if provider == "cloudflare":
            account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
            queue_name = os.getenv("CLOUDFLARE_QUEUE_NAME")
            token = os.getenv("CLOUDFLARE_API_TOKEN")
            base_url = os.getenv("CLOUDFLARE_API_BASE_URL", "https://api.cloudflare.com/client/v4")
            if not all([account_id, queue_name, token]):
                raise RuntimeError("Configura��o da Cloudflare Queue incompleta")
            return CloudflareQueueBackend(
                account_id=account_id,
                queue_name=queue_name,
                token=token,
                base_url=base_url,
                visibility_timeout=visibility,
            )

        if provider == "memory":
            return InMemoryQueueBackend()

        database_url = (
            os.getenv("WORKER_DATABASE_URL")
            or os.getenv("DATABASE_URL")
            or "postgresql+asyncpg://babybook:babybook@localhost:5432/babybook_dev"
        )
        max_attempts = int(os.getenv("QUEUE_MAX_ATTEMPTS", "5"))
        return DatabaseQueueBackend(database_url, visibility_timeout=visibility, max_attempts=max_attempts)

    async def run(self) -> None:
        logger.info("Worker iniciado com provider %s", self.backend.__class__.__name__)
        try:
            while True:
                try:
                    messages = await self.backend.fetch(self.concurrency)
                except Exception as e:  # pragma: no cover - logging runtime falhas externas
                    error_msg = str(e)
                    is_conn_error = (
                        "ConnectionRefusedError" in error_msg
                        or "CannotConnectNowError" in error_msg
                        or "connection" in error_msg.lower()
                    )
                    if is_conn_error:
                        logger.warning(
                            "Falha de conexão com o banco/fila (%s). Tentando novamente em %s segundos...",
                            type(e).__name__,
                            self.poll_interval,
                        )
                    else:
                        logger.exception("Falha ao buscar jobs na fila")
                    await asyncio.sleep(self.poll_interval)
                    continue
                if not messages:
                    if self.exit_on_idle:
                        logger.info("Fila vazia, encerrando processamento (exit_on_idle)")
                        break
                    await asyncio.sleep(self.poll_interval)
                    continue
                await asyncio.gather(*(self._handle_message(msg) for msg in messages))
        finally:
            await self.backend.close()

    async def _handle_message(self, message: QueueMessage) -> None:
        handler = JOB_MAP.get(message.kind)
        prefix = _trace_prefix(message.metadata)
        if handler is None:
            logger.warning("%sJob desconhecido: %s", prefix, message.kind)
            await self.backend.ack(message, success=True)
            return
        try:
            await handler(message.payload, message.metadata)
        except Exception as exc:  # pragma: no cover - processamento real
            logger.exception("%sFalha ao processar job %s", prefix, message.id)
            await self.backend.ack(message, success=False, error=str(exc))
            return
        try:
            await self.backend.ack(message, success=True)
        except Exception:  # pragma: no cover - logging runtime falhas externas
            logger.exception("%sFalha ao confirmar job %s", prefix, message.id)

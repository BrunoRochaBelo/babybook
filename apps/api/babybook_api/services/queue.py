from __future__ import annotations

import logging
from typing import Any, Protocol
import uuid

import httpx
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.db.models import WorkerJob
from babybook_api.deps import get_db_session
from babybook_api.settings import settings

logger = logging.getLogger(__name__)


class QueuePublisher(Protocol):
    async def publish(
        self,
        *,
        kind: str,
        payload: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> None:
        ...


class DatabaseQueuePublisher:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def publish(
        self,
        *,
        kind: str,
        payload: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> None:
        job = WorkerJob(
            kind=kind,
            payload=payload,
            job_metadata=metadata or {},
            status="pending",
        )
        account_id = payload.get("account_id")
        if account_id is not None:
            try:
                job.account_id = uuid.UUID(str(account_id))
            except ValueError:
                logger.warning("account_id inv�lido no payload da fila: %s", account_id)
        self._session.add(job)


class CloudflareQueuePublisher:
    def __init__(self) -> None:
        if not settings.cloudflare_account_id or not settings.cloudflare_queue_name:
            raise RuntimeError("Cloudflare Queue configuration ausente.")
        if not settings.cloudflare_api_token:
            raise RuntimeError("Token da Cloudflare Queue n�o configurado.")

        self._base_url = settings.cloudflare_api_base_url.rstrip("/")
        self._account_id = settings.cloudflare_account_id
        self._queue_name = settings.cloudflare_queue_name
        self._headers = {
            "Authorization": f"Bearer {settings.cloudflare_api_token}",
            "Content-Type": "application/json",
        }

    def _endpoint(self, suffix: str) -> str:
        return (
            f"{self._base_url}/accounts/{self._account_id}/queues/"
            f"{self._queue_name}/{suffix.lstrip('/')}"
        )

    async def publish(
        self,
        *,
        kind: str,
        payload: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> None:
        message = {
            "messages": [
                {
                    "body": {
                        "kind": kind,
                        "payload": payload,
                    },
                    "metadata": metadata or {},
                }
            ]
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                self._endpoint("messages"),
                json=message,
                headers=self._headers,
            )
            try:
                response.raise_for_status()
            except httpx.HTTPError as exc:  # pragma: no cover - rely on runtime logging
                logger.exception("Falha ao publicar job na Cloudflare Queue")
                raise RuntimeError("Queue publish failed") from exc


async def get_queue_publisher(
    db: AsyncSession = Depends(get_db_session),
) -> QueuePublisher:
    if settings.queue_provider == "database":
        return DatabaseQueuePublisher(db)
    return CloudflareQueuePublisher()

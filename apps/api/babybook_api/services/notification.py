from __future__ import annotations

import uuid
from typing import Any

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from babybook_api.db.models import UserNotification
from babybook_api.deps import get_db_session
from babybook_api.services.queue import QueuePublisher, get_queue_publisher


class NotificationService:
    def __init__(self, queue: QueuePublisher, db: AsyncSession) -> None:
        self.queue = queue
        self.db = db

    async def enqueue_email(self, to: str, template: str, context: dict[str, Any]) -> None:
        """
        Publica na Cloudflare Queue para o Worker processar.
        Payload estruturado para bater com a lógica do worker:
        if payload['channel'] == 'email': ...
        """
        await self.queue.publish(
            kind="notification",
            payload={
                "channel": "email",
                "to": to,
                "template": template,
                "context": context,
            },
        )

    async def create_in_app(
        self,
        user_id: uuid.UUID,
        type: str,
        title: str,
        message: str | None = None,
        action_link: str | None = None,
    ) -> UserNotification:
        """Insere direto no Postgres para o 'sininho'"""
        notification = UserNotification(
            user_id=user_id,
            type=type,
            title=title,
            description=message,
            link=action_link,
            # read_at=None (default)
        )
        self.db.add(notification)
        return notification


def get_notification_service(
    queue: QueuePublisher = Depends(get_queue_publisher),
    db: AsyncSession = Depends(get_db_session),
) -> NotificationService:
    return NotificationService(queue, db)

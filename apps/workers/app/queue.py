from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Protocol

from .ffmpeg import transcode_video
from .images import create_thumbnail
from .exports import build_export_zip


@dataclass
class Job:
    kind: str
    payload: dict


class JobHandler(Protocol):
    async def __call__(self, payload: dict) -> None:
        ...


JOB_MAP: dict[str, JobHandler] = {
    "video.transcode": transcode_video,
    "image.thumbnail": create_thumbnail,
    "export.zip": build_export_zip,
}


class QueueConsumer:
    def __init__(self, concurrency: int = 2) -> None:
        self.concurrency = concurrency

    async def run(self) -> None:
        queue = asyncio.Queue[Job]()
        # Dev convenience – prefill with placeholder jobs
        await queue.put(Job(kind="video.transcode", payload={"path": "/tmp/video.mp4"}))

        workers = [
            asyncio.create_task(self._worker(f"worker-{i}", queue))
            for i in range(self.concurrency)
        ]
        await queue.join()
        for worker in workers:
            worker.cancel()

    async def _worker(self, name: str, queue: asyncio.Queue[Job]) -> None:
        while True:
            job = await queue.get()
            handler = JOB_MAP.get(job.kind)
            if handler:
                await handler(job.payload)
            queue.task_done()

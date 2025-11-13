import asyncio
import logging
import os

from .queue import QueueConsumer

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)


async def main() -> None:
    concurrency = int(os.getenv("WORKER_CONCURRENCY", "2"))
    consumer = QueueConsumer(concurrency=concurrency)
    await consumer.run()


if __name__ == "__main__":
    asyncio.run(main())

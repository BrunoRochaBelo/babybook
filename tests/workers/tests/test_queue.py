import pytest

from app.queue import QueueConsumer


@pytest.mark.asyncio
async def test_consumer_runs():
    consumer = QueueConsumer(concurrency=1)
    await consumer.run()

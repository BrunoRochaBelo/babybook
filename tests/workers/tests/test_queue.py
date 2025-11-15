import pytest

from app import queue


@pytest.mark.asyncio
async def test_consumer_runs(monkeypatch):
    monkeypatch.setenv("QUEUE_PROVIDER", "memory")
    called: list[dict] = []

    async def _fake_handler(payload: dict, metadata: dict) -> None:
        called.append({"payload": payload, "metadata": metadata})

    monkeypatch.setitem(queue.JOB_MAP, "video.transcode", _fake_handler)
    consumer = queue.QueueConsumer(concurrency=1, exit_on_idle=True)
    await consumer.run()
    assert called, "handler deve ser chamado para job em memória"

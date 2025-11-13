import asyncio

from .queue import QueueConsumer


async def main():
    consumer = QueueConsumer(concurrency=2)
    await consumer.run()


if __name__ == "__main__":
    asyncio.run(main())

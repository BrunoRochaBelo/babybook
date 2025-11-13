import asyncio


async def create_thumbnail(payload: dict) -> None:
    source = payload.get("path")
    size = payload.get("size", 512)
    await asyncio.sleep(0.05)
    print(f"[workers] Generated thumbnail for {source} ({size}px)")

import asyncio


async def build_export_zip(payload: dict) -> None:
    reference = payload.get("export_id")
    await asyncio.sleep(0.05)
    print(f"[workers] Export bundle built for {reference}")

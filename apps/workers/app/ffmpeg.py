import asyncio


async def transcode_video(payload: dict) -> None:
    input_path = payload.get("path")
    if not input_path:
        return
    await asyncio.sleep(0.1)
    print(f"[workers] Transcoded video {input_path}")

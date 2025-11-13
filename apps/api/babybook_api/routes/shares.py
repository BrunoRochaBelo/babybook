from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/{token}")
async def get_share(token: str):
    if len(token) < 10:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "share.token.invalid", "message": "Token inválido"}}
        )

    return {
        "token": token,
        "title": "Momento compartilhado",
        "media": [],
    }

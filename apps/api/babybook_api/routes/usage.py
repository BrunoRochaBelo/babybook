from fastapi import APIRouter

from ..settings import settings

router = APIRouter()


@router.get(
    "/usage",
    summary="Usage quotas",
)
async def usage_summary() -> dict:
    return {
        "storage": {"used": 0, "limit": settings.quota_storage_bytes},
        "moments": {"used": 0, "limit": settings.quota_moments},
        "recurrent": {"used": 0, "limit": settings.quota_recurrent},
    }

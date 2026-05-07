from fastapi import APIRouter

from v2.app.cache import ping_redis
from v2.app.db import ping_database

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, object]:
    database_ok = ping_database()
    redis_ok = ping_redis()
    return {
        "ok": database_ok and redis_ok,
        "status": "healthy" if database_ok and redis_ok else "degraded",
        "service": "findthebox-v2",
        "checks": {
            "database": database_ok,
            "redis": redis_ok,
        },
    }

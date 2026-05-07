from fastapi import APIRouter

router = APIRouter()


@router.get("/stats")
async def stats() -> dict[str, object]:
    return {
        "ok": True,
        "message": "V2 admin stats endpoint scaffold is ready.",
    }

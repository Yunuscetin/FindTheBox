from fastapi import APIRouter

router = APIRouter()


@router.get("/rooms/_v2-ready")
async def rooms_ready() -> dict[str, object]:
    return {
        "ok": True,
        "message": "V2 room service scaffold is ready.",
    }

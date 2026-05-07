import json
import time
from typing import Any

from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from v2.app.cache import redis_client
from v2.app.config import settings
from v2.app.db import SessionLocal
from v2.app.models import RoomEvent

router = APIRouter()


def _assert_admin_token(token: str | None) -> str | None:
    if not settings.admin_token:
        return "Admin access has not been configured yet."
    if (token or "").strip() != settings.admin_token:
        return "You are not allowed to access these stats."
    return None


def _load_live_room_stats() -> dict[str, Any]:
    room_codes = list(redis_client.smembers("rooms:active"))
    total_rooms = 0
    total_players = 0
    waiting_rooms = 0
    playing_rooms = 0
    celebrating_rooms = 0
    finished_rooms = 0
    capacity_total = 0
    freshest_update = 0

    for room_code in room_codes:
        raw = redis_client.get(f"room:{room_code}")
        if not raw:
            redis_client.srem("rooms:active", room_code)
            continue

        room = json.loads(raw)
        players = room.get("players", [])
        if not players:
            continue

        total_rooms += 1
        total_players += len(players)
        capacity_total += room.get("max_players", 0)
        freshest_update = max(freshest_update, room.get("updated_at", 0))

        phase = room.get("phase")
        if phase == "waiting":
            waiting_rooms += 1
        elif phase == "playing":
            playing_rooms += 1
        elif phase == "celebrating":
            celebrating_rooms += 1
        elif phase == "finished":
            finished_rooms += 1

    return {
        "rooms": {
            "total": total_rooms,
            "waiting": waiting_rooms,
            "playing": playing_rooms,
            "celebrating": celebrating_rooms,
            "finished": finished_rooms,
        },
        "players": {
            "online": total_players,
            "capacity": capacity_total,
        },
        "updatedAt": freshest_update,
    }


def _load_historical_stats(db: Session, days: int = 10) -> dict[str, Any]:
    current = int(time.time())
    start_of_today = current - (current % 86400)
    start_at = start_of_today - ((days - 1) * 86400)

    room_stmt = (
        select(func.date(RoomEvent.created_at), func.count())
        .where(RoomEvent.event_type == "room_created", RoomEvent.created_at >= func.to_timestamp(start_at))
        .group_by(func.date(RoomEvent.created_at))
    )
    join_stmt = (
        select(func.date(RoomEvent.created_at), func.count())
        .where(RoomEvent.event_type == "join_requested", RoomEvent.created_at >= func.to_timestamp(start_at))
        .group_by(func.date(RoomEvent.created_at))
    )
    players_stmt = (
        select(func.date(RoomEvent.created_at), func.count(func.distinct(RoomEvent.player_id)))
        .where(RoomEvent.player_id != "", RoomEvent.created_at >= func.to_timestamp(start_at))
        .group_by(func.date(RoomEvent.created_at))
    )

    room_rows = {str(day): count for day, count in db.execute(room_stmt).all()}
    join_rows = {str(day): count for day, count in db.execute(join_stmt).all()}
    player_rows = {str(day): count for day, count in db.execute(players_stmt).all()}

    timeline = []
    total_rooms_created = 0
    total_players_seen = 0
    for day_offset in range(days):
        day_ts = start_at + (day_offset * 86400)
        day_key = time.strftime("%Y-%m-%d", time.localtime(day_ts))
        rooms_created = int(room_rows.get(day_key, 0))
        join_requests = int(join_rows.get(day_key, 0))
        players_seen = int(player_rows.get(day_key, 0))
        total_rooms_created += rooms_created
        total_players_seen += players_seen
        timeline.append(
            {
                "date": day_key,
                "roomsCreated": rooms_created,
                "joinRequests": join_requests,
                "playersSeen": players_seen,
            }
        )

    return {
        "days": timeline,
        "summary": {
            "roomsCreated": total_rooms_created,
            "playersSeen": total_players_seen,
        },
    }


@router.get("/stats")
async def stats(x_admin_token: str | None = Header(default=None)) -> Any:
    error = _assert_admin_token(x_admin_token)
    if error:
        return JSONResponse(status_code=403, content={"ok": False, "error": error})

    with SessionLocal() as db:
        live_stats = _load_live_room_stats()
        history_stats = _load_historical_stats(db, 10)

    return {"ok": True, "stats": {**live_stats, "history": history_stats}}

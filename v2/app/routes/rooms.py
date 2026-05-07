from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from v2.app.db import get_db
from v2.app.room_service import RoomServiceError, room_service
from v2.app.schemas import (
    CreateRoomRequest,
    JoinRoomRequest,
    RoomActionRequest,
    TargetedRoomActionRequest,
    TileClickRequest,
)
from v2.app.websocket_manager import room_connections

router = APIRouter()


def get_client_ip(request: Request) -> str:
    forwarded = (request.headers.get("cf-connecting-ip") or request.headers.get("x-forwarded-for") or "").strip()
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "app"


@router.get("/rooms/_v2-ready")
async def rooms_ready() -> dict[str, object]:
    return {
        "ok": True,
        "message": "V2 room service scaffold is ready.",
    }


@router.get("/rooms/{room_code}")
async def get_room(room_code: str, playerId: str = Query(default=""), db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        room = room_service.get_room(room_code.upper())
        if not room.get_player(playerId):
            raise RoomServiceError("Bu odada yer almiyorsun.")
        room.touch_player(playerId)
        room_service.update_room(db, room)
        return {"ok": True, "room": room.to_payload()}
    except RoomServiceError as error:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@router.post("/rooms")
async def create_room(payload: CreateRoomRequest, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        client_ip = get_client_ip(request)
        room = room_service.create_room(db, client_ip, payload.playerId.strip(), payload.playerName.strip(), payload.maxPlayers)
        await room_connections.broadcast_room(room.code, room.to_payload())
        return {"ok": True, "room": room.to_payload()}
    except RoomServiceError as error:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@router.post("/rooms/join")
async def join_room(payload: JoinRoomRequest, request: Request, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        client_ip = get_client_ip(request)
        room = room_service.join_room(
            db,
            client_ip,
            payload.roomCode.strip().upper(),
            payload.playerId.strip(),
            payload.playerName.strip(),
        )
        if room.get_player(payload.playerId.strip()):
            await room_connections.broadcast_room(room.code, room.to_payload())
            return {"ok": True, "room": room.to_payload()}
        return {
            "ok": True,
            "pendingApproval": True,
            "roomCode": payload.roomCode.strip().upper(),
            "message": "Katilim istegin oda sahibine iletildi.",
        }
    except RoomServiceError as error:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@router.get("/rooms/{room_code}/join-status")
async def join_status(room_code: str, playerId: str = Query(default="")) -> dict[str, object]:
    try:
        status, room = room_service.get_join_request_status(room_code.upper(), playerId.strip())
        payload: dict[str, object] = {"ok": True, "status": status}
        if status == "approved":
            payload["room"] = room.to_payload()
        return payload
    except RoomServiceError as error:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@router.post("/rooms/{room_code}/start")
async def start_room(room_code: str, payload: RoomActionRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        room = room_service.start_room(db, room_code.upper(), payload.playerId.strip())
        await room_connections.broadcast_room(room.code, room.to_payload())
        return {"ok": True, "room": room.to_payload()}
    except RoomServiceError as error:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@router.post("/rooms/{room_code}/restart")
async def restart_room(room_code: str, payload: RoomActionRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        room = room_service.restart_room(db, room_code.upper(), payload.playerId.strip())
        await room_connections.broadcast_room(room.code, room.to_payload())
        return {"ok": True, "room": room.to_payload()}
    except RoomServiceError as error:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@router.post("/rooms/{room_code}/click")
async def click_tile(room_code: str, payload: TileClickRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        room = room_service.click_tile(db, room_code.upper(), payload.playerId.strip(), payload.tileIndex)
        await room_connections.broadcast_room(room.code, room.to_payload())
        return {"ok": True, "room": room.to_payload()}
    except RoomServiceError as error:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@router.post("/rooms/{room_code}/leave")
async def leave_room(room_code: str, payload: RoomActionRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        room = room_service.leave_room(db, room_code.upper(), payload.playerId.strip())
        await room_connections.close_player(room_code.upper(), payload.playerId.strip(), code=4001)
        if room is None:
            await room_connections.close_room(room_code.upper(), code=4404)
        else:
            await room_connections.broadcast_room(room.code, room.to_payload())
        return {"ok": True}
    except RoomServiceError as error:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@router.post("/rooms/{room_code}/kick")
async def kick_player(room_code: str, payload: TargetedRoomActionRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        room = room_service.kick_player(db, room_code.upper(), payload.playerId.strip(), payload.targetPlayerId.strip())
        await room_connections.close_player(room.code, payload.targetPlayerId.strip(), code=4003)
        await room_connections.broadcast_room(room.code, room.to_payload())
        return {"ok": True, "room": room.to_payload()}
    except RoomServiceError as error:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@router.post("/rooms/{room_code}/requests/approve")
async def approve_request(room_code: str, payload: TargetedRoomActionRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        room = room_service.approve_join_request(db, room_code.upper(), payload.playerId.strip(), payload.targetPlayerId.strip())
        await room_connections.broadcast_room(room.code, room.to_payload())
        return {"ok": True, "room": room.to_payload()}
    except RoomServiceError as error:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})


@router.post("/rooms/{room_code}/requests/reject")
async def reject_request(room_code: str, payload: TargetedRoomActionRequest, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        room = room_service.reject_join_request(db, room_code.upper(), payload.playerId.strip(), payload.targetPlayerId.strip())
        await room_connections.broadcast_room(room.code, room.to_payload())
        return {"ok": True, "room": room.to_payload()}
    except RoomServiceError as error:
        return JSONResponse(status_code=400, content={"ok": False, "error": str(error)})

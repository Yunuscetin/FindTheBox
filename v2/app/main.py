import asyncio
import contextlib
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from v2.app.bootstrap import init_schema
from v2.app.db import SessionLocal
from v2.app.room_service import RoomServiceError, room_service
from v2.app.routes import admin, health, rooms
from v2.app.websocket_manager import room_connections

STATIC_DIR = Path(__file__).resolve().parents[2]
ADMIN_PAGE_PATH = "control-room-7f9k-admin.html"
ADMIN_SCRIPT_PATH = "control-room-7f9k-admin.js"
ROOT_STATIC_FILES = {
    "index.html",
    "script.js",
    "styles.css",
    "robots.txt",
    "sitemap.xml",
}

app = FastAPI(
    title="FindTheBox V2",
    version="0.1.0",
)


async def room_broadcast_loop() -> None:
    while True:
        await asyncio.sleep(1)
        room_codes = room_connections.active_room_codes()
        if not room_codes:
            continue

        with SessionLocal() as db:
            for room_code in room_codes:
                try:
                    room = room_service.get_room(room_code)
                    room_service.update_room(db, room)
                    await room_connections.broadcast_room(room.code, room.to_payload())
                except RoomServiceError:
                    await room_connections.close_room(room_code, code=4404)
                except Exception:
                    continue


async def cleanup_disconnected_player(room_code: str, player_id: str, delay_seconds: int = 8) -> None:
    await asyncio.sleep(delay_seconds)
    if room_connections.has_player_connection(room_code, player_id):
        return

    with SessionLocal() as db:
        try:
            room = room_service.leave_room(db, room_code, player_id)
            if room:
                await room_connections.broadcast_room(room.code, room.to_payload())
        except RoomServiceError:
            return


@app.on_event("startup")
def on_startup() -> None:
    init_schema()
    app.state.room_broadcast_task = asyncio.create_task(room_broadcast_loop())
    app.state.disconnect_cleanup_tasks = {}


@app.on_event("shutdown")
async def on_shutdown() -> None:
    task = getattr(app.state, "room_broadcast_task", None)
    if task:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task
    disconnect_tasks = getattr(app.state, "disconnect_cleanup_tasks", {})
    for disconnect_task in disconnect_tasks.values():
        disconnect_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await disconnect_task


@app.websocket("/ws/rooms/{room_code}")
async def room_socket(websocket: WebSocket, room_code: str, playerId: str = Query(default="")) -> None:
    cleanup_key = (room_code.upper(), playerId)
    try:
        room = room_service.get_room(room_code.upper())
        if not room.get_player(playerId):
            await websocket.close(code=4403)
            return

        cleanup_tasks = getattr(app.state, "disconnect_cleanup_tasks", {})
        existing_cleanup = cleanup_tasks.pop(cleanup_key, None)
        if existing_cleanup:
            existing_cleanup.cancel()

        await room_connections.connect(room_code.upper(), playerId, websocket)
        await websocket.send_json({"type": "room_update", "room": room.to_payload()})

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        room_connections.disconnect(room_code.upper(), playerId, websocket)
        cleanup_task = asyncio.create_task(cleanup_disconnected_player(room_code.upper(), playerId))
        app.state.disconnect_cleanup_tasks[cleanup_key] = cleanup_task
        cleanup_task.add_done_callback(lambda _task, key=cleanup_key: getattr(app.state, "disconnect_cleanup_tasks", {}).pop(key, None))
    except RoomServiceError:
        await websocket.close(code=4404)
    except Exception:
        room_connections.disconnect(room_code.upper(), playerId, websocket)
        cleanup_task = asyncio.create_task(cleanup_disconnected_player(room_code.upper(), playerId))
        app.state.disconnect_cleanup_tasks[cleanup_key] = cleanup_task
        cleanup_task.add_done_callback(lambda _task, key=cleanup_key: getattr(app.state, "disconnect_cleanup_tasks", {}).pop(key, None))

app.include_router(health.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(rooms.router, prefix="/api")
app.mount("/tr", StaticFiles(directory=str(STATIC_DIR / "tr"), html=True), name="tr-static")
app.mount("/en", StaticFiles(directory=str(STATIC_DIR / "en"), html=True), name="en-static")


@app.get("/")
async def root_index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get(f"/{ADMIN_PAGE_PATH}")
async def hidden_admin_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "admin.html")


@app.get(f"/{ADMIN_SCRIPT_PATH}")
async def hidden_admin_script() -> FileResponse:
    return FileResponse(STATIC_DIR / "admin.js")


@app.get("/{file_name}")
async def root_static(file_name: str) -> FileResponse:
    if file_name not in ROOT_STATIC_FILES:
        if "." in file_name:
            raise HTTPException(status_code=404, detail="Not Found")
        return FileResponse(STATIC_DIR / "index.html")
    return FileResponse(STATIC_DIR / file_name)

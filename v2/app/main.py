from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from v2.app.bootstrap import init_schema
from v2.app.room_service import RoomServiceError, room_service
from v2.app.routes import admin, health, rooms
from v2.app.websocket_manager import room_connections

STATIC_DIR = Path(__file__).resolve().parents[2]
ROOT_STATIC_FILES = {
    "index.html",
    "admin.html",
    "admin.js",
    "script.js",
    "styles.css",
    "robots.txt",
    "sitemap.xml",
}

app = FastAPI(
    title="FindTheBox V2",
    version="0.1.0",
)


@app.on_event("startup")
def on_startup() -> None:
    init_schema()


@app.websocket("/ws/rooms/{room_code}")
async def room_socket(websocket: WebSocket, room_code: str, playerId: str = Query(default="")) -> None:
    try:
        room = room_service.get_room(room_code.upper())
        if not room.get_player(playerId):
            await websocket.close(code=4403)
            return

        await room_connections.connect(room_code.upper(), playerId, websocket)
        await websocket.send_json({"type": "room_update", "room": room.to_payload()})

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        room_connections.disconnect(room_code.upper(), playerId, websocket)
    except RoomServiceError:
        await websocket.close(code=4404)
    except Exception:
        room_connections.disconnect(room_code.upper(), playerId, websocket)

app.include_router(health.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(rooms.router, prefix="/api")
app.mount("/tr", StaticFiles(directory=str(STATIC_DIR / "tr"), html=True), name="tr-static")
app.mount("/en", StaticFiles(directory=str(STATIC_DIR / "en"), html=True), name="en-static")


@app.get("/")
async def root_index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/{file_name}")
async def root_static(file_name: str) -> FileResponse:
    if file_name not in ROOT_STATIC_FILES:
        if "." in file_name:
            raise HTTPException(status_code=404, detail="Not Found")
        return FileResponse(STATIC_DIR / "index.html")
    return FileResponse(STATIC_DIR / file_name)

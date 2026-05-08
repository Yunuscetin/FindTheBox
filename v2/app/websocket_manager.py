from collections import defaultdict

from fastapi import WebSocket


class RoomConnectionManager:
    def __init__(self) -> None:
        self.connections: dict[str, dict[str, set[WebSocket]]] = defaultdict(lambda: defaultdict(set))

    async def connect(self, room_code: str, player_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections[room_code][player_id].add(websocket)

    def disconnect(self, room_code: str, player_id: str, websocket: WebSocket) -> None:
        room_connections = self.connections.get(room_code)
        if not room_connections or player_id not in room_connections:
            return
        room_connections[player_id].discard(websocket)
        if not room_connections[player_id]:
            room_connections.pop(player_id, None)
        if not room_connections:
            self.connections.pop(room_code, None)

    async def broadcast_room(self, room_code: str, payload: dict) -> None:
        room_connections = self.connections.get(room_code, {})
        for player_id, websockets in list(room_connections.items()):
            for websocket in list(websockets):
                try:
                    await websocket.send_json({"type": "room_update", "room": payload})
                except Exception:
                    self.disconnect(room_code, player_id, websocket)

    async def close_player(self, room_code: str, player_id: str, code: int = 4403) -> None:
        room_connections = self.connections.get(room_code, {})
        for websocket in list(room_connections.get(player_id, set())):
            try:
                await websocket.close(code=code)
            finally:
                self.disconnect(room_code, player_id, websocket)

    async def close_room(self, room_code: str, code: int = 4404) -> None:
        room_connections = self.connections.get(room_code, {})
        for player_id, websockets in list(room_connections.items()):
            for websocket in list(websockets):
                try:
                    await websocket.close(code=code)
                finally:
                    self.disconnect(room_code, player_id, websocket)

    def active_room_codes(self) -> list[str]:
        return [room_code for room_code, room_connections in self.connections.items() if room_connections]


room_connections = RoomConnectionManager()

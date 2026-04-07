from __future__ import annotations

import json
import os
import random
import sqlite3
import string
import threading
import time
from dataclasses import dataclass, field
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

MAX_PLAYERS = 8
MIN_PLAYERS = 2
STEP_CONFIG = [
    {"tiles": 100, "opening_streak": 0},
    {"tiles": 80, "opening_streak": 5},
    {"tiles": 60, "opening_streak": 5},
    {"tiles": 50, "opening_streak": 5},
    {"tiles": 40, "opening_streak": 3},
]
ROOM_TTL_SECONDS = 60 * 60 * 24
PLAYER_TTL_SECONDS = 60 * 20
STATIC_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("GAME_DB_PATH", str(STATIC_DIR / "game.db")))
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "").strip()


def now_ts() -> int:
    return int(time.time())


def make_initials(name: str) -> str:
    parts = [part for part in name.strip().split() if part]
    if not parts:
        return "?"
    return "".join(part[0].upper() for part in parts[:2])


def make_room_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(6))


@dataclass
class Player:
    player_id: str
    name: str
    joined_at: int
    last_seen_at: int
    step_wins: int = 0

    @property
    def initials(self) -> str:
        return make_initials(self.name)


@dataclass
class Room:
    code: str
    host_id: str
    max_players: int = 8
    players: list[Player] = field(default_factory=list)
    phase: str = "waiting"
    board: list[dict[str, Any]] = field(default_factory=list)
    winning_index: int = 0
    current_turn_index: int = 0
    winner_id: str | None = None
    created_at: int = field(default_factory=now_ts)
    updated_at: int = field(default_factory=now_ts)
    step_index: int = 0
    step_winners: list[str] = field(default_factory=list)
    opening_player_id: str | None = None
    opening_streak_remaining: int = 0
    pending_next_step_at: int | None = None
    pending_next_step_starter_id: str | None = None

    def get_player(self, player_id: str) -> Player | None:
        return next((player for player in self.players if player.player_id == player_id), None)

    def get_player_index(self, player_id: str) -> int | None:
        for index, player in enumerate(self.players):
            if player.player_id == player_id:
                return index
        return None

    @property
    def current_step(self) -> dict[str, int]:
        return STEP_CONFIG[self.step_index]

    @property
    def current_turn_player_id(self) -> str | None:
        if not self.players:
            return None
        return self.players[self.current_turn_index % len(self.players)].player_id

    def ensure_valid_turn(self) -> None:
        if not self.players:
            self.current_turn_index = 0
            self.opening_player_id = None
            self.opening_streak_remaining = 0
            self.pending_next_step_at = None
            self.pending_next_step_starter_id = None
            return
        self.current_turn_index %= len(self.players)
        if self.opening_player_id and not self.get_player(self.opening_player_id):
            self.opening_player_id = None
            self.opening_streak_remaining = 0
        if self.pending_next_step_starter_id and not self.get_player(self.pending_next_step_starter_id):
            self.pending_next_step_starter_id = self.players[0].player_id

    def touch_player(self, player_id: str) -> None:
        player = self.get_player(player_id)
        if player:
            player.last_seen_at = now_ts()
            self.updated_at = now_ts()

    def setup_step(self, starter_id: str | None = None) -> None:
        tile_count = self.current_step["tiles"]
        self.board = [{"state": "hidden", "color": None, "playerId": None, "initials": ""} for _ in range(tile_count)]
        self.winning_index = random.randrange(tile_count)
        self.winner_id = None

        if not self.players:
            self.current_turn_index = 0
            self.opening_player_id = None
            self.opening_streak_remaining = 0
            self.updated_at = now_ts()
            return

        starter_id = starter_id if starter_id and self.get_player(starter_id) else self.players[0].player_id
        self.current_turn_index = self.get_player_index(starter_id) or 0
        self.opening_player_id = starter_id if self.current_step["opening_streak"] > 0 else None
        self.opening_streak_remaining = self.current_step["opening_streak"]
        self.pending_next_step_at = None
        self.pending_next_step_starter_id = None
        self.updated_at = now_ts()

    def start_celebration(self, winner_id: str) -> None:
        self.phase = "celebrating"
        self.winner_id = winner_id
        self.pending_next_step_at = now_ts() + 5
        self.pending_next_step_starter_id = winner_id
        self.opening_player_id = None
        self.opening_streak_remaining = 0
        self.updated_at = now_ts()

    def advance_if_due(self) -> None:
        if self.phase != "celebrating" or not self.pending_next_step_at:
            return
        if now_ts() < self.pending_next_step_at:
            return

        if self.step_index >= len(STEP_CONFIG) - 1:
            self.phase = "finished"
            self.pending_next_step_at = None
            self.pending_next_step_starter_id = None
            self.updated_at = now_ts()
            return

        self.step_index += 1
        self.phase = "playing"
        self.setup_step(self.pending_next_step_starter_id)

    def get_step_results(self) -> list[dict[str, Any]]:
        results = []
        for index, winner_id in enumerate(self.step_winners):
            winner = self.get_player(winner_id)
            results.append(
                {
                    "step": index + 1,
                    "winnerId": winner_id,
                    "winnerName": winner.name if winner else "Ayrilan oyuncu",
                }
            )
        return results

    def get_leaderboard(self) -> list[dict[str, Any]]:
        sorted_players = sorted(self.players, key=lambda player: (-player.step_wins, player.joined_at))
        top_wins = sorted_players[0].step_wins if sorted_players else 0
        return [
            {
                "id": player.player_id,
                "name": player.name,
                "initials": player.initials,
                "stepWins": player.step_wins,
                "isLeader": top_wins > 0 and player.step_wins == top_wins,
            }
            for player in sorted_players
        ]

    def remove_player(self, player_id: str) -> None:
        player_index = self.get_player_index(player_id)
        if player_index is None:
            return

        self.players.pop(player_index)
        if not self.players:
            return

        if self.host_id == player_id:
            self.host_id = self.players[0].player_id

        if player_index < self.current_turn_index:
            self.current_turn_index -= 1

        if self.current_turn_player_id == player_id:
            self.ensure_valid_turn()

        if self.phase == "playing" and len(self.players) < 2:
            self.phase = "waiting"
            self.step_index = 0
            self.step_winners = []
            for player in self.players:
                player.step_wins = 0
            self.setup_step()
        elif self.phase == "celebrating" and len(self.players) < 2:
            self.phase = "waiting"
            self.step_index = 0
            self.step_winners = []
            for player in self.players:
                player.step_wins = 0
            self.setup_step()

        self.ensure_valid_turn()
        self.updated_at = now_ts()

    def prune_inactive_players(self) -> None:
        cutoff = now_ts() - PLAYER_TTL_SECONDS
        inactive_ids = [player.player_id for player in self.players if player.last_seen_at < cutoff]
        for player_id in inactive_ids:
            self.remove_player(player_id)

    def to_payload(self) -> dict[str, Any]:
        self.advance_if_due()
        step_number = self.step_index + 1
        return {
            "code": self.code,
            "hostId": self.host_id,
            "maxPlayers": self.max_players,
            "phase": self.phase,
            "players": [
                {
                    "id": player.player_id,
                    "name": player.name,
                    "initials": player.initials,
                    "stepWins": player.step_wins,
                }
                for player in self.players
            ],
            "board": self.board,
            "currentTurnPlayerId": self.current_turn_player_id,
            "winnerId": self.winner_id,
            "currentStep": step_number,
            "totalSteps": len(STEP_CONFIG),
            "tileCount": len(self.board),
            "openingPlayerId": self.opening_player_id,
            "openingStreakRemaining": self.opening_streak_remaining,
            "stepResults": self.get_step_results(),
            "leaderboard": self.get_leaderboard(),
            "secondsUntilNextStep": max(0, (self.pending_next_step_at or 0) - now_ts()),
        }


class GameStore:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.lock = threading.Lock()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _init_db(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS rooms (
                    code TEXT PRIMARY KEY,
                    payload TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                )
                """
            )
            connection.commit()

    def _serialize_room(self, room: Room) -> str:
        return json.dumps(
            {
                "code": room.code,
                "host_id": room.host_id,
                "max_players": room.max_players,
                "players": [
                    {
                        "player_id": player.player_id,
                        "name": player.name,
                        "joined_at": player.joined_at,
                        "last_seen_at": player.last_seen_at,
                        "step_wins": player.step_wins,
                    }
                    for player in room.players
                ],
                "phase": room.phase,
                "board": room.board,
                "winning_index": room.winning_index,
                "current_turn_index": room.current_turn_index,
                "winner_id": room.winner_id,
                "created_at": room.created_at,
                "updated_at": room.updated_at,
                "step_index": room.step_index,
                "step_winners": room.step_winners,
                "opening_player_id": room.opening_player_id,
                "opening_streak_remaining": room.opening_streak_remaining,
                "pending_next_step_at": room.pending_next_step_at,
                "pending_next_step_starter_id": room.pending_next_step_starter_id,
            }
        )

    def _deserialize_room(self, payload: str) -> Room:
        raw = json.loads(payload)
        room = Room(
            code=raw["code"],
            host_id=raw["host_id"],
            max_players=raw.get("max_players", 8),
            players=[
                Player(
                    player_id=player["player_id"],
                    name=player["name"],
                    joined_at=player["joined_at"],
                    last_seen_at=player.get("last_seen_at", player["joined_at"]),
                    step_wins=player.get("step_wins", 0),
                )
                for player in raw["players"]
            ],
            phase=raw.get("phase", "waiting"),
            board=raw.get("board", []),
            winning_index=raw.get("winning_index", 0),
            current_turn_index=raw.get("current_turn_index", 0),
            winner_id=raw.get("winner_id"),
            created_at=raw.get("created_at", now_ts()),
            updated_at=raw.get("updated_at", now_ts()),
            step_index=raw.get("step_index", 0),
            step_winners=raw.get("step_winners", []),
            opening_player_id=raw.get("opening_player_id"),
            opening_streak_remaining=raw.get("opening_streak_remaining", 0),
            pending_next_step_at=raw.get("pending_next_step_at"),
            pending_next_step_starter_id=raw.get("pending_next_step_starter_id"),
        )

        if not room.board:
            room.setup_step()
        room.ensure_valid_turn()
        return room

    def _save_room(self, connection: sqlite3.Connection, room: Room) -> None:
        connection.execute(
            """
            INSERT INTO rooms(code, payload, created_at, updated_at)
            VALUES(?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
                payload = excluded.payload,
                updated_at = excluded.updated_at
            """,
            (room.code, self._serialize_room(room), room.created_at, room.updated_at),
        )

    def prune(self) -> None:
        with self.lock, self._connect() as connection:
            rows = connection.execute("SELECT code, payload FROM rooms").fetchall()
            cutoff = now_ts() - ROOM_TTL_SECONDS

            for row in rows:
                room = self._deserialize_room(row["payload"])
                room.prune_inactive_players()
                if room.updated_at < cutoff or not room.players:
                    connection.execute("DELETE FROM rooms WHERE code = ?", (room.code,))
                else:
                    self._save_room(connection, room)
            connection.commit()

    def get_live_stats(self) -> dict[str, Any]:
        with self.lock, self._connect() as connection:
            rows = connection.execute("SELECT payload FROM rooms").fetchall()

        total_rooms = 0
        total_players = 0
        waiting_rooms = 0
        playing_rooms = 0
        celebrating_rooms = 0
        finished_rooms = 0
        capacity_total = 0
        freshest_update = 0

        for row in rows:
            room = self._deserialize_room(row["payload"])
            room.prune_inactive_players()
            if not room.players:
                continue

            room.advance_if_due()
            total_rooms += 1
            total_players += len(room.players)
            capacity_total += room.max_players
            freshest_update = max(freshest_update, room.updated_at)

            if room.phase == "waiting":
                waiting_rooms += 1
            elif room.phase == "playing":
                playing_rooms += 1
            elif room.phase == "celebrating":
                celebrating_rooms += 1
            elif room.phase == "finished":
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

    def create_room(self, player_id: str, player_name: str, max_players: int) -> Room:
        with self.lock, self._connect() as connection:
            room_code = make_room_code()
            while connection.execute("SELECT 1 FROM rooms WHERE code = ?", (room_code,)).fetchone():
                room_code = make_room_code()

            timestamp = now_ts()
            room = Room(code=room_code, host_id=player_id, max_players=max_players)
            room.players.append(Player(player_id=player_id, name=player_name, joined_at=timestamp, last_seen_at=timestamp))
            room.setup_step()
            self._save_room(connection, room)
            connection.commit()
            return room

    def get_room(self, room_code: str) -> Room:
        with self.lock, self._connect() as connection:
            row = connection.execute("SELECT payload FROM rooms WHERE code = ?", (room_code,)).fetchone()
            if not row:
                raise ValueError("Oda bulunamadi.")
            room = self._deserialize_room(row["payload"])
            room.prune_inactive_players()
            if not room.players:
                connection.execute("DELETE FROM rooms WHERE code = ?", (room.code,))
                connection.commit()
                raise ValueError("Oda bulunamadi.")
            self._save_room(connection, room)
            connection.commit()
            return room

    def update_room(self, room: Room) -> None:
        room.updated_at = now_ts()
        room.ensure_valid_turn()
        with self.lock, self._connect() as connection:
            self._save_room(connection, room)
            connection.commit()

    def join_room(self, room_code: str, player_id: str, player_name: str) -> Room:
        room = self.get_room(room_code)
        existing_player = room.get_player(player_id)
        timestamp = now_ts()

        if existing_player:
            existing_player.name = player_name
            existing_player.last_seen_at = timestamp
        else:
            if len(room.players) >= room.max_players:
                raise ValueError(f"Lobi dolu. Maksimum {room.max_players} oyuncu katılabilir.")
            if room.phase == "playing":
                raise ValueError("Oyun basladigi icin bu tura yeni oyuncu katilamaz.")
            room.players.append(Player(player_id=player_id, name=player_name, joined_at=timestamp, last_seen_at=timestamp))

        self.update_room(room)
        return room

    def leave_room(self, room_code: str, player_id: str) -> None:
        room = self.get_room(room_code)
        room.remove_player(player_id)
        with self.lock, self._connect() as connection:
            if not room.players:
                connection.execute("DELETE FROM rooms WHERE code = ?", (room.code,))
            else:
                self._save_room(connection, room)
            connection.commit()


store = GameStore(DB_PATH)


def json_response(handler: SimpleHTTPRequestHandler, status: HTTPStatus, payload: dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def html_response(handler: SimpleHTTPRequestHandler, status: HTTPStatus, body: str) -> None:
    encoded = body.encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "text/html; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(encoded)))
    handler.end_headers()
    handler.wfile.write(encoded)


def read_json(handler: SimpleHTTPRequestHandler) -> dict[str, Any]:
    content_length = int(handler.headers.get("Content-Length", "0"))
    if content_length <= 0:
        return {}
    body = handler.rfile.read(content_length)
    return json.loads(body.decode("utf-8"))


class GameRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        store.prune()

        if parsed.path == "/api/health":
            return json_response(self, HTTPStatus.OK, {"ok": True, "status": "healthy"})

        if parsed.path == "/api/stats":
            try:
                self.assert_admin_access()
                return json_response(self, HTTPStatus.OK, {"ok": True, "stats": store.get_live_stats()})
            except ValueError as error:
                return json_response(self, HTTPStatus.FORBIDDEN, {"ok": False, "error": str(error)})

        if parsed.path == "/admin.html":
            if not ADMIN_TOKEN:
                return html_response(
                    self,
                    HTTPStatus.SERVICE_UNAVAILABLE,
                    "<!DOCTYPE html><html lang='tr'><meta charset='utf-8'><title>Admin Kapalı</title><body><p>ADMIN_TOKEN tanımlanmadığı için admin görünümü devre dışı.</p></body></html>",
                )

        if parsed.path.startswith("/api/rooms/"):
            try:
                return self.handle_get_room(parsed.path, parse_qs(parsed.query))
            except ValueError as error:
                return json_response(self, HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(error)})

        if parsed.path == "/":
            self.path = "/index.html"

        return super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        store.prune()

        try:
            if parsed.path == "/api/rooms":
                return self.handle_create_room()
            if parsed.path == "/api/rooms/join":
                return self.handle_join_room()
            if parsed.path.endswith("/start"):
                return self.handle_start_room(parsed.path)
            if parsed.path.endswith("/restart"):
                return self.handle_restart_room(parsed.path)
            if parsed.path.endswith("/click"):
                return self.handle_tile_click(parsed.path)
            if parsed.path.endswith("/leave"):
                return self.handle_leave_room(parsed.path)
            json_response(self, HTTPStatus.NOT_FOUND, {"ok": False, "error": "API bulunamadi."})
        except ValueError as error:
            json_response(self, HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(error)})
        except Exception:
            json_response(self, HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": "Sunucuda bir hata olustu."})

    def handle_get_room(self, path: str, query: dict[str, list[str]]) -> None:
        room_code = path.removeprefix("/api/rooms/").upper()
        player_id = (query.get("playerId") or [""])[0]
        room = store.get_room(room_code)
        room.advance_if_due()
        if not room.get_player(player_id):
            raise ValueError("Bu odada yer almiyorsun.")
        room.touch_player(player_id)
        store.update_room(room)
        json_response(self, HTTPStatus.OK, {"ok": True, "room": room.to_payload()})

    def handle_create_room(self) -> None:
        payload = read_json(self)
        player_id = str(payload.get("playerId", "")).strip()
        player_name = str(payload.get("playerName", "")).strip()
        max_players = int(payload.get("maxPlayers", 4))
        self.validate_player(player_id, player_name)
        self.validate_max_players(max_players)
        room = store.create_room(player_id, player_name, max_players)
        json_response(self, HTTPStatus.CREATED, {"ok": True, "room": room.to_payload()})

    def handle_join_room(self) -> None:
        payload = read_json(self)
        player_id = str(payload.get("playerId", "")).strip()
        player_name = str(payload.get("playerName", "")).strip()
        room_code = str(payload.get("roomCode", "")).strip().upper()
        self.validate_player(player_id, player_name)
        if not room_code:
            raise ValueError("Oda kodu gerekli.")
        room = store.join_room(room_code, player_id, player_name)
        json_response(self, HTTPStatus.OK, {"ok": True, "room": room.to_payload()})

    def handle_start_room(self, path: str) -> None:
        room_code = path.split("/")[3].upper()
        payload = read_json(self)
        player_id = str(payload.get("playerId", "")).strip()
        room = store.get_room(room_code)
        room.advance_if_due()
        self.assert_host(room, player_id)
        if len(room.players) < 2:
            raise ValueError("Oyunu baslatmak icin en az 2 oyuncu gerekli.")
        for player in room.players:
            player.step_wins = 0
        room.phase = "playing"
        room.step_index = 0
        room.step_winners = []
        room.setup_step()
        store.update_room(room)
        json_response(self, HTTPStatus.OK, {"ok": True, "room": room.to_payload()})

    def handle_restart_room(self, path: str) -> None:
        room_code = path.split("/")[3].upper()
        payload = read_json(self)
        player_id = str(payload.get("playerId", "")).strip()
        room = store.get_room(room_code)
        room.advance_if_due()
        self.assert_host(room, player_id)
        if room.phase != "finished":
            raise ValueError("Turnuva bitmeden yeniden baslatilamaz.")
        for player in room.players:
            player.step_wins = 0
        room.phase = "playing"
        room.step_index = 0
        room.step_winners = []
        room.setup_step()
        store.update_room(room)
        json_response(self, HTTPStatus.OK, {"ok": True, "room": room.to_payload()})

    def handle_tile_click(self, path: str) -> None:
        room_code = path.split("/")[3].upper()
        payload = read_json(self)
        player_id = str(payload.get("playerId", "")).strip()
        tile_index = int(payload.get("tileIndex", -1))

        room = store.get_room(room_code)
        room.advance_if_due()
        player = room.get_player(player_id)
        if not player:
            raise ValueError("Oyuncu odada bulunamadi.")
        if room.phase != "playing":
            raise ValueError("Oyun su an oynanmiyor.")
        if room.current_turn_player_id != player_id:
            raise ValueError("Su an sira sende degil.")
        if tile_index < 0 or tile_index >= len(room.board):
            raise ValueError("Gecersiz kutu secimi.")

        tile = room.board[tile_index]
        if tile["state"] != "hidden":
            raise ValueError("Bu kutu zaten acildi.")

        room.touch_player(player_id)
        is_winner = tile_index == room.winning_index
        tile["state"] = "revealed"
        tile["color"] = "green" if is_winner else "red"
        tile["playerId"] = player_id
        tile["initials"] = player.initials

        if is_winner:
            player.step_wins += 1
            room.step_winners.append(player_id)
            room.start_celebration(player_id)
        else:
            if room.opening_player_id == player_id and room.opening_streak_remaining > 1:
                room.opening_streak_remaining -= 1
            else:
                room.opening_streak_remaining = 0
                room.opening_player_id = None
                room.current_turn_index = (room.current_turn_index + 1) % len(room.players)

        store.update_room(room)
        json_response(self, HTTPStatus.OK, {"ok": True, "room": room.to_payload()})

    def handle_leave_room(self, path: str) -> None:
        room_code = path.split("/")[3].upper()
        payload = read_json(self)
        player_id = str(payload.get("playerId", "")).strip()
        store.leave_room(room_code, player_id)
        json_response(self, HTTPStatus.OK, {"ok": True})

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[server] {self.address_string()} - {format % args}")

    def assert_admin_access(self) -> None:
        if not ADMIN_TOKEN:
            raise ValueError("Admin erişimi henüz yapılandırılmadı.")

        token = self.headers.get("X-Admin-Token", "").strip()
        if token != ADMIN_TOKEN:
            raise ValueError("Bu istatistik ekranına erişim iznin yok.")

    @staticmethod
    def validate_player(player_id: str, player_name: str) -> None:
        if not player_id:
            raise ValueError("Oyuncu kimliği bulunamadı.")
        if len(player_name) < 2:
            raise ValueError("Oyuncu adı en az 2 karakter olmalı.")
        if len(player_name) > 20:
            raise ValueError("Oyuncu adı en fazla 20 karakter olmalı.")

    @staticmethod
    def validate_max_players(max_players: int) -> None:
        if max_players < MIN_PLAYERS or max_players > MAX_PLAYERS:
            raise ValueError("Oyuncu sayısı 2 ile 8 arasında olmalı.")

    @staticmethod
    def assert_host(room: Room, player_id: str) -> None:
        if room.host_id != player_id:
            raise ValueError("Bu islemi sadece oda sahibi yapabilir.")


def run() -> None:
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), GameRequestHandler)
    print(f"Sunucu basladi: http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()

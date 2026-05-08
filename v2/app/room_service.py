from __future__ import annotations

import json
import time
from collections import defaultdict
from threading import Lock
from typing import Any

from sqlalchemy.orm import Session

from v2.app.cache import redis_client
from v2.app.game_logic import (
    MAX_PLAYERS,
    MIN_PLAYERS,
    Player,
    Room,
    STEP_CONFIG,
    TURN_TIMEOUT_SECONDS,
    make_room_code,
    now_ts,
)
from v2.app.models import RoomEvent, RoomMeta

ROOM_TTL_SECONDS = 60 * 60 * 24
CREATE_ROOM_LIMIT = (6, 10)
JOIN_ROOM_LIMIT = (10, 10)
CLICK_WINDOW_LIMIT = (18, 5)
CLICK_COOLDOWN_SECONDS = 0.35


class RoomServiceError(ValueError):
    pass


class RequestRateGuard:
    def __init__(self) -> None:
        self.lock = Lock()
        self.buckets: dict[str, list[float]] = defaultdict(list)
        self.last_click_at: dict[str, float] = {}

    def hit(self, key: str, limit: int, period_seconds: int) -> bool:
        current = time.time()
        cutoff = current - period_seconds
        with self.lock:
            bucket = [timestamp for timestamp in self.buckets[key] if timestamp >= cutoff]
            if len(bucket) >= limit:
                self.buckets[key] = bucket
                return False
            bucket.append(current)
            self.buckets[key] = bucket
            return True

    def allow_click(self, player_id: str) -> bool:
        current = time.time()
        with self.lock:
            last_click = self.last_click_at.get(player_id, 0.0)
            if current - last_click < CLICK_COOLDOWN_SECONDS:
                return False
            self.last_click_at[player_id] = current
        return self.hit(f"click:{player_id}", CLICK_WINDOW_LIMIT[0], CLICK_WINDOW_LIMIT[1])


rate_guard = RequestRateGuard()


class RoomService:
    def __init__(self) -> None:
        self.redis = redis_client

    def _room_key(self, room_code: str) -> str:
        return f"room:{room_code.upper()}"

    def _room_meta_key(self) -> str:
        return "rooms:active"

    def _save_room(self, room: Room) -> None:
        room.updated_at = now_ts()
        room.ensure_valid_turn()
        key = self._room_key(room.code)
        self.redis.set(key, json.dumps(room.to_dict()), ex=ROOM_TTL_SECONDS)
        self.redis.sadd(self._room_meta_key(), room.code)

    def _delete_room(self, room_code: str) -> None:
        self.redis.delete(self._room_key(room_code))
        self.redis.srem(self._room_meta_key(), room_code)

    def _record_event(self, db: Session, event_type: str, room_code: str, player_id: str | None = None) -> None:
        db.add(RoomEvent(event_type=event_type, room_code=room_code, player_id=player_id or ""))
        db.commit()

    def _get_unique_room_code(self, db: Session) -> str:
        room_code = make_room_code()
        while db.query(RoomMeta).filter(RoomMeta.room_code == room_code).first() is not None:
            room_code = make_room_code()
        return room_code

    def create_room(self, db: Session, client_ip: str, player_id: str, player_name: str, max_players: int) -> Room:
        if not rate_guard.hit(f"create:{client_ip}", CREATE_ROOM_LIMIT[0], CREATE_ROOM_LIMIT[1]):
            raise RoomServiceError("Cok hizli oda olusturuyorsun. Lutfen kisa bir sure bekle.")
        if max_players < MIN_PLAYERS or max_players > MAX_PLAYERS:
            raise RoomServiceError("Oyuncu sayisi 2 ile 8 arasinda olmali.")

        room_code = self._get_unique_room_code(db)
        timestamp = now_ts()
        room = Room(code=room_code, host_id=player_id, max_players=max_players)
        room.players.append(Player(player_id=player_id, name=player_name, joined_at=timestamp, last_seen_at=timestamp))
        room.setup_step()
        self._save_room(room)

        db.add(RoomMeta(room_code=room.code, host_id=player_id, phase=room.phase, max_players=max_players))
        db.commit()
        self._record_event(db, "room_created", room.code, player_id)
        return room

    def get_room(self, room_code: str) -> Room:
        raw = self.redis.get(self._room_key(room_code))
        if not raw:
            raise RoomServiceError("Oda bulunamadi.")
        room = Room.from_dict(json.loads(raw))
        room.prune_inactive_players()
        room.advance_if_due()
        if not room.players:
            self._delete_room(room_code)
            raise RoomServiceError("Oda bulunamadi.")
        self._save_room(room)
        return room

    def update_room(self, db: Session, room: Room) -> Room:
        self._save_room(room)
        meta = db.query(RoomMeta).filter(RoomMeta.room_code == room.code).first()
        if meta:
            meta.host_id = room.host_id
            meta.phase = room.phase
            meta.max_players = room.max_players
            db.commit()
        return room

    def join_room(self, db: Session, client_ip: str, room_code: str, player_id: str, player_name: str) -> Room:
        if not rate_guard.hit(f"join:{client_ip}:{room_code}", JOIN_ROOM_LIMIT[0], JOIN_ROOM_LIMIT[1]):
            raise RoomServiceError("Cok hizli katilim istegi gonderiyorsun. Lutfen kisa bir sure bekle.")
        room = self.get_room(room_code)
        existing_player = room.get_player(player_id)
        timestamp = now_ts()
        event_type: str | None = None

        if existing_player:
            existing_player.name = player_name
            existing_player.last_seen_at = timestamp
        else:
            if len(room.players) >= room.max_players:
                raise RoomServiceError(f"Lobi dolu. Maksimum {room.max_players} oyuncu katilabilir.")
            if room.phase == "waiting":
                room.players.append(Player(player_id=player_id, name=player_name, joined_at=timestamp, last_seen_at=timestamp))
                room.set_join_request_status(player_id, "approved")
                event_type = "player_joined"
            else:
                room.add_join_request(player_id, player_name)
                event_type = "join_requested"

        self.update_room(db, room)
        if event_type:
            self._record_event(db, event_type, room.code, player_id)
        return room

    def get_join_request_status(self, room_code: str, player_id: str) -> tuple[str, Room]:
        room = self.get_room(room_code)
        if room.get_player(player_id):
            return "approved", room
        if room.get_pending_request(player_id):
            return "pending", room
        return room.join_request_statuses.get(player_id, {}).get("status", "missing"), room

    def start_room(self, db: Session, room_code: str, player_id: str) -> Room:
        room = self.get_room(room_code)
        if room.host_id != player_id:
            raise RoomServiceError("Bu islemi sadece oda sahibi yapabilir.")
        if len(room.players) < 2:
            raise RoomServiceError("Oyunu baslatmak icin en az 2 oyuncu gerekli.")
        for player in room.players:
            player.score = 0
        room.phase = "playing"
        room.step_index = 0
        room.step_summaries = []
        room.current_step_scores = {}
        room.current_step_first_finders = []
        room.winner_id = None
        room.setup_step()
        return self.update_room(db, room)

    def restart_room(self, db: Session, room_code: str, player_id: str) -> Room:
        room = self.get_room(room_code)
        if room.host_id != player_id:
            raise RoomServiceError("Bu islemi sadece oda sahibi yapabilir.")
        if room.phase != "finished":
            raise RoomServiceError("Turnuva bitmeden yeniden baslatilamaz.")
        for player in room.players:
            player.score = 0
        room.phase = "playing"
        room.step_index = 0
        room.step_summaries = []
        room.current_step_scores = {}
        room.current_step_first_finders = []
        room.winner_id = None
        room.setup_step()
        return self.update_room(db, room)

    def click_tile(self, db: Session, room_code: str, player_id: str, tile_index: int) -> Room:
        room = self.get_room(room_code)
        player = room.get_player(player_id)
        if not player:
            raise RoomServiceError("Oyuncu odada bulunamadi.")
        if not rate_guard.allow_click(player_id):
            raise RoomServiceError("Cok hizli tiklaniyor. Lutfen bir an bekleyip tekrar dene.")
        if room.phase != "playing":
            raise RoomServiceError("Oyun su an oynanmiyor.")
        if room.current_turn_player_id != player_id:
            raise RoomServiceError("Su an sira sende degil.")
        if tile_index < 0 or tile_index >= len(room.board):
            raise RoomServiceError("Gecersiz kutu secimi.")

        tile = room.board[tile_index]
        if tile["state"] != "hidden":
            raise RoomServiceError("Bu kutu zaten acildi.")

        room.touch_player(player_id)
        is_green = tile_index in room.green_indexes
        tile["state"] = "revealed"
        tile["color"] = "green" if is_green else "red"
        tile["playerId"] = player_id
        tile["initials"] = player.initials

        if is_green:
            player.score += 1
            room.found_green_count += 1
            room.current_step_scores[player_id] = room.current_step_scores.get(player_id, 0) + 1
            if player_id not in room.current_step_first_finders:
                room.current_step_first_finders.append(player_id)

            if room.found_green_count >= room.current_step["green_boxes"]:
                room.finish_step()
                return self.update_room(db, room)

            if room.opening_player_id == player_id and room.opening_streak_remaining > 1:
                room.opening_streak_remaining -= 1
                room.mark_turn_started()
            else:
                room.opening_streak_remaining = 0
                room.opening_player_id = None
                room.advance_turn()
        else:
            if room.opening_player_id == player_id and room.opening_streak_remaining > 1:
                room.opening_streak_remaining -= 1
                room.mark_turn_started()
            else:
                room.opening_streak_remaining = 0
                room.opening_player_id = None
                room.advance_turn()

        return self.update_room(db, room)

    def leave_room(self, db: Session, room_code: str, player_id: str) -> Room | None:
        room = self.get_room(room_code)
        room.remove_player(player_id)
        room.remove_join_request(player_id)
        room.set_join_request_status(player_id, "left")
        if not room.players:
            self._delete_room(room.code)
            meta = db.query(RoomMeta).filter(RoomMeta.room_code == room.code).first()
            if meta:
                db.delete(meta)
                db.commit()
            return None
        return self.update_room(db, room)

    def kick_player(self, db: Session, room_code: str, host_id: str, target_player_id: str) -> Room:
        room = self.get_room(room_code)
        if room.host_id != host_id:
            raise RoomServiceError("Bu islemi sadece oda sahibi yapabilir.")
        if room.host_id == target_player_id:
            raise RoomServiceError("Oda sahibi kendini oyundan atamaz.")
        if not room.get_player(target_player_id):
            raise RoomServiceError("Oyuncu odada bulunamadi.")
        room.remove_player(target_player_id)
        room.remove_join_request(target_player_id)
        room.set_join_request_status(target_player_id, "kicked")
        return self.update_room(db, room)

    def approve_join_request(self, db: Session, room_code: str, host_id: str, target_player_id: str) -> Room:
        room = self.get_room(room_code)
        if room.host_id != host_id:
            raise RoomServiceError("Bu islemi sadece oda sahibi yapabilir.")
        request = room.get_pending_request(target_player_id)
        if not request:
            raise RoomServiceError("Katilim istegi bulunamadi.")
        if len(room.players) >= room.max_players:
            raise RoomServiceError(f"Lobi dolu. Maksimum {room.max_players} oyuncu katilabilir.")
        room.players.append(
            Player(
                player_id=request["playerId"],
                name=request["playerName"],
                joined_at=now_ts(),
                last_seen_at=now_ts(),
            )
        )
        room.remove_join_request(target_player_id)
        room.set_join_request_status(target_player_id, "approved")
        self._record_event(db, "player_joined", room.code, target_player_id)
        return self.update_room(db, room)

    def reject_join_request(self, db: Session, room_code: str, host_id: str, target_player_id: str) -> Room:
        room = self.get_room(room_code)
        if room.host_id != host_id:
            raise RoomServiceError("Bu islemi sadece oda sahibi yapabilir.")
        if not room.get_pending_request(target_player_id):
            raise RoomServiceError("Katilim istegi bulunamadi.")
        room.remove_join_request(target_player_id)
        room.set_join_request_status(target_player_id, "rejected")
        return self.update_room(db, room)


room_service = RoomService()

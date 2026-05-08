from __future__ import annotations

import random
import string
import time
from dataclasses import dataclass, field
from typing import Any

MAX_PLAYERS = 8
MIN_PLAYERS = 2
STEP_CONFIG = [
    {"tiles": 100, "green_boxes": 5, "opening_streak": 0},
    {"tiles": 80, "green_boxes": 4, "opening_streak": 0},
    {"tiles": 60, "green_boxes": 3, "opening_streak": 0},
    {"tiles": 50, "green_boxes": 2, "opening_streak": 0},
    {"tiles": 40, "green_boxes": 1, "opening_streak": 0},
]
PLAYER_TTL_SECONDS = 60 * 20
TURN_TIMEOUT_SECONDS = 10
PLAYER_TOUCH_INTERVAL_SECONDS = 4


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
    score: int = 0

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
    green_indexes: list[int] = field(default_factory=list)
    found_green_count: int = 0
    current_turn_index: int = 0
    winner_id: str | None = None
    created_at: int = field(default_factory=now_ts)
    updated_at: int = field(default_factory=now_ts)
    step_index: int = 0
    step_summaries: list[dict[str, Any]] = field(default_factory=list)
    current_step_scores: dict[str, int] = field(default_factory=dict)
    current_step_first_finders: list[str] = field(default_factory=list)
    opening_player_id: str | None = None
    opening_streak_remaining: int = 0
    pending_next_step_at: int | None = None
    pending_next_step_starter_id: str | None = None
    turn_started_at: int = field(default_factory=now_ts)
    pending_join_requests: list[dict[str, Any]] = field(default_factory=list)
    join_request_statuses: dict[str, dict[str, Any]] = field(default_factory=dict)
    last_timeout_player_id: str | None = None
    last_timeout_at: int | None = None

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
            self.turn_started_at = now_ts()
            return
        self.current_turn_index %= len(self.players)
        if self.opening_player_id and not self.get_player(self.opening_player_id):
            self.opening_player_id = None
            self.opening_streak_remaining = 0
        if self.pending_next_step_starter_id and not self.get_player(self.pending_next_step_starter_id):
            self.pending_next_step_starter_id = self.players[0].player_id
        if not self.turn_started_at:
            self.turn_started_at = now_ts()

    def touch_player(self, player_id: str) -> None:
        player = self.get_player(player_id)
        if player:
            timestamp = now_ts()
            if timestamp - player.last_seen_at >= PLAYER_TOUCH_INTERVAL_SECONDS:
                player.last_seen_at = timestamp
                self.updated_at = timestamp

    def get_pending_request(self, player_id: str) -> dict[str, Any] | None:
        return next((request for request in self.pending_join_requests if request["playerId"] == player_id), None)

    def set_join_request_status(self, player_id: str, status: str) -> None:
        self.join_request_statuses[player_id] = {
            "status": status,
            "updatedAt": now_ts(),
        }

    def add_join_request(self, player_id: str, player_name: str) -> None:
        existing_request = self.get_pending_request(player_id)
        timestamp = now_ts()
        if existing_request:
            existing_request["playerName"] = player_name
            existing_request["requestedAt"] = timestamp
        else:
            self.pending_join_requests.append(
                {
                    "playerId": player_id,
                    "playerName": player_name,
                    "requestedAt": timestamp,
                }
            )
        self.set_join_request_status(player_id, "pending")
        self.updated_at = timestamp

    def remove_join_request(self, player_id: str) -> None:
        self.pending_join_requests = [
            request for request in self.pending_join_requests if request["playerId"] != player_id
        ]

    def mark_turn_started(self) -> None:
        self.turn_started_at = now_ts()

    def advance_turn(self) -> None:
        if not self.players:
            self.current_turn_index = 0
            self.turn_started_at = now_ts()
            return
        self.current_turn_index = (self.current_turn_index + 1) % len(self.players)
        self.turn_started_at = now_ts()

    def setup_step(self, starter_id: str | None = None) -> None:
        tile_count = self.current_step["tiles"]
        green_count = self.current_step["green_boxes"]
        self.board = [{"state": "hidden", "color": None, "playerId": None, "initials": ""} for _ in range(tile_count)]
        self.green_indexes = sorted(random.sample(range(tile_count), green_count))
        self.found_green_count = 0
        self.current_step_scores = {}
        self.current_step_first_finders = []
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
        self.mark_turn_started()
        self.updated_at = now_ts()

    def _resolve_step_leaders(self) -> tuple[list[str], int, str]:
        if not self.current_step_scores:
            fallback_id = self.current_turn_player_id or (self.players[0].player_id if self.players else "")
            return ([fallback_id] if fallback_id else []), 0, fallback_id

        top_score = max(self.current_step_scores.values())
        leader_ids = [player_id for player_id, score in self.current_step_scores.items() if score == top_score]

        def finder_order(player_id: str) -> int:
            return self.current_step_first_finders.index(player_id) if player_id in self.current_step_first_finders else 9999

        leader_ids.sort(key=lambda player_id: (finder_order(player_id), self.get_player_index(player_id) or 9999))
        bonus_starter_id = leader_ids[0]
        return leader_ids, top_score, bonus_starter_id

    def finish_step(self) -> None:
        leader_ids, top_score, bonus_starter_id = self._resolve_step_leaders()
        leader_names = [self.get_player(player_id).name if self.get_player(player_id) else "Ayrilan oyuncu" for player_id in leader_ids]
        score_map = {
            player.player_id: self.current_step_scores.get(player.player_id, 0)
            for player in self.players
        }
        self.step_summaries.append(
            {
                "step": self.step_index + 1,
                "leaderIds": leader_ids,
                "leaderNames": leader_names,
                "topScore": top_score,
                "greenBoxes": self.current_step["green_boxes"],
                "scoreMap": score_map,
                "bonusStarterId": bonus_starter_id,
                "bonusStarterName": self.get_player(bonus_starter_id).name if self.get_player(bonus_starter_id) else "Oyuncu",
            }
        )
        self.start_celebration(bonus_starter_id)

    def start_celebration(self, winner_id: str) -> None:
        self.phase = "celebrating"
        self.winner_id = winner_id
        self.pending_next_step_at = now_ts() + 5
        self.pending_next_step_starter_id = winner_id
        self.opening_player_id = None
        self.opening_streak_remaining = 0
        self.turn_started_at = 0
        self.updated_at = now_ts()

    def advance_if_due(self) -> None:
        if self.phase == "playing" and self.players and self.turn_started_at:
            while now_ts() >= self.turn_started_at + TURN_TIMEOUT_SECONDS and self.phase == "playing" and self.players:
                timed_out_player_id = self.current_turn_player_id
                self.last_timeout_player_id = timed_out_player_id
                self.last_timeout_at = now_ts()
                self.opening_player_id = None
                self.opening_streak_remaining = 0
                self.advance_turn()
                self.updated_at = now_ts()

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
        return self.step_summaries

    def get_leaderboard(self) -> list[dict[str, Any]]:
        sorted_players = sorted(self.players, key=lambda player: (-player.score, player.joined_at))
        top_score = sorted_players[0].score if sorted_players else 0
        return [
            {
                "id": player.player_id,
                "name": player.name,
                "initials": player.initials,
                "score": player.score,
                "isLeader": top_score > 0 and player.score == top_score,
            }
            for player in sorted_players
        ]

    def remove_player(self, player_id: str) -> None:
        player_index = self.get_player_index(player_id)
        if player_index is None:
            return

        removed_was_current_turn = self.current_turn_player_id == player_id
        self.players.pop(player_index)
        if not self.players:
            return

        if self.host_id == player_id:
            self.host_id = self.players[0].player_id

        if player_index < self.current_turn_index:
            self.current_turn_index -= 1

        if removed_was_current_turn:
            self.opening_player_id = None
            self.opening_streak_remaining = 0
            self.ensure_valid_turn()
            self.mark_turn_started()

        if self.phase in {"playing", "celebrating"} and len(self.players) < 2:
            self.phase = "waiting"
            self.step_index = 0
            self.step_summaries = []
            self.current_step_scores = {}
            self.current_step_first_finders = []
            for player in self.players:
                player.score = 0
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
                    "score": player.score,
                }
                for player in self.players
            ],
            "board": self.board,
            "currentTurnPlayerId": self.current_turn_player_id,
            "winnerId": self.winner_id,
            "currentStep": step_number,
            "totalSteps": len(STEP_CONFIG),
            "tileCount": len(self.board),
            "greenBoxCount": self.current_step["green_boxes"],
            "foundGreenCount": self.found_green_count,
            "remainingGreenCount": max(0, self.current_step["green_boxes"] - self.found_green_count),
            "openingPlayerId": self.opening_player_id,
            "openingStreakRemaining": self.opening_streak_remaining,
            "secondsUntilTurnTimeout": max(0, (self.turn_started_at + TURN_TIMEOUT_SECONDS) - now_ts()) if self.phase == "playing" and self.turn_started_at else 0,
            "stepResults": self.get_step_results(),
            "leaderboard": self.get_leaderboard(),
            "secondsUntilNextStep": max(0, (self.pending_next_step_at or 0) - now_ts()),
            "pendingJoinRequests": self.pending_join_requests,
            "lastTimeoutPlayerId": self.last_timeout_player_id,
            "lastTimeoutAt": self.last_timeout_at,
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            "code": self.code,
            "host_id": self.host_id,
            "max_players": self.max_players,
            "players": [
                {
                    "player_id": player.player_id,
                    "name": player.name,
                    "joined_at": player.joined_at,
                    "last_seen_at": player.last_seen_at,
                    "score": player.score,
                }
                for player in self.players
            ],
            "phase": self.phase,
            "board": self.board,
            "green_indexes": self.green_indexes,
            "found_green_count": self.found_green_count,
            "current_turn_index": self.current_turn_index,
            "winner_id": self.winner_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "step_index": self.step_index,
            "step_summaries": self.step_summaries,
            "current_step_scores": self.current_step_scores,
            "current_step_first_finders": self.current_step_first_finders,
            "opening_player_id": self.opening_player_id,
            "opening_streak_remaining": self.opening_streak_remaining,
            "pending_next_step_at": self.pending_next_step_at,
            "pending_next_step_starter_id": self.pending_next_step_starter_id,
            "turn_started_at": self.turn_started_at,
            "pending_join_requests": self.pending_join_requests,
            "join_request_statuses": self.join_request_statuses,
            "last_timeout_player_id": self.last_timeout_player_id,
            "last_timeout_at": self.last_timeout_at,
        }

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "Room":
        room = cls(
            code=raw["code"],
            host_id=raw["host_id"],
            max_players=raw.get("max_players", 8),
            players=[
                Player(
                    player_id=player["player_id"],
                    name=player["name"],
                    joined_at=player["joined_at"],
                    last_seen_at=player.get("last_seen_at", player["joined_at"]),
                    score=player.get("score", player.get("step_wins", 0)),
                )
                for player in raw["players"]
            ],
            phase=raw.get("phase", "waiting"),
            board=raw.get("board", []),
            green_indexes=raw.get("green_indexes", []),
            found_green_count=raw.get("found_green_count", 0),
            current_turn_index=raw.get("current_turn_index", 0),
            winner_id=raw.get("winner_id"),
            created_at=raw.get("created_at", now_ts()),
            updated_at=raw.get("updated_at", now_ts()),
            step_index=raw.get("step_index", 0),
            step_summaries=raw.get("step_summaries", raw.get("step_winners", [])),
            current_step_scores=raw.get("current_step_scores", {}),
            current_step_first_finders=raw.get("current_step_first_finders", []),
            opening_player_id=raw.get("opening_player_id"),
            opening_streak_remaining=raw.get("opening_streak_remaining", 0),
            pending_next_step_at=raw.get("pending_next_step_at"),
            pending_next_step_starter_id=raw.get("pending_next_step_starter_id"),
            turn_started_at=raw.get("turn_started_at", now_ts()),
            pending_join_requests=raw.get("pending_join_requests", []),
            join_request_statuses=raw.get("join_request_statuses", {}),
            last_timeout_player_id=raw.get("last_timeout_player_id"),
            last_timeout_at=raw.get("last_timeout_at"),
        )
        if not room.board:
            room.setup_step()
        room.ensure_valid_turn()
        return room

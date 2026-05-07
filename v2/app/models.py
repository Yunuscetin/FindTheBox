from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from v2.app.db import Base


class RoomMeta(Base):
    __tablename__ = "room_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    host_id: Mapped[str] = mapped_column(String(64), index=True)
    phase: Mapped[str] = mapped_column(String(32), default="waiting", index=True)
    max_players: Mapped[int] = mapped_column(Integer, default=4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class RoomEvent(Base):
    __tablename__ = "room_events_v2"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(String(32), index=True)
    room_code: Mapped[str] = mapped_column(String(12), index=True)
    player_id: Mapped[str] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

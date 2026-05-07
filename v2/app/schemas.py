from pydantic import BaseModel, Field


class CreateRoomRequest(BaseModel):
    playerId: str = Field(min_length=1)
    playerName: str = Field(min_length=2, max_length=20)
    maxPlayers: int = 4


class JoinRoomRequest(BaseModel):
    playerId: str = Field(min_length=1)
    playerName: str = Field(min_length=2, max_length=20)
    roomCode: str = Field(min_length=1)


class RoomActionRequest(BaseModel):
    playerId: str = Field(min_length=1)


class TargetedRoomActionRequest(RoomActionRequest):
    targetPlayerId: str = Field(min_length=1)


class TileClickRequest(RoomActionRequest):
    tileIndex: int

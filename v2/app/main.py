from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from v2.app.bootstrap import init_schema
from v2.app.routes import admin, health, rooms

STATIC_DIR = Path(__file__).resolve().parents[2]

app = FastAPI(
    title="FindTheBox V2",
    version="0.1.0",
)


@app.on_event("startup")
def on_startup() -> None:
    init_schema()

app.include_router(health.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(rooms.router, prefix="/api")
app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

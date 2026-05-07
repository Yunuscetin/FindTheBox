from fastapi import FastAPI

from v2.app.bootstrap import init_schema
from v2.app.routes import admin, health, rooms


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

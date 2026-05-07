from v2.app.db import Base, engine


def init_schema() -> None:
    Base.metadata.create_all(bind=engine)

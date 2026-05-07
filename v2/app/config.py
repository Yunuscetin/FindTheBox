from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8010
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/findthebox"
    redis_url: str = "redis://localhost:6379/0"
    admin_token: str = "change-me"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()

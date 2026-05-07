from redis import Redis

from v2.app.config import settings


redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


def ping_redis() -> bool:
    return bool(redis_client.ping())

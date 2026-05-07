# FindTheBox V2

Bu klasor, oyunun olceklenebilir mimariye gecis iskeletidir.

## Hedef

- FastAPI tabanli HTTP API
- Redis tabanli aktif oda state'i
- Postgres tabanli kalici veri
- ileride WebSocket ve worker destegi

## Ilk Calistirma

1. `docker compose -f docker-compose.v2.yml up -d`
2. `.env.v2.example` dosyasini `.env` veya deploy env olarak uyarlayin
3. `uvicorn v2.app.main:app --reload --host 0.0.0.0 --port 8010`

## Render Deploy

Yeni servis icin [render-v2.yaml](../../render-v2.yaml) dosyasi kullanilabilir.

Gerekli env degiskenleri:

- `DATABASE_URL`
- `REDIS_URL`
- `ADMIN_TOKEN`

## Not

Bu klasor su an gecis iskeleti sunar. Mevcut canli uygulama hala kok dizindeki
`server.py` uzerinden calisir.

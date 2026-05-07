# FindTheBox V2 Architecture

Bu belge, mevcut `server.py + SQLite + polling` yapısından
`FastAPI + Postgres + Redis + WebSocket` mimarisine gecis planini tanimlar.

## Neden geciyoruz?

Mevcut mimari:

- tek process Python HTTP server
- SQLite
- oda state'inin tek JSON blob olarak saklanmasi
- istemci tarafinda polling

Bu yapi kucuk ve orta olcekli kullanimda yeterli olsa da,
ayni anda yuzlerce veya binlerce oda icin uygun degildir.

## Hedef Mimari

```text
Cloudflare
  -> Load Balancer / App Instances
    -> FastAPI HTTP API
    -> WebSocket Gateway
    -> Background Worker
      -> Redis (aktif oda state'i, presence, timer, pub/sub)
      -> Postgres (kalici veri, oda meta bilgisi, leaderboard, analytics)
```

## Servis Sorumluluklari

### 1. HTTP API

Sorumluluk:

- oda kurma
- odaya katilma istegi
- host islemleri
- admin endpointleri
- SEO/static dosyalar icin gerekirse reverse proxy uyumu

### 2. WebSocket Gateway

Sorumluluk:

- oyuncu baglanmasi
- oda state guncellemelerini anlik yayinlama
- kutu acma, sira degisimi, timeout, reconnect olaylarini push etme

### 3. Worker

Sorumluluk:

- turn timeout
- reconnect grace period
- oda temizligi
- gecikmeli sonraki tur gecisi
- analytics event aggregation

## Veri Ayrimi

### Redis

Redis'te tutulacaklar:

- aktif oda state'i
- oyuncu presence bilgisi
- current turn
- acilan kutular
- pending join request
- timeout scheduler bilgileri
- kisa sureli rate limit sayaçlari

### Postgres

Postgres'te tutulacaklar:

- room metadata
- player profile / display name
- historical room events
- leaderboard snapshots
- admin raporlama icin gunluk aggregate veriler

## Oda Modeli

Oda state'i blob yerine ayrik alanlarla tutulmali:

- room_id
- room_code
- host_id
- phase
- current_round
- current_turn_player_id
- opening_streak_remaining
- max_players
- created_at
- updated_at

Board state Redis icinde tutulmali:

- `room:{code}:board`
- `room:{code}:players`
- `room:{code}:meta`

## Gecis Plani

### Asama 2

- yeni `v2/` klasor yapisi olustur
- FastAPI app iskeleti kur
- config/env yapisi ekle
- Postgres/Redis baglanti katmani ekle
- mevcut oyun kurallarini modullere ayir

### Asama 3

- WebSocket endpointleri ekle
- polling bagimli frontend akisini socket tabanli hale getir
- timeout/cleanup islerini worker'a tasi
- coklu instance senaryosunda Redis pub/sub ile senkronizasyon sagla

## Kullanici Tarafi Gerekenler

Bu gecis icin kullanicinin kendi hesaplarinda sunlari hazirlamasi gerekir:

1. Bir managed Postgres servisi
2. Bir managed Redis servisi
3. Yeni environment variable'lar:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `ADMIN_TOKEN`
   - `APP_ENV`
4. Yeni servis deploy hedefi

## Baslangic Dosyalari

Bu repo icinde `v2/` klasoru, gecis iskeleti olarak yer alir.
Mevcut canli surum korunurken yeni mimari bu klasor uzerinden ilerletilecektir.

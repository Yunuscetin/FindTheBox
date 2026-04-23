# FindTheBox Scaling Plan

Bu belge, projeyi küçük canlı trafik seviyesinden daha güvenli ve daha ölçeklenebilir hale taşımak için uygulanacak adımları sıralar.

## 1. Hemen Yapılacaklar

Bu adımlar düşük efor / yüksek kazanç sağlar.

- Render planını `Starter` üstüne çıkarmayı değerlendir.
- `ADMIN_TOKEN` tanımlı kalsın.
- `robots.txt` ve `sitemap.xml` canlıda erişilebilir olsun.
- Google Search Console'a domaini ekle.
- Cloudflare DNS proxy kullan.

## 2. Codex Tarafında Yapılanlar

Şu iyileştirmeler kod tarafında uygulanmıştır:

- SQLite için `WAL`, `busy_timeout` ve daha hafif `synchronous` ayarı eklendi.
- Her istekte prune çalıştırmak yerine aralıklı prune mantığı eklendi.
- Oyuncu heartbeat yazıları seyrekleştirildi.
- İstemci polling sıklığı duruma göre ayarlanır hale getirildi.

## 3. Kullanıcının Yapacağı Altyapı Adımları

### Cloudflare

1. Domaini Cloudflare'e ekle.
2. Nameserver'ları GoDaddy'de Cloudflare'e çevir.
3. `findthebox.co` ve `www` kayıtlarını Cloudflare'de doğrula.
4. SSL modunu `Full` yap.
5. Basit WAF ve bot korumasını aç.
6. Rate limiting ekle:
   - `/api/rooms`
   - `/api/rooms/join`
   - `/api/rooms/*/click`

### Search Console

1. Domain property ekle.
2. DNS TXT ile doğrula.
3. `https://findthebox.co/sitemap.xml` gönder.
4. `tr/` ve `en/` sayfalarının indekslenmesini takip et.

### Render

1. `Manual Deploy` yerine otomatik deploy'u açık tut.
2. Uygunsa daha güçlü plan seç.
3. Log ve health check takibi yap.

## 4. Orta Vadede Yapılacak Kod Değişiklikleri

Bu adımlar daha büyük trafik için gereklidir.

1. SQLite -> Postgres geçişi
2. Polling -> WebSocket veya SSE
3. Oda state yapısını daha küçük payload'lara ayırma
4. Presence / reconnect mantığını daha da güçlendirme
5. Basit abuse koruması ve request limitleri

## 5. Büyük Trafik İçin Hedef Mimari

- Web app: FastAPI / Node / benzeri production framework
- Realtime: WebSocket
- DB: Postgres
- Cache / presence: Redis
- CDN / WAF: Cloudflare
- Gözlemleme: Search Console + uptime + server metrics

## 6. Başarı Kriteri

Şu noktada sistem daha güvenli hale gelmiş sayılır:

- Aynı anda 50-100 oyuncuda gecikme kabul edilebilir kalıyorsa
- Search Console üzerinden indeksleme başlıyorsa
- Cloudflare rate limit ile abuse engelleniyorsa
- Render loglarında timeout / lock hataları düşükse

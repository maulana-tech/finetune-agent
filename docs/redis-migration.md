# Migrasi Redis: Upstash → Self-hosted VPS

## Latar Belakang

API dan Workers sudah berjalan di VPS Cloudeka Jakarta. Co-locating Redis di mesin yang sama menghilangkan network round-trip ke Upstash dan menghapus batas 10.000 request/hari dari free tier.

Kode tidak perlu diubah — semua workers dan API sudah fallback ke `redis://localhost:6379`.

---

## Langkah Migrasi

### 1. Install Redis di VPS

```bash
sudo apt update && sudo apt install -y redis-server
```

### 2. Konfigurasi `/etc/redis/redis.conf`

```
bind 127.0.0.1
maxmemory 256mb
maxmemory-policy allkeys-lru
requirepass your-strong-password
daemonize yes
```

```bash
sudo systemctl restart redis
sudo systemctl enable redis
redis-cli -a your-strong-password ping  # → PONG
```

### 3. Update `.env` di VPS

```env
# sebelum
REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"

# sesudah
REDIS_URL="redis://:your-strong-password@127.0.0.1:6379"
```

### 4. Restart PM2

```bash
pm2 restart all
pm2 logs --lines 50
```

### 5. Verifikasi

```bash
redis-cli -a your-strong-password
> KEYS bull:*     # harus muncul queue keys dari BullMQ
> INFO memory     # cek penggunaan memori
```

Trigger satu scrape job dari dashboard — pastikan masuk queue dan diproses worker.

---

## Checklist

- [ ] Redis terinstall & running di VPS
- [ ] `redis.conf` dikonfigurasi (bind lokal + password + maxmemory)
- [ ] `.env` di VPS diupdate
- [ ] PM2 restart
- [ ] Test satu job end-to-end

---

## Rollback

Kalau ada masalah, revert `.env` ke URL Upstash lama dan `pm2 restart all`. Tidak ada perubahan kode.

---

**Estimasi waktu:** 15–20 menit.

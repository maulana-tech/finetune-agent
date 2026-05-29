# Migrasi Redis: Upstash → Self-hosted VPS

## Latar Belakang

API dan Workers sudah berjalan di VPS Cloudeka Jakarta. Co-locating Redis di mesin yang sama menghilangkan network round-trip ke Upstash dan menghapus batas 10.000 request/hari dari free tier.

Kode tidak perlu diubah — semua workers dan API sudah fallback ke `redis://localhost:6379`.

---

## Langkah Migrasi

### Option A: Automated Setup (Recommended)

```bash
# 1. Copy script ke VPS
scp scripts/setup-redis-vps.sh user@your-vps-ip:~/

# 2. SSH ke VPS
ssh user@your-vps-ip

# 3. Run setup script
bash setup-redis-vps.sh

# Script akan:
# - Install Redis
# - Generate secure password
# - Configure Redis (bind localhost, maxmemory, persistence)
# - Restart & enable Redis service
# - Test connection
```

### Option B: Manual Setup

#### 1. Install Redis di VPS

```bash
sudo apt update && sudo apt install -y redis-server
```

#### 2. Generate Strong Password

```bash
# Generate secure password
openssl rand -base64 32
# Save output sebagai REDIS_PASSWORD
```

#### 3. Konfigurasi `/etc/redis/redis.conf`

```bash
# Backup original config
sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Edit config
sudo nano /etc/redis/redis.conf
```

Tambahkan/edit lines berikut:

```
# Bind localhost only
bind 127.0.0.1 ::1

# Password
requirepass YOUR_GENERATED_PASSWORD

# Memory limit
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 60 1
save 300 100
save 900 1000
appendonly yes
appendfsync everysec

# Daemon mode
daemonize yes

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

#### 4. Restart Redis

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli -a YOUR_PASSWORD ping  # → PONG
```

### 3. Update `.env` di VPS

```bash
# Edit .env di root project di VPS
nano .env
```

```env
# BEFORE (Upstash)
REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"

# AFTER (Local Redis)
REDIS_URL="redis://:YOUR_GENERATED_PASSWORD@127.0.0.1:6379"
```

### 4. Restart PM2

```bash
pm2 restart all
pm2 logs --lines 50

# Check if all processes started successfully
pm2 list
```

### 5. Verifikasi

```bash
# Check Redis is running
redis-cli -a YOUR_PASSWORD ping

# Check BullMQ queues
redis-cli -a YOUR_PASSWORD KEYS 'bull:*'

# Check memory usage
redis-cli -a YOUR_PASSWORD INFO memory | grep used_memory_human

# Or use monitoring script
bash scripts/monitor-redis.sh
```

#### Test End-to-End

1. Open dashboard: `https://your-domain.com/dashboard`
2. Go to **Scrape Schedules**
3. Create new schedule atau trigger existing schedule
4. Monitor logs: `pm2 logs workers --lines 100`
5. Check Redis queues: `bash scripts/monitor-redis.sh`

Expected: Job masuk queue → worker process → leads tersimpan ke DB

---

## Checklist

### Pre-Migration
- [ ] SSH access ke VPS
- [ ] Backup `.env` file: `cp .env .env.backup`
- [ ] Note down current Upstash URL (for rollback)

### Migration
- [ ] Redis terinstall & running di VPS
- [ ] `redis.conf` dikonfigurasi (bind lokal + password + maxmemory)
- [ ] Password generated & saved securely
- [ ] Redis service enabled: `sudo systemctl enable redis-server`
- [ ] Connection test passed: `redis-cli -a PASSWORD ping` → PONG

### Application Update
- [ ] `.env` di VPS diupdate dengan local Redis URL
- [ ] PM2 restart: `pm2 restart all`
- [ ] PM2 logs show no Redis connection errors
- [ ] All processes running: `pm2 list` (all green)

### Verification
- [ ] Redis keys exist: `redis-cli -a PASSWORD KEYS 'bull:*'`
- [ ] Test scrape job from dashboard
- [ ] Job appears in queue: `bash scripts/monitor-redis.sh`
- [ ] Worker processes job successfully
- [ ] Leads saved to database
- [ ] No rate-limiting errors in logs

### Post-Migration
- [ ] Monitor Redis memory: `redis-cli -a PASSWORD INFO memory`
- [ ] Check PM2 logs for 24h: `pm2 logs --lines 500`
- [ ] Remove Upstash URL from `.env` (optional, for security)
- [ ] Update documentation with Redis password location

---

## Troubleshooting

### Redis tidak start

```bash
# Check status
sudo systemctl status redis-server

# Check logs
sudo tail -f /var/log/redis/redis-server.log

# Check config syntax
redis-server /etc/redis/redis.conf --test-memory 1
```

**Common issues:**
- Port 6379 already in use: `sudo lsof -i :6379`
- Permission denied: `sudo chown redis:redis /var/lib/redis`
- Config error: restore backup `sudo cp /etc/redis/redis.conf.backup /etc/redis/redis.conf`

### PM2 tidak connect ke Redis

```bash
# Check PM2 logs
pm2 logs --lines 100 | grep -i redis

# Test connection from Node
node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(console.log)"
```

**Common issues:**
- Wrong password: double-check `.env` format `redis://:PASSWORD@...`
- Firewall blocking: Redis should be on `127.0.0.1` only
- `.env` not loaded: ensure `dotenv` wrapper in PM2 ecosystem config

### Jobs tidak diproses

```bash
# Check if workers running
pm2 list | grep workers

# Check queue contents
redis-cli -a PASSWORD LLEN 'bull:scrape-map:wait'
redis-cli -a PASSWORD LLEN 'bull:scrape-map:failed'

# View failed jobs
redis-cli -a PASSWORD LRANGE 'bull:scrape-map:failed' 0 -1
```

**Solutions:**
- Restart workers: `pm2 restart workers`
- Clear failed jobs: `redis-cli -a PASSWORD DEL 'bull:QUEUE_NAME:failed'`
- Check Python venv: workers spawn Python scraper

### Memory usage tinggi

```bash
# Check current memory
redis-cli -a PASSWORD INFO memory | grep used_memory_human

# Check keys count
redis-cli -a PASSWORD DBSIZE

# Clear completed jobs (older than 24h)
redis-cli -a PASSWORD --scan --pattern 'bull:*:completed' | xargs redis-cli -a PASSWORD DEL
```

**Prevention:**
- Set `maxmemory 256mb` di config
- Use `allkeys-lru` eviction policy
- Clean old completed jobs regularly

---

## Rollback

Jika ada masalah:

```bash
# 1. Restore Upstash URL
nano .env
# Change back to: REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"

# 2. Restart PM2
pm2 restart all

# 3. Verify
pm2 logs --lines 50
```

Tidak ada perubahan kode — rollback hanya butuh update `.env` dan restart.

---

## Maintenance Scripts

```bash
# Monitor Redis health
bash scripts/monitor-redis.sh

# Show all BullMQ queues
redis-cli -a PASSWORD KEYS 'bull:*:id' | sed 's/:id$//'

# Clear all completed jobs (cleanup)
redis-cli -a PASSWORD --scan --pattern 'bull:*:completed' | xargs redis-cli -a PASSWORD DEL

# Backup Redis data
redis-cli -a PASSWORD --rdb /tmp/redis-backup.rdb

# Monitor in real-time
redis-cli -a PASSWORD MONITOR
```

---

**Estimasi waktu:** 15–20 menit (automated) | 30–40 menit (manual)

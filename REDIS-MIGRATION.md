# 🚀 Quick Start: Redis Migration

Migrate dari Upstash ke self-hosted Redis di VPS dalam **15 menit**.

---

## 📋 Prerequisites

✅ SSH access ke VPS  
✅ VPS sudah running API + Workers (PM2)  
✅ Ubuntu/Debian OS

---

## ⚡ Quick Steps

### 1️⃣ **Copy Setup Script ke VPS**

```bash
# Dari local machine
scp scripts/setup-redis-vps.sh user@your-vps-ip:~/
```

### 2️⃣ **SSH ke VPS**

```bash
ssh user@your-vps-ip
```

### 3️⃣ **Run Automated Setup**

```bash
bash setup-redis-vps.sh
```

**Output:**
```
🚀 Setting up Redis on VPS...
📦 Installing Redis...
✅ Redis installed
🔐 Redis password: abc123xyz789...
⚙️  Configuring Redis...
🔄 Restarting Redis...
🧪 Testing Redis connection...
✅ Redis is running and accessible!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Next steps:

1. Update .env file with:
   REDIS_URL="redis://:abc123xyz789...@127.0.0.1:6379"

2. Restart PM2:
   pm2 restart all
   pm2 logs --lines 50

3. Verify queues:
   redis-cli -a 'abc123xyz789...' KEYS 'bull:*'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4️⃣ **Update `.env`**

```bash
# Navigate to project directory
cd /path/to/finetune-agent

# Backup current .env
cp .env .env.upstash.backup

# Edit .env
nano .env
```

**Change:**
```env
# BEFORE
REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"

# AFTER (use password from step 3)
REDIS_URL="redis://:YOUR_GENERATED_PASSWORD@127.0.0.1:6379"
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

### 5️⃣ **Restart PM2**

```bash
pm2 restart all
pm2 list
```

**Expected:** All processes **online** (green status)

### 6️⃣ **Verify Migration**

```bash
# Check logs
pm2 logs --lines 50

# Should NOT see:
# ❌ "Connection timeout to Upstash"
# ❌ "Rate limit exceeded"

# Should see:
# ✅ "Connected to Redis"
# ✅ "Worker started"
```

**Monitor Redis:**
```bash
# Copy monitor script to VPS
scp scripts/monitor-redis.sh user@your-vps-ip:~/

# Run on VPS
bash monitor-redis.sh
```

**Output:**
```
📊 Redis Monitoring Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 Connection Status:
   ✅ Connected

💾 Memory Usage:
   used_memory_human: 12.45M
   maxmemory_human: 256M

📦 BullMQ Queues:
   📋 scrape-map
      Waiting:   2
      Active:    1
      Completed: 150
      Failed:    0
```

### 7️⃣ **Test End-to-End**

1. Open dashboard: `https://your-domain.com/dashboard`
2. Go to **Scrape Schedules**
3. Click **Run Now** on any schedule
4. Monitor: `pm2 logs workers --lines 50`
5. Verify: Job processed → Leads saved to DB

✅ **Success!** Redis migration complete!

---

## 🆘 Troubleshooting

### ❌ PM2 shows "errored" status

```bash
pm2 logs api --lines 100 | grep -i redis
pm2 logs workers --lines 100 | grep -i redis
```

**Fix:** Check `.env` password format → restart PM2

---

### ❌ "NOAUTH Authentication required"

**Problem:** Password mismatch

```bash
# Test connection manually
redis-cli -a 'YOUR_PASSWORD' ping
# Should return: PONG

# If fails: check password in redis.conf
sudo cat /etc/redis/redis.conf | grep requirepass
```

---

### ❌ Jobs tidak diproses

```bash
# Check workers running
pm2 list | grep workers

# Check Redis queues
redis-cli -a 'PASSWORD' KEYS 'bull:*'

# Restart workers
pm2 restart workers
```

---

### 🔄 Rollback to Upstash

```bash
# Restore backup
cp .env.upstash.backup .env

# Restart
pm2 restart all
pm2 logs --lines 50
```

No code changes needed — instant rollback!

---

## 📊 Performance Comparison

| Metric | Upstash | Self-hosted |
|--------|---------|-------------|
| Latency | ~50-100ms | **< 1ms** |
| Rate limit | 10k/day | **Unlimited** |
| Cost | Free → $10/mo | **$0** |
| Control | Limited | **Full** |

---

## 📚 Full Documentation

- **Detailed Guide:** `docs/redis-migration.md`
- **Scripts Docs:** `scripts/README.md`
- **Troubleshooting:** `docs/redis-migration.md#troubleshooting`

---

## ✅ Success Checklist

- [ ] Redis installed & running
- [ ] Password generated & saved
- [ ] `.env` updated with local Redis URL
- [ ] PM2 restarted (all processes online)
- [ ] No Redis connection errors in logs
- [ ] BullMQ queues exist: `redis-cli -a PASSWORD KEYS 'bull:*'`
- [ ] Test job processed successfully
- [ ] No Upstash rate-limit errors

---

**Need help?** Check `docs/redis-migration.md` for detailed troubleshooting!

🎉 **Congratulations!** You're now running on self-hosted Redis with **zero rate limits** and **sub-millisecond latency**!

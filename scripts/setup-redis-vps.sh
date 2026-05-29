#!/bin/bash
set -e

# Script untuk setup Redis di VPS (Ubuntu/Debian)
# Run: bash scripts/setup-redis-vps.sh

echo "🚀 Setting up Redis on VPS..."
echo ""

# 1. Check if Redis is already installed
if command -v redis-server &> /dev/null; then
    echo "✅ Redis already installed"
    redis-server --version
else
    echo "📦 Installing Redis..."
    sudo apt update
    sudo apt install -y redis-server
    echo "✅ Redis installed"
fi

# 2. Generate strong password if not exists
REDIS_PASSWORD="${REDIS_PASSWORD:-$(openssl rand -base64 32)}"
echo ""
echo "🔐 Redis password: $REDIS_PASSWORD"
echo "(Save this! Add to .env as REDIS_URL)"
echo ""

# 3. Backup original config
if [ ! -f /etc/redis/redis.conf.backup ]; then
    echo "💾 Backing up original redis.conf..."
    sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup
fi

# 4. Configure Redis
echo "⚙️  Configuring Redis..."

sudo tee /etc/redis/redis.conf.custom > /dev/null <<EOF
# Bind to localhost only (no external access)
bind 127.0.0.1 ::1

# Set password
requirepass $REDIS_PASSWORD

# Memory limit (256MB - adjust based on VPS RAM)
maxmemory 256mb
maxmemory-policy allkeys-lru

# Run as daemon
daemonize yes

# Persistence (save every 60s if at least 1 key changed)
save 60 1
save 300 100
save 900 1000

# Log
loglevel notice
logfile /var/log/redis/redis-server.log

# Database file
dir /var/lib/redis
dbfilename dump.rdb

# Append-only file (for durability)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
EOF

# 5. Apply config
echo "📝 Applying Redis config..."
sudo cp /etc/redis/redis.conf.custom /etc/redis/redis.conf

# 6. Restart Redis
echo "🔄 Restarting Redis..."
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# 7. Wait for Redis to start
sleep 2

# 8. Test connection
echo ""
echo "🧪 Testing Redis connection..."
if redis-cli -a "$REDIS_PASSWORD" ping | grep -q PONG; then
    echo "✅ Redis is running and accessible!"
else
    echo "❌ Redis connection failed"
    exit 1
fi

# 9. Show Redis info
echo ""
echo "📊 Redis Info:"
redis-cli -a "$REDIS_PASSWORD" INFO server | grep -E "redis_version|os|arch|process_id|uptime_in_seconds"

echo ""
echo "📊 Memory Usage:"
redis-cli -a "$REDIS_PASSWORD" INFO memory | grep -E "used_memory_human|maxmemory_human"

# 10. Print next steps
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Redis setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Update .env file with:"
echo "   REDIS_URL=\"redis://:$REDIS_PASSWORD@127.0.0.1:6379\""
echo ""
echo "2. Restart PM2:"
echo "   pm2 restart all"
echo "   pm2 logs --lines 50"
echo ""
echo "3. Verify queues:"
echo "   redis-cli -a '$REDIS_PASSWORD' KEYS 'bull:*'"
echo ""
echo "4. Test a scrape job from dashboard"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

#!/bin/bash

# Monitor Redis health and BullMQ queues
# Run: bash scripts/monitor-redis.sh

# Get password from .env
REDIS_PASSWORD=$(grep "REDIS_URL" .env 2>/dev/null | sed -n 's/.*:\/\/:\([^@]*\)@.*/\1/p')

if [ -z "$REDIS_PASSWORD" ]; then
    echo "❌ Cannot find REDIS_URL in .env"
    echo "Using default connection (no password)..."
    REDIS_CLI="redis-cli"
else
    REDIS_CLI="redis-cli -a $REDIS_PASSWORD"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Redis Monitoring Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Connection test
echo "🔌 Connection Status:"
if $REDIS_CLI ping 2>&1 | grep -q PONG; then
    echo "   ✅ Connected"
else
    echo "   ❌ Connection failed"
    exit 1
fi
echo ""

# 2. Server info
echo "🖥️  Server Info:"
$REDIS_CLI INFO server 2>/dev/null | grep -E "redis_version|uptime_in_days" | sed 's/^/   /'
echo ""

# 3. Memory usage
echo "💾 Memory Usage:"
$REDIS_CLI INFO memory 2>/dev/null | grep -E "used_memory_human|maxmemory_human|mem_fragmentation_ratio" | sed 's/^/   /'
echo ""

# 4. Stats
echo "📈 Stats:"
$REDIS_CLI INFO stats 2>/dev/null | grep -E "total_connections_received|total_commands_processed|instantaneous_ops_per_sec" | sed 's/^/   /'
echo ""

# 5. BullMQ Queues
echo "📦 BullMQ Queues:"
QUEUES=$($REDIS_CLI KEYS 'bull:*:id' 2>/dev/null | sed 's/:id$//' | sort -u)

if [ -z "$QUEUES" ]; then
    echo "   ⚠️  No queues found"
else
    for queue in $QUEUES; do
        QUEUE_NAME=$(echo $queue | sed 's/bull://')

        # Get queue counts
        WAITING=$($REDIS_CLI LLEN "$queue:wait" 2>/dev/null || echo 0)
        ACTIVE=$($REDIS_CLI LLEN "$queue:active" 2>/dev/null || echo 0)
        COMPLETED=$($REDIS_CLI LLEN "$queue:completed" 2>/dev/null || echo 0)
        FAILED=$($REDIS_CLI LLEN "$queue:failed" 2>/dev/null || echo 0)

        echo ""
        echo "   📋 $QUEUE_NAME"
        echo "      Waiting:   $WAITING"
        echo "      Active:    $ACTIVE"
        echo "      Completed: $COMPLETED"
        echo "      Failed:    $FAILED"
    done
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Useful commands:"
echo "   Monitor in real-time:  redis-cli -a 'PASSWORD' MONITOR"
echo "   Clear failed jobs:     redis-cli -a 'PASSWORD' DEL 'bull:QUEUE_NAME:failed'"
echo "   View all keys:         redis-cli -a 'PASSWORD' KEYS '*'"
echo ""

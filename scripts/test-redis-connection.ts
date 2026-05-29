/**
 * Test Redis connection
 * Run: pnpm dotenv -e .env -- tsx scripts/test-redis-connection.ts
 */

import { Redis } from 'ioredis';

async function main() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  console.log('🔌 Testing Redis connection...');
  console.log(`   URL: ${redisUrl.replace(/:[^:@]+@/, ':***@')}\n`);

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.error('❌ Max retries reached');
        return null;
      }
      const delay = Math.min(times * 50, 2000);
      console.log(`   Retry ${times}/3 in ${delay}ms...`);
      return delay;
    },
  });

  try {
    // 1. Ping
    console.log('1️⃣  Testing PING...');
    const pong = await redis.ping();
    console.log(`   ✅ ${pong}\n`);

    // 2. Set/Get
    console.log('2️⃣  Testing SET/GET...');
    await redis.set('test:connection', 'success', 'EX', 10);
    const value = await redis.get('test:connection');
    console.log(`   ✅ Value: ${value}\n`);

    // 3. Server info
    console.log('3️⃣  Server Info:');
    const info = await redis.info('server');
    const lines = info.split('\n');
    const version = lines.find((l) => l.startsWith('redis_version:'));
    const uptime = lines.find((l) => l.startsWith('uptime_in_days:'));
    console.log(`   ${version}`);
    console.log(`   ${uptime}\n`);

    // 4. Memory
    console.log('4️⃣  Memory Usage:');
    const memInfo = await redis.info('memory');
    const memLines = memInfo.split('\n');
    const usedMem = memLines.find((l) => l.startsWith('used_memory_human:'));
    const maxMem = memLines.find((l) => l.startsWith('maxmemory_human:'));
    console.log(`   ${usedMem}`);
    console.log(`   ${maxMem}\n`);

    // 5. BullMQ queues
    console.log('5️⃣  BullMQ Queues:');
    const queueKeys = await redis.keys('bull:*:id');
    if (queueKeys.length === 0) {
      console.log('   ⚠️  No queues found (expected if no jobs created yet)\n');
    } else {
      const queueNames = queueKeys.map((k) => k.replace(/^bull:/, '').replace(/:id$/, ''));
      console.log(`   Found ${queueNames.length} queues:`);
      for (const name of queueNames) {
        const waiting = await redis.llen(`bull:${name}:wait`);
        const active = await redis.llen(`bull:${name}:active`);
        const completed = await redis.llen(`bull:${name}:completed`);
        const failed = await redis.llen(`bull:${name}:failed`);
        console.log(`   📋 ${name}`);
        console.log(`      Wait: ${waiting} | Active: ${active} | Done: ${completed} | Failed: ${failed}`);
      }
      console.log('');
    }

    // 6. Cleanup
    await redis.del('test:connection');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tests passed! Redis connection working.\n');

    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Connection failed:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check REDIS_URL in .env');
    console.error('  2. Verify Redis is running:');
    console.error('     - Local: redis-cli ping');
    console.error('     - VPS: ssh user@vps redis-cli -a PASSWORD ping');
    console.error('  3. Check firewall/network connectivity');
    console.error('  4. Verify password in redis.conf\n');
    process.exit(1);
  } finally {
    redis.disconnect();
  }
}

main();

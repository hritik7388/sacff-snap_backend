import Redis from 'ioredis';

async function testRedis() {
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  });

  redis.on('connect', () => console.log('✅ Connected to Redis'));
  redis.on('error', (err) => console.error('❌ Redis Error:', err));

  try {
    await redis.set('test', 'Redis is working!');
    const val = await redis.get('test');
    console.log('🔹 Redis test value:', val); // should print "Redis is working!"
  } catch (err) {
    console.error('❌ Redis operation failed:', err);
  } finally {
    redis.disconnect();
  }
}

testRedis();

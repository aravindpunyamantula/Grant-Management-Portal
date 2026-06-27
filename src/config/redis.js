const Redis = require('ioredis');

let redisClient;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Redis error:', err.message);
      }
    });
  }
  return redisClient;
};

const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

module.exports = { getRedisClient, closeRedis };

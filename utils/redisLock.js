const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

class RedisLock {
    static async acquireLock(roomId, checkIn, checkOut, userId, ttl = 300) { // 5 minutes TTL
        const lockKey = `room:${roomId}:${checkIn}:${checkOut}`;
        const lockValue = userId;

        // Try to set the lock with NX (only if not exists)
        const acquired = await redis.set(lockKey, lockValue, 'NX', 'EX', ttl);
        return acquired === 'OK';
    }

    static async releaseLock(roomId, checkIn, checkOut, userId) {
        const lockKey = `room:${roomId}:${checkIn}:${checkOut}`;
        const currentValue = await redis.get(lockKey);

        // Only release if the lock belongs to this user
        if (currentValue === userId) {
            await redis.del(lockKey);
            return true;
        }
        return false;
    }

    static async isLocked(roomId, checkIn, checkOut) {
        const lockKey = `room:${roomId}:${checkIn}:${checkOut}`;
        return await redis.exists(lockKey) === 1;
    }
}

module.exports = RedisLock; 
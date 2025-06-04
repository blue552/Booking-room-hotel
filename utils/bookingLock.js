const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

class BookingLock {
    constructor() {
        this.defaultTTL = 300; // 5 minutes
        this.retryAttempts = 3;
        this.retryDelay = 100; // 100ms
    }

    /**
     * ADVANCED METHODS (New Features)
     */

    async acquireLockWithRetry(roomId, checkIn, checkOut, userId, ttl = this.defaultTTL) {
        const lockKey = this.generateLockKey(roomId, checkIn, checkOut);
        const lockId = this.generateLockId(userId);

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const luaScript = `
                    local lockKey = KEYS[1]
                    local lockValue = ARGV[1]
                    local ttl = ARGV[2]
                    
                    if redis.call('EXISTS', lockKey) == 0 then
                        redis.call('SET', lockKey, lockValue, 'EX', ttl)
                        return 'OK'
                    else
                        local currentValue = redis.call('GET', lockKey)
                        local ttlRemaining = redis.call('TTL', lockKey)
                        return currentValue .. '|' .. ttlRemaining
                    end
                `;

                const result = await redis.eval(luaScript, 1, lockKey, lockId, ttl);

                if (result === 'OK') {
                    return {
                        success: true,
                        lockId: lockId,
                        lockKey: lockKey
                    };
                } else {
                    const [currentUserId, ttlRemaining] = result.split('|');

                    if (currentUserId === lockId) {
                        await redis.expire(lockKey, ttl);
                        return {
                            success: true,
                            lockId: lockId,
                            lockKey: lockKey,
                            extended: true
                        };
                    }

                    if (attempt < this.retryAttempts) {
                        await this.sleep(this.retryDelay * attempt);
                        continue;
                    }

                    return {
                        success: false,
                        error: `Room is currently being booked by another user. Please try again in ${ttlRemaining} seconds.`,
                        retryAfter: ttlRemaining
                    };
                }
            } catch (error) {
                if (attempt === this.retryAttempts) {
                    return {
                        success: false,
                        error: `Failed to acquire lock: ${error.message}`
                    };
                }
                await this.sleep(this.retryDelay * attempt);
            }
        }
    }

    async releaseLockAdvanced(lockKey, lockId) {
        const luaScript = `
            local lockKey = KEYS[1]
            local lockValue = ARGV[1]
            
            local currentValue = redis.call('GET', lockKey)
            if currentValue == lockValue then
                redis.call('DEL', lockKey)
                return 1
            else
                return 0
            end
        `;

        const result = await redis.eval(luaScript, 1, lockKey, lockId);
        return result === 1;
    }

    async getLockStatus(roomId, checkIn, checkOut) {
        const lockKey = this.generateLockKey(roomId, checkIn, checkOut);
        const lockValue = await redis.get(lockKey);
        const ttl = await redis.ttl(lockKey);

        if (!lockValue) {
            return {
                locked: false,
                available: true
            };
        }

        return {
            locked: true,
            available: false,
            lockedBy: lockValue,
            expiresIn: ttl
        };
    }

    async enqueueBookingRequest(roomId, checkIn, checkOut, userId, bookingData) {
        const queueKey = `booking_queue:${roomId}:${checkIn}:${checkOut}`;
        const requestId = `${userId}:${Date.now()}`;

        const request = {
            id: requestId,
            userId,
            roomId,
            checkIn,
            checkOut,
            ...bookingData,
            timestamp: new Date().toISOString()
        };

        await redis.lpush(queueKey, JSON.stringify(request));
        await redis.expire(queueKey, 3600);

        return {
            requestId,
            queuePosition: await redis.llen(queueKey)
        };
    }

    async processBookingQueue(roomId, checkIn, checkOut) {
        const queueKey = `booking_queue:${roomId}:${checkIn}:${checkOut}`;

        while (true) {
            const requestData = await redis.rpop(queueKey);
            if (!requestData) break;

            const request = JSON.parse(requestData);

            try {
                const result = await this.processBookingWithLock(request);

                await redis.publish(`booking_result:${request.userId}`, JSON.stringify({
                    requestId: request.id,
                    success: result.success,
                    booking: result.booking,
                    error: result.error
                }));

                if (result.success) {
                    await redis.del(queueKey);
                    break;
                }
            } catch (error) {
                console.error('Error processing booking request:', error);
            }
        }
    }

    async processBookingWithLock(bookingData) {
        const { roomId, checkIn, checkOut, userId } = bookingData;

        const lockResult = await this.acquireLockWithRetry(roomId, checkIn, checkOut, userId);

        if (!lockResult.success) {
            return {
                success: false,
                error: lockResult.error
            };
        }

        try {
            // Double-check room availability
            const roomService = require('../room-service/roomService');
            const isAvailable = await roomService.checkAvailability(roomId, checkIn, checkOut);

            if (!isAvailable) {
                return {
                    success: false,
                    error: 'Room is no longer available'
                };
            }

            // Create booking
            const bookingService = require('../booking-service/bookingService');
            const booking = await bookingService.createBooking(bookingData);

            return {
                success: true,
                booking
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        } finally {
            await this.releaseLockAdvanced(lockResult.lockKey, lockResult.lockId);
        }
    }

    /**
     * BACKWARD COMPATIBILITY METHODS (Static Interface)
     * Để tương thích với code cũ sử dụng RedisLock
     */

    static async acquireLock(roomId, checkIn, checkOut, userId, ttl = 300) {
        const instance = new BookingLock();
        const lockKey = instance.generateLockKey(roomId, checkIn, checkOut);
        const lockValue = userId;

        // Simple SET NX EX như version cũ
        const acquired = await redis.set(lockKey, lockValue, 'NX', 'EX', ttl);
        return acquired === 'OK';
    }

    static async releaseLock(roomId, checkIn, checkOut, userId) {
        const instance = new BookingLock();
        const lockKey = instance.generateLockKey(roomId, checkIn, checkOut);
        const currentValue = await redis.get(lockKey);

        if (currentValue === userId) {
            await redis.del(lockKey);
            return true;
        }
        return false;
    }

    static async isLocked(roomId, checkIn, checkOut) {
        const instance = new BookingLock();
        const lockKey = instance.generateLockKey(roomId, checkIn, checkOut);
        return await redis.exists(lockKey) === 1;
    }

    /**
     * HELPER METHODS
     */

    generateLockKey(roomId, checkIn, checkOut) {
        return `booking_lock:${roomId}:${checkIn}:${checkOut}`;
    }

    generateLockId(userId) {
        return `${userId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export both instance and class for flexibility
const bookingLockInstance = new BookingLock();

module.exports = BookingLock;
module.exports.instance = bookingLockInstance;

// For backward compatibility, export static methods directly
module.exports.acquireLock = BookingLock.acquireLock;
module.exports.releaseLock = BookingLock.releaseLock;
module.exports.isLocked = BookingLock.isLocked; 
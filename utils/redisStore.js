const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

class RedisStore {
    // Room operations
    static async getRoom(roomId) {
        const room = await redis.get(`room:${roomId}`);
        return room ? JSON.parse(room) : null;
    }

    static async setRoom(roomId, roomData) {
        await redis.set(`room:${roomId}`, JSON.stringify(roomData));
    }

    static async getAllRooms() {
        const keys = await redis.keys('room:*');
        if (keys.length === 0) return [];

        const rooms = await redis.mget(keys);
        return rooms.map(room => JSON.parse(room));
    }

    // Booking operations
    static async createBooking(bookingData) {
        const bookingId = Date.now().toString();
        const booking = {
            id: bookingId,
            ...bookingData,
            createdAt: new Date().toISOString()
        };

        await redis.set(`booking:${bookingId}`, JSON.stringify(booking));

        // Add to user's bookings
        await redis.lpush(`user:${bookingData.userId}:bookings`, bookingId);

        // Add to room's bookings
        await redis.lpush(`room:${bookingData.roomId}:bookings`, bookingId);

        return booking;
    }

    static async getBooking(bookingId) {
        const booking = await redis.get(`booking:${bookingId}`);
        return booking ? JSON.parse(booking) : null;
    }

    static async getUserBookings(userId) {
        const bookingIds = await redis.lrange(`user:${userId}:bookings`, 0, -1);
        if (bookingIds.length === 0) return [];

        const bookings = await redis.mget(bookingIds.map(id => `booking:${id}`));
        return bookings.map(booking => JSON.parse(booking));
    }

    static async getRoomBookings(roomId) {
        const bookingIds = await redis.lrange(`room:${roomId}:bookings`, 0, -1);
        if (bookingIds.length === 0) return [];

        const bookings = await redis.mget(bookingIds.map(id => `booking:${id}`));
        return bookings.map(booking => JSON.parse(booking));
    }

    static async updateBooking(bookingId, updateData) {
        const booking = await this.getBooking(bookingId);
        if (!booking) return null;

        const updatedBooking = {
            ...booking,
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        await redis.set(`booking:${bookingId}`, JSON.stringify(updatedBooking));
        return updatedBooking;
    }

    static async deleteBooking(bookingId) {
        const booking = await this.getBooking(bookingId);
        if (!booking) return false;

        await redis.del(`booking:${bookingId}`);
        await redis.lrem(`user:${booking.userId}:bookings`, 0, bookingId);
        await redis.lrem(`room:${booking.roomId}:bookings`, 0, bookingId);

        return true;
    }

    // Check room availability
    static async isRoomAvailable(roomId, checkIn, checkOut) {
        const bookings = await this.getRoomBookings(roomId);
        return !bookings.some(booking => {
            if (booking.status === 'cancelled') return false;
            return (
                (new Date(booking.checkIn) <= new Date(checkOut) &&
                    new Date(booking.checkOut) >= new Date(checkIn))
            );
        });
    }
}

module.exports = RedisStore; 
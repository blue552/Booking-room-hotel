const axios = require('axios');
const Booking = require('./Booking');

class BookingService {
    constructor() {
        this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://user_service:3001';
        this.roomServiceUrl = process.env.ROOM_SERVICE_URL || 'http://room_service:3002';
    }

    // Get user data from user-service
    async getUserById(userId) {
        try {
            const response = await axios.get(`${this.userServiceUrl}/users/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user:', error.message);
            return null;
        }
    }

    // Get room data from room-service
    async getRoomById(roomId) {
        try {
            const response = await axios.get(`${this.roomServiceUrl}/rooms/${roomId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching room:', error.message);
            return null;
        }
    }

    // Create booking with validation
    async createBooking(bookingData) {
        const { roomId, userId } = bookingData;

        // Validate user exists
        const user = await this.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Validate room exists and is available
        const room = await this.getRoomById(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        if (room.status !== 'available') {
            throw new Error('Room is not available');
        }

        // Calculate total price
        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const totalPrice = room.price * nights;

        // Create booking
        const booking = await Booking.create({
            ...bookingData,
            totalPrice
        });

        return booking;
    }

    // Get booking with user and room details
    async getBookingWithDetails(bookingId) {
        const booking = await Booking.findByPk(bookingId);
        if (!booking) {
            return null;
        }

        // Fetch related data from other services
        const [user, room] = await Promise.all([
            this.getUserById(booking.userId),
            this.getRoomById(booking.roomId)
        ]);

        return {
            ...booking.toJSON(),
            user,
            room
        };
    }

    // Get all bookings for a user
    async getUserBookings(userId) {
        const bookings = await Booking.findAll({
            where: { userId }
        });

        // Add room details to each booking
        const bookingsWithDetails = await Promise.all(
            bookings.map(async (booking) => {
                const room = await this.getRoomById(booking.roomId);
                return {
                    ...booking.toJSON(),
                    room
                };
            })
        );

        return bookingsWithDetails;
    }
}

module.exports = new BookingService(); 
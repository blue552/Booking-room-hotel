const axios = require('axios');
const Booking = require('./Booking');
const { Op } = require('sequelize');

class EnhancedBookingService {
    constructor() {
        this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3000';
        this.roomServiceUrl = process.env.ROOM_SERVICE_URL || 'http://localhost:3002';
        this.paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
        this.autoConfirmDelay = parseInt(process.env.AUTO_CONFIRM_DELAY || '300000'); // 5 minutes default
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

    // Create booking with enhanced workflow
    async createBooking(bookingData) {
        const { roomId, userId, autoConfirm = false, paymentMethod = 'cash' } = bookingData;

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

        // Determine initial status based on payment method and auto-confirm settings
        let initialStatus = 'pending';
        let paymentStatus = 'pending';

        // For cash payment or trusted users, auto-confirm
        if (autoConfirm || paymentMethod === 'cash' || user.trustLevel === 'high') {
            initialStatus = 'confirmed';
            paymentStatus = 'paid';
        }

        // Create booking
        const booking = await Booking.create({
            ...bookingData,
            totalPrice,
            status: initialStatus,
            autoConfirm,
            paymentMethod,
            paymentStatus,
            statusUpdatedAt: new Date()
        });

        // If auto-confirm is enabled but status is still pending, schedule confirmation
        if (autoConfirm && initialStatus === 'pending') {
            this.scheduleAutoConfirm(booking.id);
        }

        // Update room status if booking is confirmed
        if (initialStatus === 'confirmed') {
            try {
                await this.updateRoomStatus(roomId, 'occupied');
            } catch (error) {
                console.error('Failed to update room status:', error);
            }
        }

        console.log(`📅 Booking created: ID ${booking.id}, Status: ${initialStatus}, Auto-confirm: ${autoConfirm}`);

        return booking;
    }

    // Schedule auto-confirmation after delay
    scheduleAutoConfirm(bookingId) {
        setTimeout(async () => {
            try {
                await this.autoConfirmBooking(bookingId);
            } catch (error) {
                console.error(`Failed to auto-confirm booking ${bookingId}:`, error);
            }
        }, this.autoConfirmDelay);

        console.log(`⏰ Auto-confirm scheduled for booking ${bookingId} in ${this.autoConfirmDelay / 1000} seconds`);
    }

    // Auto-confirm booking
    async autoConfirmBooking(bookingId) {
        const booking = await Booking.findByPk(bookingId);

        if (!booking) {
            console.log(`❌ Booking ${bookingId} not found for auto-confirm`);
            return;
        }

        if (booking.status !== 'pending') {
            console.log(`ℹ️ Booking ${bookingId} status is ${booking.status}, skipping auto-confirm`);
            return;
        }

        // Auto-confirm the booking
        await booking.update({
            status: 'confirmed',
            paymentStatus: 'paid',
            statusUpdatedAt: new Date(),
            adminNote: 'Auto-confirmed after delay'
        });

        // Update room status
        try {
            await this.updateRoomStatus(booking.roomId, 'occupied');
        } catch (error) {
            console.error('Failed to update room status during auto-confirm:', error);
        }

        console.log(`✅ Booking ${bookingId} auto-confirmed successfully`);

        // Send notification to user (in real app)
        this.sendBookingNotification(bookingId, 'confirmed');
    }

    // Manual confirmation by admin
    async confirmBooking(bookingId, adminId, note = '') {
        const booking = await Booking.findByPk(bookingId);

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.status === 'confirmed') {
            throw new Error('Booking is already confirmed');
        }

        if (booking.status === 'cancelled') {
            throw new Error('Cannot confirm cancelled booking');
        }

        await booking.update({
            status: 'confirmed',
            paymentStatus: 'paid',
            statusUpdatedAt: new Date(),
            statusUpdatedBy: adminId,
            adminNote: note || 'Manually confirmed by admin'
        });

        // Update room status
        try {
            await this.updateRoomStatus(booking.roomId, 'occupied');
        } catch (error) {
            console.error('Failed to update room status:', error);
        }

        console.log(`👩‍💼 Booking ${bookingId} manually confirmed by admin ${adminId}`);
        return booking;
    }

    // Cancel booking
    async cancelBooking(bookingId, reason = '', cancelledBy = null) {
        const booking = await Booking.findByPk(bookingId);

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.status === 'completed') {
            throw new Error('Cannot cancel completed booking');
        }

        await booking.update({
            status: 'cancelled',
            statusUpdatedAt: new Date(),
            statusUpdatedBy: cancelledBy,
            adminNote: reason || 'Booking cancelled'
        });

        // Make room available
        try {
            await this.updateRoomStatus(booking.roomId, 'available');
        } catch (error) {
            console.error('Failed to update room status:', error);
        }

        console.log(`❌ Booking ${bookingId} cancelled: ${reason}`);
        return booking;
    }

    // Complete booking (check-out)
    async completeBooking(bookingId, adminId = null) {
        const booking = await Booking.findByPk(bookingId);

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.status !== 'confirmed') {
            throw new Error('Only confirmed bookings can be completed');
        }

        await booking.update({
            status: 'completed',
            statusUpdatedAt: new Date(),
            statusUpdatedBy: adminId,
            adminNote: 'Check-out completed'
        });

        // Make room available
        try {
            await this.updateRoomStatus(booking.roomId, 'available');
        } catch (error) {
            console.error('Failed to update room status:', error);
        }

        console.log(`✅ Booking ${bookingId} completed successfully`);
        return booking;
    }

    // Update room status
    async updateRoomStatus(roomId, status) {
        try {
            await axios.patch(`${this.roomServiceUrl}/rooms/${roomId}`, {
                status
            });
            console.log(`🏠 Room ${roomId} status updated to: ${status}`);
        } catch (error) {
            console.error(`Failed to update room ${roomId} status:`, error.message);
            throw error;
        }
    }

    // Send booking notification
    async sendBookingNotification(bookingId, event) {
        try {
            // In real app, integrate with email/SMS service
            console.log(`📧 Notification sent for booking ${bookingId}: ${event}`);
        } catch (error) {
            console.error('Failed to send notification:', error);
        }
    }

    // Get booking with details
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

    // Get user bookings
    async getUserBookings(userId) {
        const bookings = await Booking.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });

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

    // Get pending bookings for admin review
    async getPendingBookings() {
        const bookings = await Booking.findAll({
            where: {
                status: 'pending',
                createdAt: {
                    [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            },
            order: [['createdAt', 'ASC']]
        });

        return bookings;
    }

    // Process expired pending bookings
    async processExpiredBookings() {
        const expiredTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

        const expiredBookings = await Booking.findAll({
            where: {
                status: 'pending',
                autoConfirm: false,
                createdAt: {
                    [Op.lt]: expiredTime
                }
            }
        });

        for (const booking of expiredBookings) {
            await this.cancelBooking(booking.id, 'Expired - no confirmation within time limit', null);
        }

        console.log(`🧹 Processed ${expiredBookings.length} expired bookings`);
        return expiredBookings.length;
    }
}

module.exports = new EnhancedBookingService(); 
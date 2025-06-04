const amqp = require('amqplib');
const { Booking, Room } = require('../models');
const BookingLock = require('./bookingLock');

class BookingQueue {
    static async initialize() {
        this.connection = await amqp.connect(process.env.RABBITMQ_URL);
        this.channel = await this.connection.createChannel();

        // Create queues
        await this.channel.assertQueue('booking_requests', { durable: true });
        await this.channel.assertQueue('booking_results', { durable: true });

        // Start consuming booking requests
        this.channel.consume('booking_requests', async (msg) => {
            if (msg !== null) {
                const bookingData = JSON.parse(msg.content.toString());
                try {
                    await this.processBooking(bookingData);
                    this.channel.ack(msg);
                } catch (error) {
                    console.error('Error processing booking:', error);
                    // Requeue the message if processing fails
                    this.channel.nack(msg, false, true);
                }
            }
        });
    }

    static async processBooking(bookingData) {
        const { roomId, checkIn, checkOut, userId, guests, specialRequests } = bookingData;

        // Try to acquire lock
        const lockAcquired = await BookingLock.acquireLock(roomId, checkIn, checkOut, userId);
        if (!lockAcquired) {
            throw new Error('Room is currently being booked by another user');
        }

        try {
            // Check room availability
            const room = await Room.findByPk(roomId);
            if (!room || room.status !== 'available') {
                throw new Error('Room is not available');
            }

            // Create booking
            const booking = await Booking.create({
                userId,
                roomId,
                checkIn,
                checkOut,
                guests,
                specialRequests,
                status: 'confirmed'
            });

            // Update room status
            await room.update({ status: 'booked' });

            // Send result to results queue
            this.channel.sendToQueue('booking_results', Buffer.from(JSON.stringify({
                success: true,
                bookingId: booking.id
            })));

        } finally {
            // Always release the lock
            await BookingLock.releaseLock(roomId, checkIn, checkOut, userId);
        }
    }

    static async addBookingRequest(bookingData) {
        await this.channel.sendToQueue('booking_requests',
            Buffer.from(JSON.stringify(bookingData)),
            { persistent: true }
        );
    }
}

module.exports = BookingQueue; 
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('./auth');
const validate = require('./validator');
const RedisStore = require('./utils/redisStore');
const RedisLock = require('./utils/redisLock');

// Validation rules
const bookingValidation = [
    body('roomId').isInt().withMessage('Room ID must be a number'),
    body('checkIn').isISO8601().withMessage('Invalid check-in date'),
    body('checkOut').isISO8601().withMessage('Invalid check-out date'),
    body('guests').isInt({ min: 1 }).withMessage('Number of guests must be at least 1'),
    validate
];

// POST create new booking
router.post('/', auth, bookingValidation, async (req, res, next) => {
    try {
        const { roomId, checkIn, checkOut, guests, specialRequests } = req.body;

        // Check if room is already locked
        const isLocked = await RedisLock.isLocked(roomId, checkIn, checkOut);
        if (isLocked) {
            return res.status(409).json({
                success: false,
                error: { message: 'Room is currently being booked by another user. Please try again in a few moments.' }
            });
        }

        // Check room availability
        const isAvailable = await RedisStore.isRoomAvailable(roomId, checkIn, checkOut);
        if (!isAvailable) {
            return res.status(400).json({
                success: false,
                error: { message: 'Room is not available for selected dates' }
            });
        }

        // Create booking
        const booking = await RedisStore.createBooking({
            userId: req.user.id,
            roomId,
            checkIn,
            checkOut,
            guests,
            specialRequests,
            status: 'confirmed'
        });

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        next(error);
    }
});

// GET user's bookings
router.get('/', auth, async (req, res, next) => {
    try {
        const bookings = await RedisStore.getUserBookings(req.user.id);
        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        next(error);
    }
});

// GET booking by ID
router.get('/:id', auth, async (req, res, next) => {
    try {
        const booking = await RedisStore.getBooking(req.params.id);
        if (!booking || booking.userId !== req.user.id) {
            return res.status(404).json({
                success: false,
                error: { message: 'Booking not found' }
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        next(error);
    }
});

// DELETE booking
router.delete('/:id', auth, async (req, res, next) => {
    try {
        const booking = await RedisStore.getBooking(req.params.id);
        if (!booking || booking.userId !== req.user.id) {
            return res.status(404).json({
                success: false,
                error: { message: 'Booking not found' }
            });
        }

        // Check if booking can be cancelled
        const checkInDate = new Date(booking.checkIn);
        const now = new Date();
        const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

        if (hoursUntilCheckIn < 24) {
            return res.status(400).json({
                success: false,
                error: { message: 'Cannot cancel booking less than 24 hours before check-in' }
            });
        }

        // Update booking status
        await RedisStore.updateBooking(req.params.id, { status: 'cancelled' });

        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router; 
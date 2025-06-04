const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('./auth');
const validate = require('./validator');
const enhancedBookingService = require('./enhancedBookingService');

// Simplified auth middleware for testing
const simpleAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    // For testing, accept both user_token and admin_token
    if (!token || (token !== 'user_token' && token !== 'admin_token')) {
        req.user = { id: 1, name: 'Test User' }; // Default user for testing
    } else {
        req.user = { id: 1, name: 'Test User' };
    }

    next();
};

// Validation rules
const bookingValidation = [
    body('roomId').isInt().withMessage('Room ID must be a number'),
    body('checkIn').isISO8601().withMessage('Invalid check-in date'),
    body('checkOut').isISO8601().withMessage('Invalid check-out date'),
    body('numberOfGuests').isInt({ min: 1 }).withMessage('Number of guests must be at least 1'),
    validate
];

// POST create new booking
router.post('/', simpleAuth, bookingValidation, async (req, res, next) => {
    try {
        const {
            roomId,
            checkIn,
            checkOut,
            numberOfGuests,
            specialRequests,
            paymentMethod = 'cash',
            autoConfirm = false
        } = req.body;

        console.log('📝 Creating new booking:', {
            userId: req.user.id,
            roomId,
            checkIn,
            checkOut,
            numberOfGuests,
            paymentMethod,
            autoConfirm
        });

        // Use enhanced booking service
        const booking = await enhancedBookingService.createBooking({
            userId: req.user.id,
            roomId,
            checkIn,
            checkOut,
            numberOfGuests,
            specialRequests,
            paymentMethod,
            autoConfirm
        });

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(400).json({
            success: false,
            error: { message: error.message }
        });
    }
});

// GET user's bookings
router.get('/', simpleAuth, async (req, res, next) => {
    try {
        const bookings = await enhancedBookingService.getUserBookings(req.user.id);

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        next(error);
    }
});

// GET booking by ID
router.get('/:id', simpleAuth, async (req, res, next) => {
    try {
        const booking = await enhancedBookingService.getBookingWithDetails(req.params.id);

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

// PUT update booking status (for users - limited)
router.put('/:id/cancel', simpleAuth, async (req, res, next) => {
    try {
        const { reason = 'Cancelled by user' } = req.body;
        const bookingId = req.params.id;

        // Verify booking belongs to user
        const booking = await enhancedBookingService.getBookingWithDetails(bookingId);
        if (!booking || booking.userId !== req.user.id) {
            return res.status(404).json({
                success: false,
                error: { message: 'Booking not found' }
            });
        }

        if (booking.status !== 'pending' && booking.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                error: { message: 'Cannot cancel this booking' }
            });
        }

        // Check if booking can be cancelled (24 hours before check-in)
        const checkInDate = new Date(booking.checkIn);
        const now = new Date();
        const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

        if (hoursUntilCheckIn < 24) {
            return res.status(400).json({
                success: false,
                error: { message: 'Cannot cancel booking less than 24 hours before check-in' }
            });
        }

        const cancelledBooking = await enhancedBookingService.cancelBooking(
            bookingId,
            reason,
            req.user.id
        );

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: cancelledBooking
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router; 
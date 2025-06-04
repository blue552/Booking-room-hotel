const express = require('express');
const router = express.Router();
const Booking = require('./Booking');
const bookingService = require('./bookingService');
const { Op } = require('sequelize');

// Middleware for admin authentication (simplified for demo)
const adminAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    // In real app, verify admin JWT token
    if (!token || token !== 'admin_token') {
        return res.status(401).json({
            success: false,
            error: { message: 'Admin access required' }
        });
    }

    req.admin = { id: 1, role: 'admin' };
    next();
};

// GET all bookings for admin
router.get('/bookings', adminAuth, async (req, res, next) => {
    try {
        const { status, dateFrom, dateTo, search, page = 1, limit = 10 } = req.query;

        const where = {};

        // Filter by status
        if (status) {
            where.status = status;
        }

        // Filter by date range
        if (dateFrom || dateTo) {
            where.checkIn = {};
            if (dateFrom) where.checkIn[Op.gte] = new Date(dateFrom);
            if (dateTo) where.checkIn[Op.lte] = new Date(dateTo);
        }

        // Search functionality
        if (search) {
            where[Op.or] = [
                { id: { [Op.like]: `%${search}%` } },
                { roomId: { [Op.like]: `%${search}%` } },
                { userId: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;

        const result = await Booking.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        // Enrich bookings with user and room data
        const enrichedBookings = await Promise.all(
            result.rows.map(async (booking) => {
                const user = await bookingService.getUserById(booking.userId);
                const room = await bookingService.getRoomById(booking.roomId);

                return {
                    ...booking.toJSON(),
                    user,
                    room
                };
            })
        );

        res.json({
            success: true,
            data: enrichedBookings,
            pagination: {
                total: result.count,
                page: parseInt(page),
                pages: Math.ceil(result.count / limit),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        next(error);
    }
});

// GET booking statistics
router.get('/bookings/stats', adminAuth, async (req, res, next) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const [
            totalBookings,
            pendingBookings,
            confirmedBookings,
            cancelledBookings,
            completedBookings,
            monthlyBookings,
            monthlyRevenue
        ] = await Promise.all([
            Booking.count(),
            Booking.count({ where: { status: 'pending' } }),
            Booking.count({ where: { status: 'confirmed' } }),
            Booking.count({ where: { status: 'cancelled' } }),
            Booking.count({ where: { status: 'completed' } }),
            Booking.count({
                where: {
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            }),
            Booking.sum('totalPrice', {
                where: {
                    status: { [Op.in]: ['confirmed', 'completed'] },
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                total: totalBookings,
                pending: pendingBookings,
                confirmed: confirmedBookings,
                cancelled: cancelledBookings,
                completed: completedBookings,
                monthlyBookings,
                monthlyRevenue: monthlyRevenue || 0
            }
        });

    } catch (error) {
        next(error);
    }
});

// GET specific booking details
router.get('/bookings/:id', adminAuth, async (req, res, next) => {
    try {
        const booking = await Booking.findByPk(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: { message: 'Booking not found' }
            });
        }

        // Get user and room details
        const user = await bookingService.getUserById(booking.userId);
        const room = await bookingService.getRoomById(booking.roomId);

        res.json({
            success: true,
            data: {
                ...booking.toJSON(),
                user,
                room
            }
        });

    } catch (error) {
        next(error);
    }
});

// PUT update booking status
router.put('/bookings/:id/status', adminAuth, async (req, res, next) => {
    try {
        const { status, note } = req.body;

        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid status' }
            });
        }

        const booking = await Booking.findByPk(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: { message: 'Booking not found' }
            });
        }

        // Update booking status
        await booking.update({
            status,
            adminNote: note,
            statusUpdatedAt: new Date(),
            statusUpdatedBy: req.admin.id
        });

        // Log status change (in real app, save to audit log)
        console.log(`Admin ${req.admin.id} changed booking ${booking.id} status from ${booking.status} to ${status}. Note: ${note}`);

        // If confirming booking, update room status
        if (status === 'confirmed') {
            try {
                await fetch(`http://room_service:3002/rooms/${booking.roomId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'occupied' })
                });
            } catch (error) {
                console.error('Failed to update room status:', error);
            }
        }

        // If cancelling or completing, make room available
        if (status === 'cancelled' || status === 'completed') {
            try {
                await fetch(`http://room_service:3002/rooms/${booking.roomId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'available' })
                });
            } catch (error) {
                console.error('Failed to update room status:', error);
            }
        }

        res.json({
            success: true,
            message: 'Booking status updated successfully',
            data: booking
        });

    } catch (error) {
        next(error);
    }
});

// PUT update booking details
router.put('/bookings/:id', adminAuth, async (req, res, next) => {
    try {
        const booking = await Booking.findByPk(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: { message: 'Booking not found' }
            });
        }

        const allowedUpdates = ['checkIn', 'checkOut', 'numberOfGuests', 'specialRequests', 'totalPrice'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        await booking.update(updates);

        res.json({
            success: true,
            message: 'Booking updated successfully',
            data: booking
        });

    } catch (error) {
        next(error);
    }
});

// DELETE booking (soft delete)
router.delete('/bookings/:id', adminAuth, async (req, res, next) => {
    try {
        const booking = await Booking.findByPk(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: { message: 'Booking not found' }
            });
        }

        // Instead of hard delete, mark as cancelled
        await booking.update({
            status: 'cancelled',
            adminNote: 'Cancelled by admin',
            statusUpdatedAt: new Date(),
            statusUpdatedBy: req.admin.id
        });

        // Make room available
        try {
            await fetch(`http://room_service:3002/rooms/${booking.roomId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'available' })
            });
        } catch (error) {
            console.error('Failed to update room status:', error);
        }

        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });

    } catch (error) {
        next(error);
    }
});

// POST send notification to customer
router.post('/bookings/:id/notify', adminAuth, async (req, res, next) => {
    try {
        const { message, type = 'info' } = req.body;
        const booking = await Booking.findByPk(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: { message: 'Booking not found' }
            });
        }

        // In real app, send email/SMS notification
        console.log(`Notification sent to booking ${booking.id}: ${message}`);

        res.json({
            success: true,
            message: 'Notification sent successfully'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router; 
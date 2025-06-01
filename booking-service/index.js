const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bookingRoutes = require('./bookingRoutes');
const { sequelize } = require('./database');

const app = express();
const PORT = process.env.BOOKING_SERVICE_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'Booking Service',
        status: 'healthy',
        port: PORT,
        timestamp: new Date().toISOString(),
        services: {
            userService: process.env.USER_SERVICE_URL || 'http://user-service:3001',
            roomService: process.env.ROOM_SERVICE_URL || 'http://room-service:3002'
        }
    });
});

// Routes
app.use('/bookings', bookingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Booking Service - Route not found'
    });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Booking Service: Database connected successfully');

        // Sync database models
        await sequelize.sync();
        console.log('✅ Booking Service: Database models synced');

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Booking Service running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 Connected to:`);
            console.log(`   User Service: ${process.env.USER_SERVICE_URL || 'http://user-service:3001'}`);
            console.log(`   Room Service: ${process.env.ROOM_SERVICE_URL || 'http://room-service:3002'}`);
        });
    } catch (error) {
        console.error('❌ Booking Service startup error:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app; 
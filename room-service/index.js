const express = require('express');
const cors = require('cors');
require('dotenv').config();

const roomRoutes = require('./roomRoutes');
const uploadRoutes = require('./upload');
const { sequelize } = require('./database');

const app = express();
const PORT = process.env.ROOM_SERVICE_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'Room Service',
        status: 'healthy',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/rooms', roomRoutes);
app.use('/upload', uploadRoutes);

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
        message: 'Room Service - Route not found'
    });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Room Service: Database connected successfully');

        // Sync database models
        await sequelize.sync();
        console.log('✅ Room Service: Database models synced');

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Room Service running on port ${PORT}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('❌ Room Service startup error:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app; 
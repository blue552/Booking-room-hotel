const express = require('express');
const cors = require('cors');
const userRoutes = require('./userRoutes');
const { testConnections } = require('./database');

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'user-service' });
});

// Routes - mount directly without /users prefix for API Gateway compatibility
app.use('/', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const startServer = async () => {
    try {
        await testConnections();
        app.listen(PORT, () => {
            console.log(`User service is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 
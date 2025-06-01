const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// Middleware
app.use(cors());

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/UI', express.static(path.join(__dirname, 'UI')));

// Health check endpoint (before proxy)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            userService: process.env.USER_SERVICE_URL || 'http://user-service:3001',
            roomService: process.env.ROOM_SERVICE_URL || 'http://room-service:3002',
            bookingService: process.env.BOOKING_SERVICE_URL || 'http://booking-service:3003'
        }
    });
});

// Proxy configurations
const userServiceProxy = createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://user-service:3001',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    parseReqBody: false,
    pathRewrite: {
        '^/services/user': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[User Service] ${req.method} ${req.originalUrl} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);

        if (req.get('content-type')) {
            proxyReq.setHeader('content-type', req.get('content-type'));
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[User Service Response] ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);

        if (proxyRes.statusCode >= 400) {
            console.log(`[User Service Error] Status: ${proxyRes.statusCode}`);
        }
    },
    onError: (err, req, res) => {
        console.error('User Service Proxy Error:', err.message);
        if (!res.headersSent) {
            res.status(503).json({
                success: false,
                message: 'User service temporarily unavailable',
                error: err.code || err.message
            });
        }
    }
});

const roomServiceProxy = createProxyMiddleware({
    target: process.env.ROOM_SERVICE_URL || 'http://room-service:3002',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    parseReqBody: false,
    pathRewrite: {
        '^/services/room': '/rooms',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Room Service] ${req.method} ${req.originalUrl} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);

        if (req.get('content-type')) {
            proxyReq.setHeader('content-type', req.get('content-type'));
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[Room Service Response] ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
        console.error('Room Service Proxy Error:', err.message);
        if (!res.headersSent) {
            res.status(503).json({ error: 'Room service unavailable' });
        }
    }
});

const bookingServiceProxy = createProxyMiddleware({
    target: process.env.BOOKING_SERVICE_URL || 'http://booking-service:3003',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    parseReqBody: false,
    pathRewrite: {
        '^/bookings': '/bookings',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Booking Service] ${req.method} ${req.originalUrl} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);

        if (req.get('content-type')) {
            proxyReq.setHeader('content-type', req.get('content-type'));
        }
    },
    onError: (err, req, res) => {
        console.error('Booking Service Proxy Error:', err.message);
        if (!res.headersSent) {
            res.status(503).json({ error: 'Booking service unavailable' });
        }
    }
});

// PROXY MIDDLEWARE - BEFORE ANY BODY PARSING
// Apply proxy middleware
app.use('/services/user', userServiceProxy);
app.use('/services/room', roomServiceProxy);
app.use('/bookings', bookingServiceProxy);

// Body parsing middleware ONLY for non-proxy routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Default route
app.get('/', (req, res) => {
    res.json({
        message: 'Room Booking API Gateway',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            userService: '/services/user',
            roomService: '/services/room',
            bookingService: '/bookings'
        },
        documentation: {
            users: {
                register: 'POST /services/user/register',
                login: 'POST /services/user/login',
                profile: 'GET /services/user/profile'
            },
            rooms: {
                list: 'GET /services/room',
                create: 'POST /services/room',
                details: 'GET /services/room/:id',
                update: 'PUT /services/room/:id',
                delete: 'DELETE /services/room/:id'
            },
            bookings: {
                list: 'GET /bookings',
                create: 'POST /bookings',
                details: 'GET /bookings/:id',
                update: 'PUT /bookings/:id',
                cancel: 'DELETE /bookings/:id'
            }
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🌟 API Gateway running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Services:`);
    console.log(`   User Service: ${process.env.USER_SERVICE_URL || 'http://user-service:3001'}`);
    console.log(`   Room Service: ${process.env.ROOM_SERVICE_URL || 'http://room-service:3002'}`);
    console.log(`   Booking Service: ${process.env.BOOKING_SERVICE_URL || 'http://booking-service:3003'}`);
});

module.exports = app; 
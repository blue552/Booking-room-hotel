const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || 'api-gateway-default';

// Middleware
app.use(cors());

// CATCH-ALL DEBUG MIDDLEWARE - VERY FIRST
app.use((req, res, next) => {
    console.log(`🌐 [${INSTANCE_ID}] INCOMING: ${req.method} ${req.originalUrl}`);
    next();
});

// Body parsing middleware MUST come BEFORE proxy middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to track route matching - MOVED TO TOP
app.use('/api/users', (req, res, next) => {
    console.log(`🎯 [${INSTANCE_ID}] Matched /api/users route: ${req.method} ${req.originalUrl}`);
    console.log(`🎯 [${INSTANCE_ID}] Path after /api/users: ${req.url}`);
    next();
});

app.use('/services/user', (req, res, next) => {
    console.log(`🎯 [${INSTANCE_ID}] Matched /services/user route: ${req.method} ${req.originalUrl}`);
    console.log(`🎯 [${INSTANCE_ID}] Path after /services/user: ${req.url}`);
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    req.startTime = startTime;

    console.log(`🚪 [${INSTANCE_ID}] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log(`📦 [${INSTANCE_ID}] Request body:`, req.body);
    console.log(`🛣️  [${INSTANCE_ID}] Original URL: ${req.originalUrl}`);
    console.log(`📍 [${INSTANCE_ID}] Headers:`, req.headers);

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`📤 [${INSTANCE_ID}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });

    next();
});

// Serve static files - COMMENTED OUT (directories don't exist)
// app.use('/assets', express.static(path.join(__dirname, 'assets')));
// app.use('/UI', express.static(path.join(__dirname, 'UI')));

// Health check endpoint (before proxy)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'api-gateway',
        instance: INSTANCE_ID,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            userService: process.env.USER_SERVICE_URL || 'http://user-service:3001',
            roomService: process.env.ROOM_SERVICE_URL || 'http://room-service:3002',
            bookingService: process.env.BOOKING_SERVICE_URL || 'http://booking-service:3003'
        },
        architecture: 'nginx-to-gateway-to-services'
    });
});

// Proxy configurations
const userServiceProxy = createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://user-service:3001',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
        '^/services/user': '',
        '^/api/users': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔀 [${INSTANCE_ID}] User Service: ${req.method} ${req.originalUrl} → ${proxyReq.getHeader('host')}${proxyReq.path}`);

        // Forward essential headers
        if (req.get('content-type')) {
            proxyReq.setHeader('content-type', req.get('content-type'));
        }
        if (req.get('authorization')) {
            proxyReq.setHeader('authorization', req.get('authorization'));
        }

        // Add tracing headers
        proxyReq.setHeader('X-Gateway-Instance', INSTANCE_ID);
        proxyReq.setHeader('X-Request-ID', req.get('X-Request-ID') || `req-${Date.now()}`);

        // Handle request body for POST/PUT requests
        if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
            const bodyData = JSON.stringify(req.body);
            console.log(`📦 [${INSTANCE_ID}] Forwarding body:`, bodyData);

            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ [${INSTANCE_ID}] User Service Response: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl} (${Date.now() - req.startTime}ms)`);

        // Add response headers for debugging
        res.setHeader('X-Proxied-By', `${INSTANCE_ID}-user-service`);
        res.setHeader('X-Service-Response-Time', Date.now() - req.startTime);

        if (proxyRes.statusCode >= 400) {
            console.log(`❌ [${INSTANCE_ID}] User Service Error: Status ${proxyRes.statusCode}`);
        }
    },
    onError: (err, req, res) => {
        console.error(`💥 [${INSTANCE_ID}] User Service Proxy Error:`, err.message);
        if (!res.headersSent) {
            res.status(503).json({
                success: false,
                message: 'User service temporarily unavailable',
                error: err.code || err.message,
                gateway: INSTANCE_ID
            });
        }
    }
});

const roomServiceProxy = createProxyMiddleware({
    target: process.env.ROOM_SERVICE_URL || 'http://room-service:3002',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
        '^/services/room': '/rooms',
        '^/api/rooms': '/rooms',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔀 [${INSTANCE_ID}] Room Service: ${req.method} ${req.originalUrl} → ${proxyReq.getHeader('host')}${proxyReq.path}`);

        if (req.get('content-type')) {
            proxyReq.setHeader('content-type', req.get('content-type'));
        }
        if (req.get('authorization')) {
            proxyReq.setHeader('authorization', req.get('authorization'));
        }

        proxyReq.setHeader('X-Gateway-Instance', INSTANCE_ID);
        proxyReq.setHeader('X-Request-ID', req.get('X-Request-ID') || `req-${Date.now()}`);

        // Handle request body for POST/PUT requests
        if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ [${INSTANCE_ID}] Room Service Response: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl} (${Date.now() - req.startTime}ms)`);

        res.setHeader('X-Proxied-By', `${INSTANCE_ID}-room-service`);
        res.setHeader('X-Service-Response-Time', Date.now() - req.startTime);
    },
    onError: (err, req, res) => {
        console.error(`💥 [${INSTANCE_ID}] Room Service Proxy Error:`, err.message);
        if (!res.headersSent) {
            res.status(503).json({
                success: false,
                message: 'Room service unavailable',
                error: err.code || err.message,
                gateway: INSTANCE_ID
            });
        }
    }
});

const bookingServiceProxy = createProxyMiddleware({
    target: process.env.BOOKING_SERVICE_URL || 'http://booking-service:3003',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
        '^/bookings': '/bookings',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔀 [${INSTANCE_ID}] Booking Service: ${req.method} ${req.originalUrl} → ${proxyReq.getHeader('host')}${proxyReq.path}`);

        if (req.get('content-type')) {
            proxyReq.setHeader('content-type', req.get('content-type'));
        }
        if (req.get('authorization')) {
            proxyReq.setHeader('authorization', req.get('authorization'));
        }

        proxyReq.setHeader('X-Gateway-Instance', INSTANCE_ID);
        proxyReq.setHeader('X-Request-ID', req.get('X-Request-ID') || `req-${Date.now()}`);

        // Handle request body for POST/PUT requests
        if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ [${INSTANCE_ID}] Booking Service Response: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl} (${Date.now() - req.startTime}ms)`);

        res.setHeader('X-Proxied-By', `${INSTANCE_ID}-booking-service`);
        res.setHeader('X-Service-Response-Time', Date.now() - req.startTime);
    },
    onError: (err, req, res) => {
        console.error(`💥 [${INSTANCE_ID}] Booking Service Proxy Error:`, err.message);
        if (!res.headersSent) {
            res.status(503).json({
                success: false,
                message: 'Booking service unavailable',
                error: err.code || err.message,
                gateway: INSTANCE_ID
            });
        }
    }
});

// PROXY MIDDLEWARE - Apply proxy middleware for both /api/ and /services/ routes
app.use('/services/user', userServiceProxy);
app.use('/api/users', userServiceProxy);
app.use('/services/room', roomServiceProxy);
app.use('/api/rooms', roomServiceProxy);
app.use('/bookings', bookingServiceProxy);
app.use('/api/bookings', bookingServiceProxy);

// Gateway stats endpoint (moved after proxy routes)
app.get('/gateway-stats', (req, res) => {
    res.json({
        gateway: {
            instance: INSTANCE_ID,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        },
        routing: {
            '/services/user/*': process.env.USER_SERVICE_URL || 'http://user-service:3001',
            '/api/users/*': process.env.USER_SERVICE_URL || 'http://user-service:3001',
            '/services/room/*': process.env.ROOM_SERVICE_URL || 'http://room-service:3002',
            '/api/rooms/*': process.env.ROOM_SERVICE_URL || 'http://room-service:3002',
            '/bookings/*': process.env.BOOKING_SERVICE_URL || 'http://booking-service:3003',
            '/api/bookings/*': process.env.BOOKING_SERVICE_URL || 'http://booking-service:3003'
        },
        architecture: 'nginx → api-gateway → microservices'
    });
});

// Default route (moved after proxy routes)
app.get('/', (req, res) => {
    res.json({
        message: 'Room Booking API Gateway',
        instance: INSTANCE_ID,
        version: '2.0.0',
        architecture: 'nginx → api-gateway → microservices',
        endpoints: {
            health: '/health',
            stats: '/gateway-stats',
            userService: '/services/user/* OR /api/users/*',
            roomService: '/services/room/* OR /api/rooms/*',
            bookingService: '/bookings/* OR /api/bookings/*'
        },
        documentation: {
            users: {
                register: 'POST /api/users/register',
                login: 'POST /api/users/login',
                profile: 'GET /api/users/profile'
            },
            rooms: {
                list: 'GET /api/rooms',
                create: 'POST /api/rooms',
                details: 'GET /api/rooms/:id',
                update: 'PUT /api/rooms/:id',
                delete: 'DELETE /api/rooms/:id'
            },
            bookings: {
                list: 'GET /api/bookings',
                create: 'POST /api/bookings',
                details: 'GET /api/bookings/:id',
                update: 'PUT /api/bookings/:id',
                delete: 'DELETE /api/bookings/:id'
            }
        }
    });
});

// Catch-all route (must be last)
app.use('*', (req, res) => {
    console.log(`❓ [${INSTANCE_ID}] Unknown route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        gateway: INSTANCE_ID,
        availableRoutes: [
            '/health',
            '/gateway-stats',
            '/api/users/*',
            '/api/rooms/*',
            '/api/bookings/*',
            '/services/user/*',
            '/services/room/*'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚪 API Gateway [${INSTANCE_ID}] running on port ${PORT}`);
    console.log(`🔗 Services Configuration:`);
    console.log(`   User Service: ${process.env.USER_SERVICE_URL || 'http://user-service:3001'}`);
    console.log(`   Room Service: ${process.env.ROOM_SERVICE_URL || 'http://room-service:3002'}`);
    console.log(`   Booking Service: ${process.env.BOOKING_SERVICE_URL || 'http://booking-service:3003'}`);
    console.log(`🏗️  Architecture: NGINX → API Gateway → Microservices`);
});

module.exports = app; 
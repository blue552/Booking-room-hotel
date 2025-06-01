const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.STATIC_PORT || 8080;

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost', 'http://localhost:8080'],
    credentials: true
}));

// Serve static files from UI directory
app.use(express.static(path.join(__dirname, 'UI')));

// Serve assets from assets directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Handle client-side routing - serve index.html for any unmatched routes
app.get('*', (req, res) => {
    // If it's an API request, return 404
    if (req.path.startsWith('/api/') || req.path.startsWith('/services/')) {
        return res.status(404).json({ error: 'Not Found' });
    }

    // For HTML files, try to serve them directly
    const requestedFile = req.path === '/' ? 'index.html' : req.path;
    const filePath = path.join(__dirname, 'UI', requestedFile);

    // Try to serve the requested file
    res.sendFile(filePath, (err) => {
        if (err) {
            // If file not found, serve 404.html or index.html
            const fallbackPath = path.join(__dirname, 'UI', '404.html');
            res.status(404).sendFile(fallbackPath, (err2) => {
                if (err2) {
                    res.status(404).send('Page not found');
                }
            });
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Static File Server',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Static file server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'UI')}`);
    console.log(`🎨 Assets served from: ${path.join(__dirname, 'assets')}`);
});

module.exports = app; 
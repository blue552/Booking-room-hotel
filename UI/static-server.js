const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.STATIC_PORT || process.env.PORT || 8080;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle 404 for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
    console.log(`🎉 Frontend server is running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🏠 Home page: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Frontend server shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Frontend server shutting down...');
    process.exit(0);
}); 
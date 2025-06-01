const { Sequelize } = require('sequelize');
const Redis = require('ioredis');
require('dotenv').config();

// PostgreSQL configuration
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false, // Set to console.log to see SQL queries
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Redis configuration
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Test connections
const testConnections = async () => {
    try {
        // Test PostgreSQL
        await sequelize.authenticate();
        console.log('✅ Booking Service: Database connected successfully');

        // Test Redis
        await redis.ping();
        console.log('✅ Booking Service: Redis connected successfully');
    } catch (error) {
        console.error('Connection failed:', error);
        process.exit(1);
    }
};

// Export with proper structure
module.exports = {
    sequelize,
    redis,
    testConnections
}; 
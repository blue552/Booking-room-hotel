const { Sequelize } = require('sequelize');
const { Pool } = require('pg');

// Sequelize instance
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'booking_room_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// PostgreSQL connection pool (legacy)
const pgPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'postgres',
    database: process.env.DB_NAME || 'booking_room_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// Test database connections
const testConnections = async () => {
    try {
        // Test Sequelize connection
        await sequelize.authenticate();
        console.log('PostgreSQL connection successful');
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
};

module.exports = {
    sequelize,
    pgPool,
    testConnections
}; 
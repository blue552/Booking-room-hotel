const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Foreign keys instead of associations
    roomId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    checkIn: {
        type: DataTypes.DATE,
        allowNull: false
    },
    checkOut: {
        type: DataTypes.DATE,
        allowNull: false
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        defaultValue: 'pending'
    },
    specialRequests: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    numberOfGuests: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // New admin management fields
    adminNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Admin notes about status changes'
    },
    statusUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When status was last updated'
    },
    statusUpdatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Admin ID who updated status'
    },
    autoConfirm: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether booking should be auto-confirmed'
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
        defaultValue: 'pending',
        comment: 'Payment status'
    },
    paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Payment method used'
    }
});

// No associations - use foreign keys only
// Services will communicate via API calls

module.exports = Booking; 
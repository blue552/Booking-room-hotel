const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Room = sequelize.define('Room', {
    roomNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    roomType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('available', 'occupied', 'maintenance'),
        defaultValue: 'available'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    amenities: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    mainImage: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Room; 
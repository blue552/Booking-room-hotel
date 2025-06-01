'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Bookings', 'roomId', {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Rooms',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Bookings', 'roomId');
    }
}; 
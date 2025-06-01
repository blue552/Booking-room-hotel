const { Room, Booking } = require('../models');
const { Op } = require('sequelize');

class RoomService {
    // Get all rooms
    async getAllRooms(filters = {}) {
        try {
            const where = {};
            
            if (filters.roomType) {
                where.roomType = filters.roomType;
            }
            
            if (filters.status) {
                where.status = filters.status;
            }
            
            if (filters.minPrice || filters.maxPrice) {
                where.price = {};
                if (filters.minPrice) {
                    where.price[Op.gte] = filters.minPrice;
                }
                if (filters.maxPrice) {
                    where.price[Op.lte] = filters.maxPrice;
                }
            }

            const rooms = await Room.findAll({
                where,
                order: [['createdAt', 'DESC']]
            });
            return rooms;
        } catch (error) {
            throw new Error(`Error getting rooms: ${error.message}`);
        }
    }

    // Get room by ID
    async getRoomById(id) {
        try {
            const room = await Room.findByPk(id);
            if (!room) {
                throw new Error('Room not found');
            }
            return room;
        } catch (error) {
            throw new Error(`Error getting room: ${error.message}`);
        }
    }

    // Create new room
    async createRoom(roomData) {
        try {
            // Validate image data
            if (roomData.images) {
                roomData.images = roomData.images.map(img => ({
                    url: img.url,
                    description: img.description || '',
                    isMain: img.isMain || false
                }));

                // Set main image
                const mainImage = roomData.images.find(img => img.isMain);
                if (mainImage) {
                    roomData.mainImage = mainImage.url;
                } else if (roomData.images.length > 0) {
                    roomData.mainImage = roomData.images[0].url;
                }
            }

            const room = await Room.create(roomData);
            return room;
        } catch (error) {
            throw new Error(`Error creating room: ${error.message}`);
        }
    }

    // Update room
    async updateRoom(id, roomData) {
        try {
            const room = await Room.findByPk(id);
            if (!room) {
                throw new Error('Room not found');
            }

            // Handle image updates
            if (roomData.images) {
                roomData.images = roomData.images.map(img => ({
                    url: img.url,
                    description: img.description || '',
                    isMain: img.isMain || false
                }));

                // Update main image
                const mainImage = roomData.images.find(img => img.isMain);
                if (mainImage) {
                    roomData.mainImage = mainImage.url;
                } else if (roomData.images.length > 0) {
                    roomData.mainImage = roomData.images[0].url;
                }
            }

            await room.update(roomData);
            return room;
        } catch (error) {
            throw new Error(`Error updating room: ${error.message}`);
        }
    }

    // Delete room
    async deleteRoom(id) {
        try {
            const room = await Room.findByPk(id);
            if (!room) {
                throw new Error('Room not found');
            }
            await room.destroy();
            return true;
        } catch (error) {
            throw new Error(`Error deleting room: ${error.message}`);
        }
    }

    // Check room availability
    async checkAvailability(roomId, checkIn, checkOut) {
        const bookings = await Booking.findAll({
            where: {
                roomId,
                status: ['confirmed', 'pending'],
                [Op.or]: [
                    {
                        checkIn: {
                            [Op.between]: [checkIn, checkOut]
                        }
                    },
                    {
                        checkOut: {
                            [Op.between]: [checkIn, checkOut]
                        }
                    }
                ]
            }
        });
        return bookings.length === 0;
    }

    // Get available rooms for a date range
    async getAvailableRooms(checkIn, checkOut) {
        const allRooms = await Room.findAll();
        const availableRooms = [];

        for (const room of allRooms) {
            const isAvailable = await this.checkAvailability(room.id, checkIn, checkOut);
            if (isAvailable) {
                availableRooms.push(room);
            }
        }

        return availableRooms;
    }

    async updateRoomStatus(id, status) {
        try {
            const room = await Room.findByPk(id);
            if (!room) {
                throw new Error('Room not found');
            }
            await room.update({ status });
            return room;
        } catch (error) {
            throw new Error(`Error updating room status: ${error.message}`);
        }
    }
}

module.exports = new RoomService(); 
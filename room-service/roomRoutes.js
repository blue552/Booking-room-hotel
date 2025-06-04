const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const router = express.Router();
const Room = require('./Room');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/rooms';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// GET all rooms
router.get('/', async (req, res) => {
    try {
        const { roomType, status, minPrice, maxPrice, search } = req.query;
        let whereClause = {};

        if (roomType) whereClause.roomType = roomType;
        if (status) whereClause.status = status;
        if (minPrice || maxPrice) {
            whereClause.price = {};
            if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
            if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
        }
        if (search) {
            whereClause.roomNumber = { [Op.iLike]: `%${search}%` };
        }

        const rooms = await Room.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET room by ID
router.get('/:id', async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        if (room) {
            res.json(room);
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new room with file upload
router.post('/', upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), async (req, res) => {
    try {
        const { roomNumber, roomType, price, status, description, amenities } = req.body;

        // Validate required fields
        if (!roomNumber || !roomType || !price) {
            return res.status(400).json({
                error: 'Missing required fields: roomNumber, roomType, price'
            });
        }

        // Check if room number already exists
        const existingRoom = await Room.findOne({ where: { roomNumber } });
        if (existingRoom) {
            return res.status(400).json({ error: 'Room number already exists' });
        }

        // Prepare room data
        const roomData = {
            roomNumber,
            roomType,
            price: parseFloat(price),
            status: status || 'available',
            description: description || '',
            amenities: amenities ? JSON.parse(amenities) : []
        };

        // Handle main image
        if (req.files.mainImage && req.files.mainImage[0]) {
            roomData.mainImage = `/uploads/rooms/${req.files.mainImage[0].filename}`;
        }

        // Handle additional images
        if (req.files.images && req.files.images.length > 0) {
            roomData.images = req.files.images.map(file => `/uploads/rooms/${file.filename}`);
        }

        const room = await Room.create(roomData);
        res.status(201).json(room);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(400).json({ error: error.message });
    }
});

// PUT update room with file upload
router.put('/:id', upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const { roomNumber, roomType, price, status, description, amenities } = req.body;

        // Check if room number already exists (excluding current room)
        if (roomNumber && roomNumber !== room.roomNumber) {
            const existingRoom = await Room.findOne({
                where: {
                    roomNumber,
                    id: { [Op.ne]: req.params.id }
                }
            });
            if (existingRoom) {
                return res.status(400).json({ error: 'Room number already exists' });
            }
        }

        // Prepare update data
        const updateData = {};
        if (roomNumber) updateData.roomNumber = roomNumber;
        if (roomType) updateData.roomType = roomType;
        if (price) updateData.price = parseFloat(price);
        if (status) updateData.status = status;
        if (description !== undefined) updateData.description = description;
        if (amenities) updateData.amenities = JSON.parse(amenities);

        // Handle main image update
        if (req.files.mainImage && req.files.mainImage[0]) {
            // Delete old main image if exists
            if (room.mainImage && fs.existsSync(`.${room.mainImage}`)) {
                fs.unlinkSync(`.${room.mainImage}`);
            }
            updateData.mainImage = `/uploads/rooms/${req.files.mainImage[0].filename}`;
        }

        // Handle additional images update
        if (req.files.images && req.files.images.length > 0) {
            // Delete old images if exists
            if (room.images && room.images.length > 0) {
                room.images.forEach(imagePath => {
                    if (fs.existsSync(`.${imagePath}`)) {
                        fs.unlinkSync(`.${imagePath}`);
                    }
                });
            }
            updateData.images = req.files.images.map(file => `/uploads/rooms/${file.filename}`);
        }

        await room.update(updateData);
        res.json(room);
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(400).json({ error: error.message });
    }
});

// PATCH partial update room
router.patch('/:id', async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        if (room) {
            await room.update(req.body);
            res.json(room);
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE room
router.delete('/:id', async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);
        if (room) {
            // Delete associated images
            if (room.mainImage && fs.existsSync(`.${room.mainImage}`)) {
                fs.unlinkSync(`.${room.mainImage}`);
            }
            if (room.images && room.images.length > 0) {
                room.images.forEach(imagePath => {
                    if (fs.existsSync(`.${imagePath}`)) {
                        fs.unlinkSync(`.${imagePath}`);
                    }
                });
            }

            await room.destroy();
            res.json({ message: 'Room deleted successfully' });
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve uploaded images
router.use('/uploads', express.static('uploads'));

module.exports = router; 
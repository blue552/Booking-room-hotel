const express = require('express');
const router = express.Router();
const Room = require('./Room');

// GET all rooms
router.get('/', async (req, res) => {
    try {
        const rooms = await Room.findAll();
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

// POST create new room
router.post('/', async (req, res) => {
    try {
        const room = await Room.create(req.body);
        res.status(201).json(room);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update room
router.put('/:id', async (req, res) => {
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
            await room.destroy();
            res.json({ message: 'Room deleted successfully' });
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 
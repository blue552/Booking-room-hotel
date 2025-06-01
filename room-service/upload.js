const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Local storage configuration (fallback from S3)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/rooms/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and videos are allowed.'));
        }
    }
});

// Upload single file
router.post('/single', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        res.json({
            message: 'File uploaded successfully',
            file: {
                url: `/uploads/rooms/${req.file.filename}`,
                filename: req.file.filename,
                type: req.file.mimetype,
                size: req.file.size
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload multiple files
router.post('/multiple', upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const files = req.files.map(file => ({
            url: `/uploads/rooms/${file.filename}`,
            filename: file.filename,
            type: file.mimetype,
            size: file.size
        }));

        res.json({
            message: 'Files uploaded successfully',
            files
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete file (local version)
router.delete('/:filename', async (req, res) => {
    try {
        const fs = require('fs');
        const filePath = path.join(__dirname, 'uploads/rooms/', req.params.filename);

        fs.unlink(filePath, (err) => {
            if (err) {
                return res.status(404).json({ message: 'File not found' });
            }
            res.json({ message: 'File deleted successfully' });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 
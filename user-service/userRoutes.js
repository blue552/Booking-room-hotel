const express = require('express');
const router = express.Router();
const User = require('./User');
const jwt = require('jsonwebtoken');
const auth = require('./auth');

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'user-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Simple test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'User Service is working!',
        timestamp: new Date().toISOString()
    });
});

// POST register new user
router.post('/register', async (req, res) => {
    console.log('=== REGISTER ENDPOINT CALLED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    try {
        let { email, password, firstName, lastName, phone, name } = req.body;
        console.log('Extracted fields:', { email, password: '***', firstName, lastName, phone, name });

        // Handle both formats: name field or firstName/lastName fields
        if (name && !firstName && !lastName) {
            const nameParts = name.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
            console.log('Split name:', { firstName, lastName });
        }

        console.log('Final fields:', { email, firstName, lastName, phone });

        // Check if user already exists
        console.log('Checking if user exists...');
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            console.log('User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }
        console.log('User does not exist, proceeding...');

        // Create new user
        console.log('Creating new user...');
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            phone
        });
        console.log('User created successfully:', user.id);

        // Generate JWT token
        console.log('Generating JWT token...');
        const jwtSecret = process.env.JWT_SECRET;
        console.log('JWT Secret exists:', !!jwtSecret);

        if (!jwtSecret) {
            throw new Error('JWT_SECRET not configured');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            jwtSecret,
            { expiresIn: '24h' }
        );
        console.log('JWT token generated successfully');

        const response = {
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        };

        console.log('Sending response:', JSON.stringify(response, null, 2));
        res.status(201).json(response);
    } catch (error) {
        console.error('=== REGISTER ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(400).json({ error: error.message });
    }
});

// POST login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (user) {
            const { firstName, lastName, phone } = req.body;
            await user.update({ firstName, lastName, phone });
            res.json({
                message: 'Profile updated successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                }
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT change password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);

        // Validate current password
        const isValidPassword = await user.validatePassword(currentPassword);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update password
        await user.update({ password: newPassword });
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Admin routes
// GET all users (admin only)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update user (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const user = await User.findByPk(req.params.id);
        if (user) {
            await user.update(req.body);
            res.json({
                message: 'User updated successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                }
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE user (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const user = await User.findByPk(req.params.id);
        if (user) {
            await user.destroy();
            res.json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 
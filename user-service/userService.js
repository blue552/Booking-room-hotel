const { User, Booking } = require('../models');
const bcrypt = require('bcryptjs');

class UserService {
    // Get all users
    async getAllUsers() {
        return await User.findAll({
            attributes: { exclude: ['password'] }
        });
    }

    // Get user by ID
    async getUserById(id) {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    // Create new user
    async createUser(userData) {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        userData.password = hashedPassword;

        return await User.create(userData);
    }

    // Update user
    async updateUser(id, userData) {
        const user = await User.findByPk(id);
        if (!user) {
            throw new Error('User not found');
        }

        // If password is being updated, hash it
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        return await user.update(userData);
    }

    // Delete user
    async deleteUser(id) {
        const user = await User.findByPk(id);
        if (!user) {
            throw new Error('User not found');
        }
        await user.destroy();
        return { message: 'User deleted successfully' };
    }

    // Get user bookings
    async getUserBookings(userId) {
        return await Booking.findAll({
            where: { userId },
            include: [
                {
                    model: Room,
                    attributes: ['roomNumber', 'roomType', 'price']
                }
            ]
        });
    }

    // Login user
    async loginUser(email, password) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid password');
        }

        return user;
    }
}

module.exports = new UserService(); 
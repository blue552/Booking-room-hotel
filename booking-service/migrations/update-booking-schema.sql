-- Migration script to update booking table for admin management
-- Run this on your booking database

-- Add new admin management columns
ALTER TABLE Bookings ADD COLUMN IF NOT EXISTS adminNote TEXT;
ALTER TABLE Bookings ADD COLUMN IF NOT EXISTS statusUpdatedAt TIMESTAMP;
ALTER TABLE Bookings ADD COLUMN IF NOT EXISTS statusUpdatedBy INTEGER;
ALTER TABLE Bookings ADD COLUMN IF NOT EXISTS autoConfirm BOOLEAN DEFAULT FALSE;
ALTER TABLE Bookings ADD COLUMN IF NOT EXISTS paymentStatus ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending';
ALTER TABLE Bookings ADD COLUMN IF NOT EXISTS paymentMethod VARCHAR(50);

-- Add comments for documentation
ALTER TABLE Bookings MODIFY COLUMN adminNote TEXT COMMENT 'Admin notes about status changes';
ALTER TABLE Bookings MODIFY COLUMN statusUpdatedAt TIMESTAMP COMMENT 'When status was last updated';
ALTER TABLE Bookings MODIFY COLUMN statusUpdatedBy INTEGER COMMENT 'Admin ID who updated status';
ALTER TABLE Bookings MODIFY COLUMN autoConfirm BOOLEAN DEFAULT FALSE COMMENT 'Whether booking should be auto-confirmed';
ALTER TABLE Bookings MODIFY COLUMN paymentStatus ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' COMMENT 'Payment status';
ALTER TABLE Bookings MODIFY COLUMN paymentMethod VARCHAR(50) COMMENT 'Payment method used';

-- Update existing pending bookings to be auto-confirmable (optional)
UPDATE Bookings SET autoConfirm = TRUE WHERE status = 'pending' AND createdAt > DATE_SUB(NOW(), INTERVAL 1 DAY);

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_booking_status ON Bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_created ON Bookings(createdAt);
CREATE INDEX IF NOT EXISTS idx_booking_checkin ON Bookings(checkIn);
CREATE INDEX IF NOT EXISTS idx_booking_room ON Bookings(roomId);
CREATE INDEX IF NOT EXISTS idx_booking_user ON Bookings(userId);

-- Insert sample admin user (for testing)
INSERT IGNORE INTO Users (id, name, email, password, role, createdAt, updatedAt) 
VALUES (999, 'Admin User', 'admin@hotel.com', 'hashed_password', 'admin', NOW(), NOW());

COMMIT; 
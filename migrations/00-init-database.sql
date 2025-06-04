-- Database Initialization for Booking Room System
-- Run this file to create all required tables

-- Users table
CREATE TABLE IF NOT EXISTS "Users" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS "Rooms" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    location VARCHAR(255),
    amenities TEXT[], 
    images TEXT[],
    main_image TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS "Bookings" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES "Rooms"(id) ON DELETE CASCADE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    guest_count INTEGER DEFAULT 1,
    special_requests TEXT,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON "Bookings"(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON "Bookings"(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON "Bookings"(start_date, end_date);

-- Insert default admin user
INSERT INTO "Users" (email, password, first_name, last_name, phone, role, is_verified) 
VALUES ('admin@bookingroom.com', '$2b$10$rHnVkF.8ZvU8K1Y5vU8K1O5vU8K1Y5vU8K1Y5vU8K1Y5vU8K1Y5vU', 'Admin', 'User', '1234567890', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample rooms
INSERT INTO "Rooms" (name, description, capacity, price, location, amenities, main_image) VALUES
('Deluxe Room', 'Spacious room with city view', 2, 150.00, 'Floor 5', '{"Wi-Fi", "Air Conditioning", "Mini Bar", "Room Service"}', '/assets/img/rooms/01.jpg'),
('Standard Room', 'Comfortable room for budget travelers', 2, 100.00, 'Floor 3', '{"Wi-Fi", "Air Conditioning"}', '/assets/img/rooms/02.jpg'),
('Suite Room', 'Luxury suite with premium amenities', 4, 300.00, 'Floor 10', '{"Wi-Fi", "Air Conditioning", "Mini Bar", "Room Service", "Balcony", "Jacuzzi"}', '/assets/img/rooms/03.jpg')
ON CONFLICT DO NOTHING;

COMMIT; 
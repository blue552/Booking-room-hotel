// Script để test API thêm phòng mẫu
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE = 'http://localhost:3002';

// Dữ liệu phòng mẫu
const sampleRooms = [
    {
        roomNumber: '101',
        roomType: 'Single',
        price: 800000,
        status: 'available',
        description: 'Phòng đơn thoải mái với đầy đủ tiện nghi cơ bản. Phù hợp cho khách du lịch một mình.',
        amenities: ['wifi', 'ac', 'tv']
    },
    {
        roomNumber: '102',
        roomType: 'Double',
        price: 1200000,
        status: 'available',
        description: 'Phòng đôi rộng rãi với giường lớn, view đẹp và không gian thoải mái cho 2 người.',
        amenities: ['wifi', 'ac', 'tv', 'minibar']
    },
    {
        roomNumber: '201',
        roomType: 'Suite',
        price: 2500000,
        status: 'available',
        description: 'Phòng suite cao cấp với phòng khách riêng, ban công rộng và view toàn cảnh thành phố.',
        amenities: ['wifi', 'ac', 'tv', 'minibar', 'balcony', 'room_service']
    },
    {
        roomNumber: '301',
        roomType: 'Deluxe',
        price: 1800000,
        status: 'occupied',
        description: 'Phòng deluxe sang trọng với nội thất cao cấp và đầy đủ tiện nghi hiện đại.',
        amenities: ['wifi', 'ac', 'tv', 'minibar', 'bathtub', 'safe']
    },
    {
        roomNumber: '401',
        roomType: 'Presidential',
        price: 5000000,
        status: 'available',
        description: 'Phòng tổng thống đẳng cấp với thiết kế sang trọng, dịch vụ butler và tiện nghi 5 sao.',
        amenities: ['wifi', 'ac', 'tv', 'minibar', 'balcony', 'bathtub', 'room_service', 'safe', 'parking']
    }
];

async function createSampleRoom(roomData) {
    try {
        const formData = new FormData();

        // Thêm dữ liệu cơ bản
        formData.append('roomNumber', roomData.roomNumber);
        formData.append('roomType', roomData.roomType);
        formData.append('price', roomData.price);
        formData.append('status', roomData.status);
        formData.append('description', roomData.description);
        formData.append('amenities', JSON.stringify(roomData.amenities));

        const response = await axios.post(`${API_BASE}/rooms`, formData, {
            headers: formData.getHeaders()
        });

        console.log(`✅ Created room ${roomData.roomNumber}:`, response.data);
        return response.data;

    } catch (error) {
        console.error(`❌ Error creating room ${roomData.roomNumber}:`,
            error.response?.data || error.message);
    }
}

async function testGetRooms() {
    try {
        const response = await axios.get(`${API_BASE}/rooms`);
        console.log(`📋 Total rooms: ${response.data.length}`);

        response.data.forEach(room => {
            console.log(`  - Room ${room.roomNumber} (${room.roomType}): ${room.price.toLocaleString()} VNĐ - ${room.status}`);
        });

    } catch (error) {
        console.error('❌ Error fetching rooms:', error.response?.data || error.message);
    }
}

async function testFilterRooms() {
    try {
        console.log('\n🔍 Testing filters...');

        // Test filter by room type
        const singleRooms = await axios.get(`${API_BASE}/rooms?roomType=Single`);
        console.log(`Single rooms: ${singleRooms.data.length}`);

        // Test filter by status
        const availableRooms = await axios.get(`${API_BASE}/rooms?status=available`);
        console.log(`Available rooms: ${availableRooms.data.length}`);

        // Test filter by price range
        const expensiveRooms = await axios.get(`${API_BASE}/rooms?minPrice=2000000`);
        console.log(`Rooms above 2M VNĐ: ${expensiveRooms.data.length}`);

    } catch (error) {
        console.error('❌ Error testing filters:', error.response?.data || error.message);
    }
}

async function main() {
    console.log('🚀 Starting Room API Test...\n');

    // Kiểm tra kết nối server
    try {
        await axios.get(`${API_BASE}/health`);
        console.log('✅ Server connection successful\n');
    } catch (error) {
        console.error('❌ Cannot connect to server. Make sure room-service is running at port 3002');
        console.error('   You can start it with: npm start');
        return;
    }

    // Tạo phòng mẫu
    console.log('📝 Creating sample rooms...\n');
    for (const roomData of sampleRooms) {
        await createSampleRoom(roomData);
    }

    // Test lấy danh sách phòng
    console.log('\n📋 Getting all rooms...\n');
    await testGetRooms();

    // Test filter
    await testFilterRooms();

    console.log('\n✅ Test completed! You can now:');
    console.log('👩‍💼 Open admin-rooms.html to manage rooms');
    console.log('👤 Open room-dynamic.html to view rooms');
}

// Chạy test
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { createSampleRoom, testGetRooms, testFilterRooms }; 
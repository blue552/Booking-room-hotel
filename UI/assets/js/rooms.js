// Room Management Functions

// Load and display rooms
async function loadRooms() {
    try {
        const rooms = await RoomAPI.getAll();
        displayRooms(rooms);
        return rooms;
    } catch (error) {
        console.error('Error loading rooms:', error);
        showError('Không thể tải danh sách phòng');
        return [];
    }
}

// Display rooms in the UI
function displayRooms(rooms) {
    const roomContainer = document.getElementById('room-container') ||
        document.querySelector('.room-list') ||
        document.querySelector('#rooms');

    if (!roomContainer) {
        console.warn('Room container not found');
        return;
    }

    if (!rooms || rooms.length === 0) {
        roomContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle"></i>
                    Hiện tại không có phòng nào
                </div>
            </div>
        `;
        return;
    }

    const roomsHTML = rooms.map(room => createRoomCard(room)).join('');
    roomContainer.innerHTML = roomsHTML;
}

// Create room card HTML
function createRoomCard(room) {
    const statusClass = room.status === 'available' ? 'success' :
        room.status === 'occupied' ? 'danger' : 'warning';

    const statusText = room.status === 'available' ? 'Có sẵn' :
        room.status === 'occupied' ? 'Đã đặt' : 'Bảo trì';

    return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card room-card h-100 shadow-sm">
                <div class="card-img-top position-relative">
                    <img src="../assets/images/rooms/room-${room.id || 'default'}.jpg" 
                         class="w-100" 
                         style="height: 200px; object-fit: cover;"
                         alt="Phòng ${room.roomNumber}"
                         onerror="this.src='../assets/images/rooms/default-room.jpg'">
                    <div class="position-absolute top-0 right-0 m-2">
                        <span class="badge badge-${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">Phòng ${room.roomNumber}</h5>
                    <p class="card-text">
                        <i class="fas fa-door-open"></i> Loại: ${getRoomTypeName(room.roomType)}<br>
                        <i class="fas fa-money-bill-wave"></i> Giá: ${formatCurrency(room.price)}/giờ
                    </p>
                    <div class="mt-auto">
                        <button class="btn btn-primary btn-sm" 
                                onclick="viewRoomDetails(${room.id})"
                                ${room.status !== 'available' ? 'disabled' : ''}>
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </button>
                        ${room.status === 'available' ? `
                            <button class="btn btn-success btn-sm ml-2" 
                                    onclick="bookRoom(${room.id})">
                                <i class="fas fa-calendar-plus"></i> Đặt phòng
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Get room type display name
function getRoomTypeName(type) {
    const types = {
        'meeting': 'Phòng họp',
        'conference': 'Phòng hội nghị',
        'training': 'Phòng đào tạo',
        'presentation': 'Phòng thuyết trình',
        'office': 'Văn phòng',
        'coworking': 'Coworking'
    };
    return types[type] || type;
}

// View room details
async function viewRoomDetails(roomId) {
    try {
        const room = await RoomAPI.getById(roomId);
        showRoomDetailsModal(room);
    } catch (error) {
        console.error('Error loading room details:', error);
        showError('Không thể tải thông tin chi tiết phòng');
    }
}

// Show room details in modal
function showRoomDetailsModal(room) {
    const modalHTML = `
        <div class="modal fade" id="roomDetailsModal" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chi tiết phòng ${room.roomNumber}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <img src="../assets/images/rooms/room-${room.id}.jpg" 
                                     class="img-fluid rounded"
                                     alt="Phòng ${room.roomNumber}"
                                     onerror="this.src='../assets/images/rooms/default-room.jpg'">
                            </div>
                            <div class="col-md-6">
                                <h6><i class="fas fa-door-open"></i> Loại phòng:</h6>
                                <p>${getRoomTypeName(room.roomType)}</p>
                                
                                <h6><i class="fas fa-money-bill-wave"></i> Giá thuê:</h6>
                                <p class="text-success font-weight-bold">${formatCurrency(room.price)}/giờ</p>
                                
                                <h6><i class="fas fa-info-circle"></i> Trạng thái:</h6>
                                <p>
                                    <span class="badge badge-${room.status === 'available' ? 'success' : 'danger'}">
                                        ${room.status === 'available' ? 'Có sẵn' : 'Đã đặt'}
                                    </span>
                                </p>
                                
                                ${room.description ? `
                                    <h6><i class="fas fa-file-alt"></i> Mô tả:</h6>
                                    <p>${room.description}</p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Đóng</button>
                        ${room.status === 'available' ? `
                            <button type="button" class="btn btn-success" onclick="bookRoom(${room.id})">
                                <i class="fas fa-calendar-plus"></i> Đặt phòng ngay
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('roomDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    $('#roomDetailsModal').modal('show');
}

// Book room function
function bookRoom(roomId) {
    if (!isAuthenticated()) {
        showError('Vui lòng đăng nhập để đặt phòng');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
        }, 2000);
        return;
    }

    // Close any open modals
    $('.modal').modal('hide');

    // Redirect to booking page with room ID
    window.location.href = `check-out.html?roomId=${roomId}`;
}

// Filter rooms
function filterRooms(filters = {}) {
    const allRooms = window.allRoomsData || [];

    let filteredRooms = allRooms.filter(room => {
        // Filter by type
        if (filters.type && room.roomType !== filters.type) {
            return false;
        }

        // Filter by status
        if (filters.status && room.status !== filters.status) {
            return false;
        }

        // Filter by price range
        if (filters.minPrice && room.price < filters.minPrice) {
            return false;
        }
        if (filters.maxPrice && room.price > filters.maxPrice) {
            return false;
        }

        // Filter by search term
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            return room.roomNumber.toLowerCase().includes(searchTerm) ||
                room.roomType.toLowerCase().includes(searchTerm);
        }

        return true;
    });

    displayRooms(filteredRooms);
}

// Search rooms
function searchRooms(searchTerm) {
    filterRooms({ search: searchTerm });
}

// Initialize room filters
function initializeRoomFilters() {
    // Type filter
    const typeFilter = document.getElementById('roomTypeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            const currentFilters = getCurrentFilters();
            currentFilters.type = e.target.value || null;
            filterRooms(currentFilters);
        });
    }

    // Status filter
    const statusFilter = document.getElementById('roomStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            const currentFilters = getCurrentFilters();
            currentFilters.status = e.target.value || null;
            filterRooms(currentFilters);
        });
    }

    // Search input
    const searchInput = document.getElementById('roomSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const currentFilters = getCurrentFilters();
            currentFilters.search = e.target.value;
            filterRooms(currentFilters);
        });
    }
}

// Get current filter values
function getCurrentFilters() {
    return {
        type: document.getElementById('roomTypeFilter')?.value || null,
        status: document.getElementById('roomStatusFilter')?.value || null,
        search: document.getElementById('roomSearch')?.value || ''
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function () {
    // Load rooms if we're on a room-related page
    if (window.location.pathname.includes('room') ||
        window.location.pathname.includes('index')) {

        const rooms = await loadRooms();
        window.allRoomsData = rooms; // Store for filtering
        initializeRoomFilters();
    }
});

// Export functions for global use
window.loadRooms = loadRooms;
window.displayRooms = displayRooms;
window.viewRoomDetails = viewRoomDetails;
window.bookRoom = bookRoom;
window.filterRooms = filterRooms;
window.searchRooms = searchRooms; 
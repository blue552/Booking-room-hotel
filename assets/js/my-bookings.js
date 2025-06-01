// My Bookings Management
// Handles displaying, filtering, and managing user bookings

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    if (!isAuthenticated()) {
        // Redirect to login page if not authenticated
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }

    initializeMyBookingsPage();
});

function initializeMyBookingsPage() {
    loadUserBookings();
    setupEventListeners();
    console.log('My Bookings page initialized');
}

function setupEventListeners() {
    // Filter functionality
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');

    if (statusFilter) {
        statusFilter.addEventListener('change', filterBookings);
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', filterBookings);
    }
}

function loadUserBookings() {
    try {
        // Get bookings from localStorage (in real app, this would be from API)
        const bookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
        displayBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        showError('Không thể tải danh sách đặt phòng');
        showEmptyState();
    }
}

function displayBookings(bookings) {
    const container = document.getElementById('bookings-container');
    const emptyState = document.getElementById('empty-state');

    if (!container) return;

    // Hide loading
    container.innerHTML = '';

    if (!bookings || bookings.length === 0) {
        showEmptyState();
        return;
    }

    // Hide empty state
    emptyState.classList.add('d-none');

    // Sort bookings by creation date (newest first)
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Create booking cards
    const bookingsHTML = bookings.map(booking => createBookingCard(booking)).join('');
    container.innerHTML = bookingsHTML;
}

function createBookingCard(booking) {
    const status = getBookingStatus(booking.status);
    const statusClass = status.class;
    const statusText = status.text;

    const checkinDate = new Date(booking.checkin);
    const checkoutDate = new Date(booking.checkout);
    const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

    return `
        <div class="col-lg-6 col-md-12 mb-4">
            <div class="card booking-card h-100 shadow-sm">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Booking #${booking.id}</h6>
                    <span class="badge badge-${statusClass}">${statusText}</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong><i class="fas fa-door-open"></i> Phòng:</strong> ${booking.roomTitle || 'Phòng tiêu chuẩn'}</p>
                            <p><strong><i class="fas fa-calendar-alt"></i> Nhận phòng:</strong><br>${formatDate(booking.checkin)}</p>
                            <p><strong><i class="fas fa-calendar-alt"></i> Trả phòng:</strong><br>${formatDate(booking.checkout)}</p>
                            <p><strong><i class="fas fa-moon"></i> Số đêm:</strong> ${nights} đêm</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong><i class="fas fa-users"></i> Khách:</strong> ${booking.adults} người lớn${booking.children > 0 ? `, ${booking.children} trẻ em` : ''}</p>
                            <p><strong><i class="fas fa-money-bill-wave"></i> Tổng tiền:</strong><br>
                               <span class="text-success font-weight-bold">${formatCurrency(booking.totalAmount)}</span></p>
                            <p><strong><i class="fas fa-clock"></i> Đặt lúc:</strong><br>
                               <small>${formatDateTime(booking.createdAt)}</small></p>
                            ${booking.notes ? `
                                <p><strong><i class="fas fa-comment"></i> Ghi chú:</strong><br>
                                   <small>${booking.notes}</small></p>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-sm" onclick="viewBookingDetails('${booking.id}')">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                    ${canCancelBooking(booking) ? `
                        <button class="btn btn-danger btn-sm ml-2" onclick="cancelBooking('${booking.id}')">
                            <i class="fas fa-times"></i> Hủy booking
                        </button>
                    ` : ''}
                    ${canModifyBooking(booking) ? `
                        <button class="btn btn-warning btn-sm ml-2" onclick="modifyBooking('${booking.id}')">
                            <i class="fas fa-edit"></i> Sửa đổi
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function getBookingStatus(status) {
    const statusMap = {
        'pending': { class: 'warning', text: 'Chờ xác nhận' },
        'confirmed': { class: 'info', text: 'Đã xác nhận' },
        'checkedin': { class: 'success', text: 'Đã nhận phòng' },
        'completed': { class: 'secondary', text: 'Hoàn thành' },
        'cancelled': { class: 'danger', text: 'Đã hủy' }
    };

    return statusMap[status] || { class: 'primary', text: 'Không xác định' };
}

function canCancelBooking(booking) {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
        return false;
    }

    const now = new Date();
    const checkinDate = new Date(booking.checkin);

    // Can cancel if checkin is more than 24 hours away
    const oneDayBeforeCheckin = new Date(checkinDate.getTime() - (24 * 60 * 60 * 1000));
    return now < oneDayBeforeCheckin;
}

function canModifyBooking(booking) {
    if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'checkedin') {
        return false;
    }

    const now = new Date();
    const checkinDate = new Date(booking.checkin);

    // Can modify if checkin is more than 48 hours away
    const twoDaysBeforeCheckin = new Date(checkinDate.getTime() - (48 * 60 * 60 * 1000));
    return now < twoDaysBeforeCheckin;
}

function viewBookingDetails(bookingId) {
    try {
        const bookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
        const booking = bookings.find(b => b.id === bookingId);

        if (!booking) {
            showError('Không tìm thấy thông tin booking');
            return;
        }

        showBookingDetailsModal(booking);
    } catch (error) {
        console.error('Error loading booking details:', error);
        showError('Không thể tải thông tin chi tiết booking');
    }
}

function showBookingDetailsModal(booking) {
    const status = getBookingStatus(booking.status);
    const checkinDate = new Date(booking.checkin);
    const checkoutDate = new Date(booking.checkout);
    const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

    const modalHTML = `
        <div class="modal fade" id="bookingDetailsModal" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chi tiết Booking #${booking.id}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="fas fa-door-open"></i> Thông tin phòng:</h6>
                                <p>Phòng: ${booking.roomTitle || 'Phòng tiêu chuẩn'}</p>
                                
                                <h6><i class="fas fa-calendar-alt"></i> Thời gian:</h6>
                                <p>Nhận phòng: ${formatDate(booking.checkin)}<br>
                                   Trả phòng: ${formatDate(booking.checkout)}<br>
                                   Số đêm: ${nights} đêm</p>
                                
                                <h6><i class="fas fa-users"></i> Số khách:</h6>
                                <p>${booking.adults} người lớn${booking.children > 0 ? `, ${booking.children} trẻ em` : ''}</p>
                            </div>
                            <div class="col-md-6">
                                <h6><i class="fas fa-info-circle"></i> Trạng thái:</h6>
                                <p><span class="badge badge-${status.class}">${status.text}</span></p>
                                
                                <h6><i class="fas fa-money-bill-wave"></i> Chi tiết giá:</h6>
                                <div class="pricing-details">
                                    <p>Giá phòng: ${formatCurrency(booking.totalAmount / nights)}/đêm</p>
                                    <p>Số đêm: ${nights} đêm</p>
                                    <hr>
                                    <p class="font-weight-bold">Tổng cộng: ${formatCurrency(booking.totalAmount)}</p>
                                </div>
                                
                                <h6><i class="fas fa-clock"></i> Đặt lúc:</h6>
                                <p>${formatDateTime(booking.createdAt)}</p>
                                
                                ${booking.notes ? `
                                    <h6><i class="fas fa-comment"></i> Ghi chú:</h6>
                                    <p>${booking.notes}</p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Đóng</button>
                        ${canModifyBooking(booking) ? `
                            <button type="button" class="btn btn-warning" onclick="modifyBooking('${booking.id}')">
                                <i class="fas fa-edit"></i> Sửa đổi
                            </button>
                        ` : ''}
                        ${canCancelBooking(booking) ? `
                            <button type="button" class="btn btn-danger" onclick="cancelBooking('${booking.id}')">
                                <i class="fas fa-times"></i> Hủy booking
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('bookingDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    $('#bookingDetailsModal').modal('show');
}

function cancelBooking(bookingId) {
    if (!confirm('Bạn có chắc chắn muốn hủy booking này? Hành động này không thể hoàn tác.')) {
        return;
    }

    try {
        let bookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);

        if (bookingIndex === -1) {
            showError('Không tìm thấy booking để hủy');
            return;
        }

        // Update booking status
        bookings[bookingIndex].status = 'cancelled';
        bookings[bookingIndex].cancelledAt = new Date().toISOString();

        // Save back to localStorage
        localStorage.setItem('userBookings', JSON.stringify(bookings));

        showSuccess('Hủy booking thành công!');

        // Reload bookings
        setTimeout(() => {
            loadUserBookings();
        }, 1000);

        // Close modal if open
        $('.modal').modal('hide');

    } catch (error) {
        console.error('Error cancelling booking:', error);
        showError('Không thể hủy booking');
    }
}

function modifyBooking(bookingId) {
    try {
        const bookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
        const booking = bookings.find(b => b.id === bookingId);

        if (!booking) {
            showError('Không tìm thấy thông tin booking');
            return;
        }

        // Close details modal if open
        $('.modal').modal('hide');

        // Show modification modal
        showModifyBookingModal(booking);

    } catch (error) {
        console.error('Error modifying booking:', error);
        showError('Không thể sửa đổi booking');
    }
}

function showModifyBookingModal(booking) {
    const modalHTML = `
        <div class="modal fade" id="modifyBookingModal" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Sửa đổi Booking #${booking.id}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="modifyBookingForm" data-booking-id="${booking.id}">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Ngày nhận phòng</label>
                                        <input type="date" class="form-control" name="checkin" value="${booking.checkin}" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Ngày trả phòng</label>
                                        <input type="date" class="form-control" name="checkout" value="${booking.checkout}" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Số người lớn</label>
                                        <select class="form-control" name="adults" required>
                                            <option value="1" ${booking.adults == 1 ? 'selected' : ''}>1 người</option>
                                            <option value="2" ${booking.adults == 2 ? 'selected' : ''}>2 người</option>
                                            <option value="3" ${booking.adults == 3 ? 'selected' : ''}>3 người</option>
                                            <option value="4" ${booking.adults == 4 ? 'selected' : ''}>4 người</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Số trẻ em</label>
                                        <select class="form-control" name="children">
                                            <option value="0" ${booking.children == 0 ? 'selected' : ''}>0 trẻ em</option>
                                            <option value="1" ${booking.children == 1 ? 'selected' : ''}>1 trẻ em</option>
                                            <option value="2" ${booking.children == 2 ? 'selected' : ''}>2 trẻ em</option>
                                            <option value="3" ${booking.children == 3 ? 'selected' : ''}>3 trẻ em</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group">
                                        <label>Ghi chú đặc biệt</label>
                                        <textarea class="form-control" name="notes" rows="3">${booking.notes || ''}</textarea>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
                        <button type="button" class="btn filled-btn" onclick="submitModifyBooking()">Cập nhật booking</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('modifyBookingModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Set minimum dates
    const today = new Date().toISOString().split('T')[0];
    const checkinInput = document.querySelector('#modifyBookingModal input[name="checkin"]');
    const checkoutInput = document.querySelector('#modifyBookingModal input[name="checkout"]');

    checkinInput.min = today;
    checkoutInput.min = checkinInput.value;

    checkinInput.addEventListener('change', function () {
        checkoutInput.min = this.value;
    });

    // Show modal
    $('#modifyBookingModal').modal('show');
}

function submitModifyBooking() {
    const form = document.getElementById('modifyBookingForm');
    const formData = new FormData(form);
    const bookingId = form.dataset.bookingId;

    const updatedData = {
        checkin: formData.get('checkin'),
        checkout: formData.get('checkout'),
        adults: formData.get('adults'),
        children: formData.get('children'),
        notes: formData.get('notes')
    };

    // Validate dates
    if (!validateBookingDates(updatedData.checkin, updatedData.checkout)) {
        return;
    }

    try {
        let bookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);

        if (bookingIndex === -1) {
            showError('Không tìm thấy booking để cập nhật');
            return;
        }

        // Update booking
        bookings[bookingIndex] = {
            ...bookings[bookingIndex],
            ...updatedData,
            totalAmount: calculateBookingAmount(updatedData),
            modifiedAt: new Date().toISOString()
        };

        // Save back to localStorage
        localStorage.setItem('userBookings', JSON.stringify(bookings));

        // Close modal
        $('#modifyBookingModal').modal('hide');

        showSuccess('Cập nhật booking thành công!');

        // Reload bookings
        setTimeout(() => {
            loadUserBookings();
        }, 1000);

    } catch (error) {
        console.error('Error updating booking:', error);
        showError('Không thể cập nhật booking');
    }
}

function filterBookings() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;

    try {
        let bookings = JSON.parse(localStorage.getItem('userBookings') || '[]');

        // Apply filters
        if (statusFilter) {
            bookings = bookings.filter(booking => booking.status === statusFilter);
        }

        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            bookings = bookings.filter(booking => {
                const checkinDate = new Date(booking.checkin);
                const checkoutDate = new Date(booking.checkout);
                return filterDate >= checkinDate && filterDate <= checkoutDate;
            });
        }

        displayBookings(bookings);

    } catch (error) {
        console.error('Error filtering bookings:', error);
        showError('Không thể lọc danh sách booking');
    }
}

function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = '';
    loadUserBookings();
}

function showEmptyState() {
    const container = document.getElementById('bookings-container');
    const emptyState = document.getElementById('empty-state');

    if (container) {
        container.innerHTML = '';
    }

    if (emptyState) {
        emptyState.classList.remove('d-none');
    }
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export functions for global use
window.viewBookingDetails = viewBookingDetails;
window.cancelBooking = cancelBooking;
window.modifyBooking = modifyBooking;
window.submitModifyBooking = submitModifyBooking;
window.filterBookings = filterBookings;
window.clearFilters = clearFilters; 
// Booking System - Handle all booking related events and logic
// Author: Assistant
// Date: Current

document.addEventListener('DOMContentLoaded', function () {
    initializeBookingSystem();
});

function initializeBookingSystem() {
    // Initialize all booking event listeners
    setupBookingButtons();
    setupBookingForm();
    setupRoomBookingButtons();

    console.log('Booking system initialized');
}

// Setup event listeners for main booking buttons (in header, etc.)
function setupBookingButtons() {
    const bookingButtons = document.querySelectorAll('.quote-btn a, .btn[href*="room"], a[href*="booking"]');

    bookingButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            handleMainBookingClick(e, this);
        });
    });
}

// Setup event listeners for individual room booking buttons
function setupRoomBookingButtons() {
    const roomBookingButtons = document.querySelectorAll('.room-book a, .single-room .room-desc a[href="#"]');

    roomBookingButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const roomCard = this.closest('.single-room');
            handleRoomBookingClick(roomCard, this);
        });
    });
}

// Setup booking form submission
function setupBookingForm() {
    const bookingForms = document.querySelectorAll('.booking-form-wrap form, #bookingForm');

    bookingForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            handleBookingFormSubmission(this);
        });
    });
}

// Handle main booking button clicks (header, general booking buttons)
function handleMainBookingClick(e, button) {
    e.preventDefault();

    // Check if user is logged in
    if (!isAuthenticated()) {
        showBookingLoginModal();
        return;
    }

    // Redirect to booking page or show booking modal
    showBookingModal();
}

// Handle individual room booking
function handleRoomBookingClick(roomCard, button) {
    // Extract room information
    const roomInfo = extractRoomInfo(roomCard);

    // Check if user is logged in
    if (!isAuthenticated()) {
        showBookingLoginModal(roomInfo);
        return;
    }

    // Show room-specific booking modal
    showRoomBookingModal(roomInfo);
}

// Extract room information from room card
function extractRoomInfo(roomCard) {
    const roomTitle = roomCard.querySelector('h4 a, .room-desc h4 a');
    const roomPrice = roomCard.querySelector('.room-price p, .price');
    const roomCategory = roomCard.querySelector('.room-cat p, .room-cat a');
    const roomImage = roomCard.querySelector('.room-thumb img, .post-thumb img');
    const roomFeatures = roomCard.querySelectorAll('.room-info li');

    const features = [];
    roomFeatures.forEach(feature => {
        features.push(feature.textContent.trim());
    });

    return {
        title: roomTitle ? roomTitle.textContent.trim() : 'Room',
        price: roomPrice ? roomPrice.textContent.trim() : 'Contact for price',
        category: roomCategory ? roomCategory.textContent.trim() : 'Standard',
        image: roomImage ? roomImage.src : '../assets/img/rooms/default.jpg',
        features: features,
        element: roomCard
    };
}

// Show login modal for booking
function showBookingLoginModal(roomInfo = null) {
    const modalHtml = `
        <div class="modal fade" id="bookingLoginModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Đăng nhập để đặt phòng</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body text-center">
                        <p>Bạn cần đăng nhập để có thể đặt phòng.</p>
                        ${roomInfo ? `<p><strong>Phòng:</strong> ${roomInfo.title}</p>` : ''}
                        <div class="d-flex justify-content-center gap-3">
                            <a href="login.html${roomInfo ? '?redirect=' + encodeURIComponent(window.location.href) : ''}" 
                               class="btn filled-btn">Đăng nhập</a>
                            <a href="register.html" class="btn btn-outline-primary">Đăng ký</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('bookingLoginModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show modal
    $('#bookingLoginModal').modal('show');
}

// Show general booking modal
function showBookingModal() {
    const modalHtml = `
        <div class="modal fade" id="generalBookingModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Đặt phòng khách sạn</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="generalBookingForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Ngày nhận phòng</label>
                                        <input type="date" class="form-control" name="checkin" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Ngày trả phòng</label>
                                        <input type="date" class="form-control" name="checkout" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Số người lớn</label>
                                        <select class="form-control" name="adults" required>
                                            <option value="1">1 người</option>
                                            <option value="2" selected>2 người</option>
                                            <option value="3">3 người</option>
                                            <option value="4">4 người</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Số trẻ em</label>
                                        <select class="form-control" name="children">
                                            <option value="0" selected>0 trẻ em</option>
                                            <option value="1">1 trẻ em</option>
                                            <option value="2">2 trẻ em</option>
                                            <option value="3">3 trẻ em</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-group">
                                        <label>Ghi chú đặc biệt</label>
                                        <textarea class="form-control" name="notes" rows="3" 
                                                placeholder="Yêu cầu đặc biệt (nếu có)"></textarea>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
                        <button type="button" class="btn filled-btn" onclick="submitGeneralBooking()">Tìm phòng</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('generalBookingModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Set default dates
    setDefaultDates();

    // Show modal
    $('#generalBookingModal').modal('show');
}

// Show room-specific booking modal
function showRoomBookingModal(roomInfo) {
    const modalHtml = `
        <div class="modal fade" id="roomBookingModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Đặt phòng: ${roomInfo.title}</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                <img src="${roomInfo.image}" alt="${roomInfo.title}" class="img-fluid rounded">
                                <div class="mt-2">
                                    <h6>${roomInfo.title}</h6>
                                    <p class="text-primary font-weight-bold">${roomInfo.price}</p>
                                    <small class="text-muted">${roomInfo.category}</small>
                                </div>
                            </div>
                            <div class="col-md-8">
                                <form id="roomBookingForm" data-room-title="${roomInfo.title}">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label>Ngày nhận phòng</label>
                                                <input type="date" class="form-control" name="checkin" required>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label>Ngày trả phòng</label>
                                                <input type="date" class="form-control" name="checkout" required>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label>Số người lớn</label>
                                                <select class="form-control" name="adults" required>
                                                    <option value="1">1 người</option>
                                                    <option value="2" selected>2 người</option>
                                                    <option value="3">3 người</option>
                                                    <option value="4">4 người</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label>Số trẻ em</label>
                                                <select class="form-control" name="children">
                                                    <option value="0" selected>0 trẻ em</option>
                                                    <option value="1">1 trẻ em</option>
                                                    <option value="2">2 trẻ em</option>
                                                    <option value="3">3 trẻ em</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="form-group">
                                                <label>Ghi chú đặc biệt</label>
                                                <textarea class="form-control" name="notes" rows="3" 
                                                        placeholder="Yêu cầu đặc biệt (nếu có)"></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
                        <button type="button" class="btn filled-btn" onclick="submitRoomBooking()">Đặt phòng ngay</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('roomBookingModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Set default dates
    setDefaultDates();

    // Show modal
    $('#roomBookingModal').modal('show');
}

// Set default dates (today + 1 for checkin, today + 2 for checkout)
function setDefaultDates() {
    const today = new Date();
    const checkinDate = new Date(today);
    checkinDate.setDate(today.getDate() + 1);

    const checkoutDate = new Date(today);
    checkoutDate.setDate(today.getDate() + 2);

    const checkinInputs = document.querySelectorAll('input[name="checkin"]');
    const checkoutInputs = document.querySelectorAll('input[name="checkout"]');

    checkinInputs.forEach(input => {
        input.value = checkinDate.toISOString().split('T')[0];
        input.min = today.toISOString().split('T')[0];
    });

    checkoutInputs.forEach(input => {
        input.value = checkoutDate.toISOString().split('T')[0];
        input.min = checkinDate.toISOString().split('T')[0];
    });
}

// Handle booking form submission
function handleBookingFormSubmission(form) {
    const formData = new FormData(form);
    const bookingData = {
        checkin: formData.get('checkin'),
        checkout: formData.get('checkout'),
        adults: formData.get('adults'),
        children: formData.get('children'),
        notes: formData.get('notes')
    };

    // Validate dates
    if (!validateBookingDates(bookingData.checkin, bookingData.checkout)) {
        return;
    }

    // Submit booking
    submitBooking(bookingData);
}

// Submit general booking (redirect to rooms page with filters)
function submitGeneralBooking() {
    const form = document.getElementById('generalBookingForm');
    const formData = new FormData(form);

    const bookingData = {
        checkin: formData.get('checkin'),
        checkout: formData.get('checkout'),
        adults: formData.get('adults'),
        children: formData.get('children'),
        notes: formData.get('notes')
    };

    // Validate dates
    if (!validateBookingDates(bookingData.checkin, bookingData.checkout)) {
        return;
    }

    // Close modal
    $('#generalBookingModal').modal('hide');

    // Redirect to rooms page with search parameters
    const params = new URLSearchParams(bookingData);
    window.location.href = `room.html?${params.toString()}`;
}

// Submit room booking
function submitRoomBooking() {
    const form = document.getElementById('roomBookingForm');
    const formData = new FormData(form);

    const bookingData = {
        roomTitle: form.dataset.roomTitle,
        checkin: formData.get('checkin'),
        checkout: formData.get('checkout'),
        adults: formData.get('adults'),
        children: formData.get('children'),
        notes: formData.get('notes'),
        user: getCurrentUser()
    };

    // Validate dates
    if (!validateBookingDates(bookingData.checkin, bookingData.checkout)) {
        return;
    }

    // Show loading
    const submitButton = document.querySelector('#roomBookingModal .btn.filled-btn');
    showLoading(submitButton, 'Đang đặt phòng...');

    // Simulate booking submission (replace with actual API call)
    setTimeout(() => {
        hideLoading(submitButton);

        // Save booking locally (in real app, this would go to server)
        saveBookingLocally(bookingData);

        // Close modal
        $('#roomBookingModal').modal('hide');

        // Show success message
        showSuccess('Đặt phòng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.');

        // Redirect to booking confirmation or my bookings page
        setTimeout(() => {
            window.location.href = 'my-bookings.html';
        }, 2000);

    }, 2000);
}

// Validate booking dates
function validateBookingDates(checkin, checkout) {
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkinDate <= today) {
        showError('Ngày nhận phòng phải sau ngày hôm nay');
        return false;
    }

    if (checkoutDate <= checkinDate) {
        showError('Ngày trả phòng phải sau ngày nhận phòng');
        return false;
    }

    const daysDiff = (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 30) {
        showError('Thời gian lưu trú không được quá 30 ngày');
        return false;
    }

    return true;
}

// Save booking locally (replace with API call)
function saveBookingLocally(bookingData) {
    let bookings = JSON.parse(localStorage.getItem('userBookings') || '[]');

    const booking = {
        id: Date.now().toString(),
        ...bookingData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        totalAmount: calculateBookingAmount(bookingData)
    };

    bookings.push(booking);
    localStorage.setItem('userBookings', JSON.stringify(bookings));
}

// Calculate booking amount (simplified)
function calculateBookingAmount(bookingData) {
    const checkinDate = new Date(bookingData.checkin);
    const checkoutDate = new Date(bookingData.checkout);
    const nights = (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24);

    // Base price per night (in real app, this would come from room data)
    const basePrice = 180;
    const adultPrice = basePrice * parseInt(bookingData.adults);
    const childPrice = basePrice * 0.5 * parseInt(bookingData.children);

    return (adultPrice + childPrice) * nights;
}

// Initialize booking search from URL parameters (for rooms page)
function initializeBookingSearch() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('checkin')) {
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');
        const adults = urlParams.get('adults');
        const children = urlParams.get('children');

        // Show search criteria
        showBookingSearchCriteria({
            checkin, checkout, adults, children
        });

        // Filter rooms based on criteria
        filterRoomsByBookingCriteria({
            checkin, checkout, adults, children
        });
    }
}

// Show booking search criteria
function showBookingSearchCriteria(criteria) {
    const criteriaHtml = `
        <div class="booking-search-criteria bg-light p-3 mb-4 rounded">
            <h5>Tiêu chí tìm kiếm:</h5>
            <div class="row">
                <div class="col-md-3">
                    <strong>Nhận phòng:</strong> ${formatDate(criteria.checkin)}
                </div>
                <div class="col-md-3">
                    <strong>Trả phòng:</strong> ${formatDate(criteria.checkout)}
                </div>
                <div class="col-md-3">
                    <strong>Người lớn:</strong> ${criteria.adults}
                </div>
                <div class="col-md-3">
                    <strong>Trẻ em:</strong> ${criteria.children}
                </div>
            </div>
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="showBookingModal()">
                Thay đổi tiêu chí
            </button>
        </div>
    `;

    const roomsContainer = document.querySelector('.rooms-warp');
    if (roomsContainer) {
        roomsContainer.insertAdjacentHTML('afterbegin', criteriaHtml);
    }
}

// Filter rooms by booking criteria (simplified)
function filterRoomsByBookingCriteria(criteria) {
    // In a real application, this would make an API call to filter available rooms
    console.log('Filtering rooms by criteria:', criteria);

    // For now, just show all rooms with booking criteria applied
    const roomCards = document.querySelectorAll('.single-room');
    roomCards.forEach(room => {
        // Add booking criteria to room cards
        const bookButton = room.querySelector('.room-book a');
        if (bookButton) {
            bookButton.onclick = function (e) {
                e.preventDefault();
                const roomInfo = extractRoomInfo(room);
                // Pre-fill the booking modal with search criteria
                showRoomBookingModalWithCriteria(roomInfo, criteria);
            };
        }
    });
}

// Show room booking modal with pre-filled criteria
function showRoomBookingModalWithCriteria(roomInfo, criteria) {
    showRoomBookingModal(roomInfo);

    // Pre-fill form with criteria
    setTimeout(() => {
        document.querySelector('input[name="checkin"]').value = criteria.checkin;
        document.querySelector('input[name="checkout"]').value = criteria.checkout;
        document.querySelector('select[name="adults"]').value = criteria.adults;
        document.querySelector('select[name="children"]').value = criteria.children;
    }, 100);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

// Initialize booking search on page load (for rooms page)
if (window.location.pathname.includes('room.html')) {
    document.addEventListener('DOMContentLoaded', function () {
        initializeBookingSearch();
    });
}

// Export functions for global use
window.showBookingModal = showBookingModal;
window.submitGeneralBooking = submitGeneralBooking;
window.submitRoomBooking = submitRoomBooking; 
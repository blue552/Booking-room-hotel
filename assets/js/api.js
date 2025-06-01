// API Configuration
const API_CONFIG = {
    baseURL: 'http://localhost:3000', // API Gateway URL
    loadBalancerURL: 'http://localhost', // Nginx Load Balancer URL
    endpoints: {
        // User Service Endpoints
        user: {
            register: '/services/user/register',
            login: '/services/user/login',
            profile: '/services/user/profile',
            list: '/services/user'
        },
        // Room Service Endpoints
        room: {
            base: '/services/room',
            create: '/services/room',
            getAll: '/services/room',
            getById: (id) => `/services/room/${id}`
        },
        // Booking Service Endpoints
        booking: {
            base: '/bookings',
            create: '/bookings',
            getAll: '/bookings',
            getById: (id) => `/bookings/${id}`
        }
    }
};

// Utility function to make API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // Add authorization header if token exists
    const token = localStorage.getItem('authToken');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const finalOptions = { ...defaultOptions, ...options };

    // Merge headers properly
    if (options.headers) {
        finalOptions.headers = { ...defaultOptions.headers, ...options.headers };
    }

    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// User API Functions
const UserAPI = {
    async register(userData) {
        return await apiCall(API_CONFIG.endpoints.user.register, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    async login(credentials) {
        const response = await apiCall(API_CONFIG.endpoints.user.login, {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        // Store token if login successful
        if (response.token) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    async getProfile() {
        return await apiCall(API_CONFIG.endpoints.user.profile);
    },

    async getAllUsers() {
        return await apiCall(API_CONFIG.endpoints.user.list);
    },

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
};

// Room API Functions
const RoomAPI = {
    async create(roomData) {
        return await apiCall(API_CONFIG.endpoints.room.create, {
            method: 'POST',
            body: JSON.stringify(roomData)
        });
    },

    async getAll() {
        return await apiCall(API_CONFIG.endpoints.room.getAll);
    },

    async getById(roomId) {
        return await apiCall(API_CONFIG.endpoints.room.getById(roomId));
    },

    async update(roomId, roomData) {
        return await apiCall(`${API_CONFIG.endpoints.room.base}/${roomId}`, {
            method: 'PUT',
            body: JSON.stringify(roomData)
        });
    },

    async delete(roomId) {
        return await apiCall(`${API_CONFIG.endpoints.room.base}/${roomId}`, {
            method: 'DELETE'
        });
    }
};

// Booking API Functions
const BookingAPI = {
    async create(bookingData) {
        return await apiCall(API_CONFIG.endpoints.booking.create, {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
    },

    async getAll() {
        return await apiCall(API_CONFIG.endpoints.booking.getAll);
    },

    async getById(bookingId) {
        return await apiCall(API_CONFIG.endpoints.booking.getById(bookingId));
    },

    async update(bookingId, bookingData) {
        return await apiCall(`${API_CONFIG.endpoints.booking.base}/${bookingId}`, {
            method: 'PUT',
            body: JSON.stringify(bookingData)
        });
    },

    async cancel(bookingId) {
        return await apiCall(`${API_CONFIG.endpoints.booking.base}/${bookingId}`, {
            method: 'DELETE'
        });
    }
};

// Utility function to check authentication
function isAuthenticated() {
    return localStorage.getItem('authToken') !== null;
}

// Utility function to get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    return true;
}

// Export for use in other scripts
window.API_CONFIG = API_CONFIG;
window.UserAPI = UserAPI;
window.RoomAPI = RoomAPI;
window.BookingAPI = BookingAPI;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth; 
// Authentication and UI Helper Functions

// Show error message
function showError(message) {
    // Try to find alert container first
    let container = document.getElementById('alert-container');

    // If no alert container, create one or use body
    if (!container) {
        container = document.body;
    }

    // Remove existing error messages
    const existingErrors = container.querySelectorAll('.alert-danger');
    existingErrors.forEach(error => error.remove());

    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        ${message}
        <button type="button" class="close" onclick="this.parentElement.remove()">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    container.appendChild(errorDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Show success message
function showSuccess(message) {
    let container = document.getElementById('alert-container');

    if (!container) {
        container = document.body;
    }

    // Remove existing success messages
    const existingSuccess = container.querySelectorAll('.alert-success');
    existingSuccess.forEach(success => success.remove());

    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success alert-dismissible fade show';
    successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
        <button type="button" class="close" onclick="this.parentElement.remove()">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    container.appendChild(successDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 3000);
}

// Show loading state
function showLoading(button, text = 'Loading...') {
    if (button) {
        button.disabled = true;
        button.originalText = button.innerHTML;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    }
}

// Hide loading state
function hideLoading(button) {
    if (button && button.originalText) {
        button.disabled = false;
        button.innerHTML = button.originalText;
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const email = form.querySelector('input[name="email"], input[type="email"]').value;
    const password = form.querySelector('input[name="password"], input[type="password"]').value;

    if (!email || !password) {
        showError('Vui lòng nhập đầy đủ email và mật khẩu');
        return;
    }

    showLoading(submitButton, 'Đang đăng nhập...');

    try {
        const response = await UserAPI.login({ email, password });

        showSuccess('Đăng nhập thành công!');

        // Redirect to intended page or home
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || 'index.html';

        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1000);

    } catch (error) {
        showError(error.message || 'Đăng nhập thất bại');
    } finally {
        hideLoading(submitButton);
    }
}

// Handle registration form submission
async function handleRegister(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Get form data
    const formData = new FormData(form);
    const userData = {
        email: formData.get('email'),
        password: formData.get('password'),
        firstName: formData.get('firstName') || formData.get('first_name'),
        lastName: formData.get('lastName') || formData.get('last_name'),
        phone: formData.get('phone')
    };

    // Basic validation
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        showError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }

    // Password confirmation check
    const confirmPassword = formData.get('confirmPassword') || formData.get('confirm_password');
    if (confirmPassword && userData.password !== confirmPassword) {
        showError('Mật khẩu xác nhận không khớp');
        return;
    }

    showLoading(submitButton, 'Đang đăng ký...');

    try {
        const response = await UserAPI.register(userData);

        showSuccess('Đăng ký thành công! Chuyển hướng đến trang đăng nhập...');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        showError(error.message || 'Đăng ký thất bại');
    } finally {
        hideLoading(submitButton);
    }
}

// Handle logout
function handleLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        UserAPI.logout();
    }
}

// Update UI based on authentication status
function updateAuthUI() {
    const isLoggedIn = isAuthenticated();
    const user = getCurrentUser();

    // Update navigation links
    const loginLinks = document.querySelectorAll('.auth-login');
    const logoutLinks = document.querySelectorAll('.auth-logout');

    if (isLoggedIn && user) {
        // Hide login links, show logout links
        loginLinks.forEach(link => link.style.display = 'none');
        logoutLinks.forEach(link => link.style.display = 'block');

        // Update user info in dropdown
        const userName = document.querySelector('.user-name');
        const userAvatar = document.querySelector('.user-avatar');

        if (userName) {
            userName.textContent = `${user.firstName} ${user.lastName}`;
        }

        // Set default avatar or user avatar if available
        if (userAvatar) {
            // You can modify this to use user's actual avatar if available
            userAvatar.src = user.avatar || '../assets/img/icons/01.png';
            userAvatar.alt = `${user.firstName} ${user.lastName}`;
        }

        // Update user info elements (if any exist on other pages)
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(element => {
            element.style.display = 'block';
            element.textContent = `Xin chào, ${user.firstName} ${user.lastName}`;
        });

    } else {
        // Show login links, hide logout links
        loginLinks.forEach(link => link.style.display = 'block');
        logoutLinks.forEach(link => link.style.display = 'none');

        // Hide user info elements
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(element => element.style.display = 'none');
    }
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function () {
    // Update UI based on auth status
    updateAuthUI();

    // Add event listeners for forms
    const loginForm = document.querySelector('#loginForm, form[action*="login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.querySelector('#registerForm, form[action*="register"]');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Add event listeners for logout links
    const logoutLinks = document.querySelectorAll('.logout-link, [data-action="logout"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            handleLogout();
        });
    });
});

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format currency (VND)
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Export functions for global use
window.showError = showError;
window.showSuccess = showSuccess;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.updateAuthUI = updateAuthUI;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency; 
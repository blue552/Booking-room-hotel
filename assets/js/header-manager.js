// Header Manager - Automatically updates authentication state across all pages
// This script ensures consistent header behavior across all HTML pages

document.addEventListener('DOMContentLoaded', function () {
    // Initialize header authentication UI
    initializeHeaderAuth();

    // Update auth UI every time page loads
    updateAuthUI();

    // Listen for storage changes (for cross-tab login/logout sync)
    window.addEventListener('storage', function (e) {
        if (e.key === 'authToken' || e.key === 'user') {
            updateAuthUI();
        }
    });
});

function initializeHeaderAuth() {
    const topMenu = document.querySelector('.top-menu, #auth-navigation');

    if (!topMenu) return;

    // Check if header is already properly formatted
    const hasAuthStructure = topMenu.querySelector('.auth-login') && topMenu.querySelector('.auth-logout');

    if (!hasAuthStructure) {
        // Convert old header structure to new auth structure
        updateHeaderStructure(topMenu);
    }
}

function updateHeaderStructure(topMenu) {
    // Clear existing content
    topMenu.innerHTML = '';
    topMenu.id = 'auth-navigation';
    topMenu.className = 'top-menu list-inline d-inline ml-4';

    // Add auth structure
    topMenu.innerHTML = `
        <!-- Not logged in state -->
        <li class="auth-login">
            <a href="register.html">
                <i class="fa fa-user" aria-hidden="true"></i> Register
            </a>
        </li>
        <li class="auth-login">
            <a href="login.html">
                <i class="fa fa-lock" aria-hidden="true"></i> Login
            </a>
        </li>
        
        <!-- Logged in state -->
        <li class="auth-logout dropdown" style="display: none;">
            <a href="#" class="dropdown-toggle user-profile-link" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <img src="../assets/img/icons/01.png" alt="Avatar" class="user-avatar" width="20" height="20" style="border-radius: 50%; margin-right: 5px;">
                <span class="user-name">User Name</span>
                <i class="fa fa-chevron-down ml-2"></i>
            </a>
            <div class="dropdown-menu dropdown-menu-right">
                <a class="dropdown-item" href="profile.html">
                    <i class="fa fa-user mr-2"></i>Profile
                </a>
                <a class="dropdown-item" href="my-bookings.html">
                    <i class="fa fa-calendar-alt mr-2"></i>Đặt phòng của tôi
                </a>
               
                <a class="dropdown-item" href="change-password.html">
                    <i class="fa fa-key mr-2"></i>Đổi mật khẩu
                </a>
                <a class="dropdown-item" href="settings.html">
                    <i class="fa fa-cog mr-2"></i>Cài đặt
                </a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item logout-link" href="#" data-action="logout">
                    <i class="fa fa-sign-out-alt mr-2"></i>Đăng xuất
                </a>
            </div>
        </li>
    `;

    // Add event listener for logout ONLY
    const logoutLink = topMenu.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function (e) {
            e.preventDefault();
            handleLogout();
        });
    }

    // Initialize Bootstrap dropdown functionality
    initializeDropdown(topMenu);
}

function initializeDropdown(topMenu) {
    const dropdownToggle = topMenu.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
        // Remove any existing event listeners to prevent duplicates
        dropdownToggle.removeEventListener('click', handleDropdownClick);

        // Add proper Bootstrap dropdown behavior
        dropdownToggle.addEventListener('click', handleDropdownClick);

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            const dropdown = topMenu.querySelector('.dropdown');
            const dropdownMenu = topMenu.querySelector('.dropdown-menu');

            if (dropdown && dropdownMenu && !dropdown.contains(e.target)) {
                dropdownMenu.classList.remove('show');
                dropdownToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

function handleDropdownClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const dropdownMenu = this.nextElementSibling;
    const isOpen = dropdownMenu.classList.contains('show');

    // Close all other dropdowns first
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
        const toggle = menu.previousElementSibling;
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });

    // Toggle current dropdown
    if (!isOpen) {
        dropdownMenu.classList.add('show');
        this.setAttribute('aria-expanded', 'true');
    } else {
        dropdownMenu.classList.remove('show');
        this.setAttribute('aria-expanded', 'false');
    }
}

// Enhanced updateAuthUI function that works with dynamic headers
function updateAuthUI() {
    const isLoggedIn = isAuthenticated();
    const user = getCurrentUser();

    // Update navigation links
    const loginLinks = document.querySelectorAll('.auth-login');
    const logoutLinks = document.querySelectorAll('.auth-logout');

    if (isLoggedIn && user) {
        // Hide login links, show logout links
        loginLinks.forEach(link => {
            link.style.display = 'none';
        });
        logoutLinks.forEach(link => {
            link.style.display = 'block';
        });

        // Update user info in dropdown
        const userName = document.querySelector('.user-name');
        const userAvatar = document.querySelector('.user-avatar');

        if (userName) {
            userName.textContent = `${user.firstName} ${user.lastName}`;
        }

        if (userAvatar) {
            userAvatar.src = user.avatar || '../assets/img/icons/01.png';
            userAvatar.alt = `${user.firstName} ${user.lastName}`;
        }

        // Update any other user info elements
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(element => {
            element.style.display = 'block';
            element.textContent = `Xin chào, ${user.firstName} ${user.lastName}`;
        });

        // Update profile links if user is on profile page
        updateProfilePage(user);

        // Initialize dropdown for any new dropdown elements
        const authNavigation = document.querySelector('#auth-navigation');
        if (authNavigation) {
            initializeDropdown(authNavigation);
        }

    } else {
        // Show login links, hide logout links
        loginLinks.forEach(link => {
            link.style.display = 'block';
        });
        logoutLinks.forEach(link => {
            link.style.display = 'none';
        });

        // Hide user info elements
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(element => {
            element.style.display = 'none';
        });
    }
}

function updateProfilePage(user) {
    // Update profile page specific elements
    const profileName = document.querySelector('#profile-name, .profile-name');
    const profileEmail = document.querySelector('#profile-email, .profile-email');
    const profilePhone = document.querySelector('#profile-phone, .profile-phone');

    if (profileName) profileName.textContent = `${user.firstName} ${user.lastName}`;
    if (profileEmail) profileEmail.textContent = user.email;
    if (profilePhone && user.phone) profilePhone.textContent = user.phone;
}

// Export functions
window.initializeHeaderAuth = initializeHeaderAuth;
window.updateHeaderStructure = updateHeaderStructure; 
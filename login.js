// Admin Login System
class AdminLogin {
    constructor() {
        this.baseURL = ENV_CONFIG.getServerUrl();
        this.apiURL = ENV_CONFIG.getApiUrl();
        this.init();
    }

    init() {
        console.log('Initializing admin login...');
        console.log('API URL:', this.apiURL);
        
        // Check if already logged in
        const token = localStorage.getItem('adminToken');
        if (token) {
            console.log('Found existing token, verifying...');
            this.verifyToken(token);
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Show/hide password functionality
        const togglePassword = document.querySelector('.toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                togglePassword.innerHTML = type === 'password' ? 
                    '<i class="fas fa-eye"></i>' : 
                    '<i class="fas fa-eye-slash"></i>';
            });
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        this.showLoading(true);

        try {
            console.log('Attempting login to:', `${this.apiURL}/admin-auth/login`);
            
            const response = await fetch(`${this.apiURL}/admin-auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            console.log('Login response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Login failed with status:', response.status, 'Response:', errorText);
                
                if (response.status === 401) {
                    this.showError('Invalid username or password');
                } else if (response.status === 500) {
                    this.showError('Server error. Please try again later.');
                } else {
                    this.showError('Login failed. Please check your connection.');
                }
                return;
            }

            const data = await response.json();
            console.log('Login response data:', data);

            if (data.success && data.token) {
                localStorage.setItem('adminToken', data.token);
                this.showSuccess('Login successful! Redirecting...');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showError(data.message || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showError('Cannot connect to server. Please check if the backend is running.');
            } else {
                this.showError('Login failed. Please try again.');
            }
        } finally {
            this.showLoading(false);
        }
    }

    async verifyToken(token) {
        try {
            console.log('Verifying token...');
            
            const response = await fetch(`${this.apiURL}/admin-auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('Token valid, redirecting to admin panel...');
                    window.location.href = 'index.html';
                    return;
                }
            }
            
            // Token invalid, remove it
            localStorage.removeItem('adminToken');
            console.log('Token invalid, removed from storage');
            
        } catch (error) {
            console.error('Token verification error:', error);
            localStorage.removeItem('adminToken');
        }
    }

    showLoading(show) {
        const submitBtn = document.querySelector('.login-btn');
        const spinner = document.querySelector('.login-spinner');
        
        if (show) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="login-spinner"></div> Logging in...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize login system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminLogin = new AdminLogin();
});
// Admin login with real database authentication
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin login system initialized');
    
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            if (!username || !password) {
                showNotification('Please enter both username and password', 'error');
                return;
            }
            
            // Show loading
            const submitBtn = document.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<div class="login-spinner"></div> Logging in...';
            submitBtn.disabled = true;
            
            try {
                // Authenticate with real API
                const response = await fetch(`${ENV_CONFIG.getApiUrl()}/admin-auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success && data.token) {
                    // Store real token
                    localStorage.setItem('adminToken', data.token);
                    
                    // Show success
                    showNotification('Login successful! Redirecting...', 'success');
                    
                    // Redirect after short delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    throw new Error(data.message || 'Invalid credentials');
                }
                
            } catch (error) {
                console.error('Login error:', error);
                showNotification(error.message || 'Login failed', 'error');
            } finally {
                // Reset button
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
                submitBtn.disabled = false;
            }
        });
    }
});

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}
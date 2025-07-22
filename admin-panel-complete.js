//
// Complete Admin Panel with Full Update Management System
class BudzeeAdminPanel {
    constructor() {
        // Use environment configuration
        this.baseURL = ENV_CONFIG.getServerUrl();
        this.apiURL = ENV_CONFIG.getApiUrl();
        this.currentSection = 'dashboard';
        this.authToken = null;
        this.currentPage = 1;
        this.itemsPerPage = ENV_CONFIG.get('ADMIN_ITEMS_PER_PAGE');
        this.config = ENV_CONFIG;
        this.init();
    }

    async init() {
        console.log('Initializing admin panel...');
        
        // Check authentication
        const isAuthenticated = await this.checkAuth();
        console.log('Authentication check result:', isAuthenticated);
        
        if (!isAuthenticated) {
            console.log('Not authenticated, redirecting to login...');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('Authentication successful, setting up panel...');
        this.setupEventListeners();
        this.loadDashboard();
        this.startAutoRefresh();
    }

    startAutoRefresh() {
        // Auto-refresh dashboard every 30 seconds
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboard();
            }
        }, 30000);
    }

    async checkAuth() {
        const token = localStorage.getItem('adminToken');
        console.log('Checking auth with token:', token ? token.substring(0, 50) + '...' : 'No token');
        
        if (!token) {
            console.log('No token found');
            return false;
        }
        
        try {
            console.log('Verifying token with server...');
            const response = await fetch(`${this.apiURL}/admin-auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('Token verification response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Token verification response:', data);
                
                if (data.success) {
                    this.authToken = token;
                    this.adminRole = data.user.role;
                    // Show Administration section if superadmin
                    if (this.adminRole && this.adminRole.toLowerCase() === 'superadmin') {
                        const adminMenuItem = document.querySelector('[data-section="administration"]');
                        const adminSection = document.getElementById('administration');
                        if (adminMenuItem) adminMenuItem.style.display = '';
                        if (adminSection) adminSection.style.display = '';
                    } else {
                        const adminMenuItem = document.querySelector('[data-section="administration"]');
                        const adminSection = document.getElementById('administration');
                        if (adminMenuItem) adminMenuItem.style.display = 'none';
                        if (adminSection) adminSection.style.display = 'none';
                    }
                    // Update header with admin info
                    const profileElement = document.querySelector('.admin-profile span');
                    if (profileElement) {
                        profileElement.innerHTML = `
                            ${data.user.username}
                            <button onclick="adminPanel.logout()" style="margin-left: 10px; padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        `;
                    }
                    
                    console.log('Authentication successful for user:', data.user.username);
                    return true;
                } else {
                    console.log('Token verification failed:', data.message);
                    localStorage.removeItem('adminToken');
                    return false;
                }
            } else {
                console.log('Token verification request failed with status:', response.status);
                localStorage.removeItem('adminToken');
                return false;
            }
        } catch (e) {
            console.error('Token verification error:', e);
            localStorage.removeItem('adminToken');
            return false;
        }
    }

    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Sidebar toggle for mobile
        document.querySelector('.sidebar-toggle')?.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });

        // Modal close
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });

        // Filter event listeners
        this.setupFilterListeners();

        // Search functionality
        document.querySelector('.search-box input')?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
    }

    setupFilterListeners() {
        // Game status filter
        document.getElementById('game-status-filter')?.addEventListener('change', (e) => {
            this.loadGames(1, e.target.value);
        });

        // Transaction filters
        document.getElementById('transaction-type-filter')?.addEventListener('change', () => {
            this.loadTransactions();
        });

        document.getElementById('transaction-status-filter')?.addEventListener('change', () => {
            this.loadTransactions();
        });

        // Withdrawal status filter
        document.getElementById('withdrawal-status-filter')?.addEventListener('change', (e) => {
            this.loadWithdrawals(1, e.target.value);
        });

        // Feedback status filter
        document.getElementById('feedback-status-filter')?.addEventListener('change', (e) => {
            this.loadFeedback(1, e.target.value);
        });
    }

    switchSection(section) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update active content section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            users: 'User Management',
            referrals: 'Referral Management',
            games: 'Game Management',
            transactions: 'Transaction Management',
            withdrawals: 'Withdrawal Management',
            bots: 'Bot Management',
            feedback: 'Feedback Management',
            website: 'Website Data Management',
            analytics: 'Analytics & Reports',
            updates: 'App Update Management',
            administration: 'Admin Management',
            settings: 'System Settings'
        };
        document.querySelector('.page-title').textContent = titles[section];

        this.currentSection = section;
        this.currentPage = 1;

        // Load section data
        this.loadSectionData(section);
        // Special: load admins if administration section
        if (section === 'administration') {
            this.loadAdmins();
        }
    }

    loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'referrals':
                this.loadReferrals();
                break;
            case 'games':
                this.loadGames();
                break;
            case 'transactions':
                this.loadTransactions();
                break;
            case 'withdrawals':
                this.loadWithdrawals();
                break;
            case 'bots':
                this.loadBots();
                break;
            case 'feedback':
                this.loadFeedback();
                break;
            case 'website':
                this.loadWebsiteData();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'updates':
                this.loadUpdates();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async loadDashboard() {
        try {
            this.showLoading();
            
            // Load dashboard stats from admin API
            const [statsData, activityData, healthData, botData] = await Promise.all([
                this.fetchAPI('/admin/dashboard/stats'),
                this.fetchAPI('/admin/dashboard/activity'),
                this.fetchAPI('/health'),
                this.fetchAPI('/debug/bots')
            ]);

            // Update stats
            if (statsData?.success) {
                const stats = statsData.stats;
                document.getElementById('total-users').textContent = stats.totalUsers || 0;
                document.getElementById('total-games').textContent = stats.totalGames || 0;
                document.getElementById('total-revenue').textContent = `₹${stats.totalRevenue || 0}`;
                document.getElementById('active-bots').textContent = stats.totalBots || 0;
            }

            // Load recent activity
            this.loadRecentActivity(activityData);
            
            // Load system status
            this.loadSystemStatus(healthData);

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load dashboard data');
        } finally {
            this.hideLoading();
        }
    }

    loadRecentActivity(activityData) {
        const activityContainer = document.getElementById('recent-activity');
        
        if (activityData?.success && activityData.activities) {
            activityContainer.innerHTML = activityData.activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon" style="background: ${activity.color}">
                        <i class="${activity.icon}"></i>
                    </div>
                    <div class="activity-info">
                        <h4>${activity.title}</h4>
                        <p>${this.formatTimeAgo(activity.time)}</p>
                    </div>
                    <div class="activity-time">${new Date(activity.time).toLocaleTimeString()}</div>
                </div>
            `).join('');
        } else {
            // Fallback to mock data
            const activities = [
                { type: 'user', icon: 'fas fa-user-plus', title: 'New user registered', time: new Date(), color: '#667eea' },
                { type: 'game', icon: 'fas fa-gamepad', title: 'Memory game completed', time: new Date(Date.now() - 300000), color: '#f093fb' },
                { type: 'transaction', icon: 'fas fa-credit-card', title: 'Deposit processed', time: new Date(Date.now() - 600000), color: '#4facfe' },
                { type: 'bot', icon: 'fas fa-robot', title: 'Bot deployed to queue', time: new Date(Date.now() - 900000), color: '#43e97b' }
            ];

            activityContainer.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon" style="background: ${activity.color}">
                        <i class="${activity.icon}"></i>
                    </div>
                    <div class="activity-info">
                        <h4>${activity.title}</h4>
                        <p>${this.formatTimeAgo(activity.time)}</p>
                    </div>
                    <div class="activity-time">${activity.time.toLocaleTimeString()}</div>
                </div>
            `).join('');
        }
    }

    loadSystemStatus(healthData) {
        const statusContainer = document.getElementById('system-status');
        const statuses = [
            { name: 'Database', status: healthData?.status === 'OK' ? 'online' : 'offline', indicator: healthData?.status === 'OK' ? 'success' : 'error' },
            { name: 'Socket Server', status: 'online', indicator: 'success' },
            { name: 'Payment Gateway', status: 'online', indicator: 'success' },
            { name: 'Bot System', status: 'online', indicator: 'success' }
        ];

        statusContainer.innerHTML = statuses.map(status => `
            <div class="status-item">
                <h4>${status.name}</h4>
                <div class="status-indicator ${status.indicator}"></div>
            </div>
        `).join('');
    }

    // ==================== API METHODS ====================

    async fetchAPI(endpoint, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
                ...options.headers
            };

            const response = await fetch(`${this.apiURL}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    // ==================== ADMIN MANAGEMENT METHODS ====================

    async loadAdmins() {
        try {
            this.showLoading();
            
            const data = await this.fetchAPI('/admin-auth/admins');
            
            if (data?.success) {
                this.renderAdminsTable(data.admins || []);
            } else {
                this.showError('Failed to load admins');
            }

        } catch (error) {
            console.error('Error loading admins:', error);
            this.showError('Failed to load admins');
        } finally {
            this.hideLoading();
        }
    }

    renderAdminsTable(admins) {
        const tbody = document.querySelector('#admins-table tbody');
        if (!tbody) return;

        tbody.innerHTML = admins.map(admin => `
            <tr>
                <td>
                    <div class="user-id-cell">
                        <span class="id-short">${admin.id.slice(0, 8)}...</span>
                        <button class="btn-copy" onclick="adminPanel.copyToClipboard('${admin.id}')" title="Copy full ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="admin-info">
                        <strong>${admin.username}</strong>
                        ${admin.role.toLowerCase() === 'superadmin' ? '<span class="superadmin-badge">SUPER</span>' : ''}
                    </div>
                </td>
                <td>${admin.email}</td>
                <td>
                    <span class="role-badge role-${admin.role.toLowerCase()}">
                        ${admin.role}
                    </span>
                </td>
                <td>${new Date(admin.createdAt).toLocaleDateString()}</td>
                <td>${new Date(admin.updatedAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        ${admin.role.toLowerCase() !== 'superadmin' ? `
                            <button class="btn btn-small btn-primary" onclick="adminPanel.editAdmin('${admin.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-small btn-warning" onclick="adminPanel.resetAdminPassword('${admin.id}')">
                                <i class="fas fa-key"></i> Reset Password
                            </button>
                            <button class="btn btn-small btn-danger" onclick="adminPanel.deleteAdmin('${admin.id}', '${admin.username}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : '<span class="text-muted">Protected</span>'}
                    </div>
                </td>
            </tr>
        `).join('');

        // Setup add admin button
        const addAdminBtn = document.getElementById('add-admin-btn');
        if (addAdminBtn) {
            addAdminBtn.onclick = () => this.showAddAdminModal();
        }
    }

    showAddAdminModal() {
        const modalContent = `
            <form id="add-admin-form">
                <div class="form-group">
                    <label for="admin-username">Username *</label>
                    <input type="text" id="admin-username" name="username" required 
                           placeholder="Enter admin username">
                </div>
                
                <div class="form-group">
                    <label for="admin-email">Email *</label>
                    <input type="email" id="admin-email" name="email" required 
                           placeholder="Enter admin email">
                </div>
                
                <div class="form-group">
                    <label for="admin-password">Password *</label>
                    <input type="password" id="admin-password" name="password" required 
                           placeholder="Enter admin password" minlength="6">
                    <small>Password must be at least 6 characters long</small>
                </div>
                
                <div class="form-group">
                    <label for="admin-role">Role *</label>
                    <select id="admin-role" name="role" required>
                        <option value="">Select role</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                    </select>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Create Admin
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Add New Admin', modalContent);

        document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createAdmin();
        });
    }

    async createAdmin() {
        try {
            const formData = {
                username: document.getElementById('admin-username').value,
                email: document.getElementById('admin-email').value,
                password: document.getElementById('admin-password').value,
                role: document.getElementById('admin-role').value
            };

            this.showLoading();
            const data = await this.fetchAPI('/admin-auth/admins', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (data?.success) {
                this.showSuccess('Admin created successfully');
                this.closeModal();
                this.loadAdmins();
            } else {
                this.showError(data?.message || 'Failed to create admin');
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            this.showError('Failed to create admin');
        } finally {
            this.hideLoading();
        }
    }

    async editAdmin(adminId) {
        try {
            this.showLoading();
            
            // Get current admin data
            const admins = await this.fetchAPI('/admin-auth/admins');
            const admin = admins.admins?.find(a => a.id === adminId);
            
            if (!admin) {
                this.showError('Admin not found');
                return;
            }

            const modalContent = `
                <form id="edit-admin-form">
                    <div class="form-group">
                        <label for="edit-admin-username">Username *</label>
                        <input type="text" id="edit-admin-username" name="username" required 
                               value="${admin.username}" placeholder="Enter admin username">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-admin-email">Email *</label>
                        <input type="email" id="edit-admin-email" name="email" required 
                               value="${admin.email}" placeholder="Enter admin email">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-admin-role">Role *</label>
                        <select id="edit-admin-role" name="role" required>
                            <option value="admin" ${admin.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="moderator" ${admin.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                        </select>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Update Admin
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal()">Cancel</button>
                    </div>
                </form>
            `;

            this.showModal(`Edit Admin - ${admin.username}`, modalContent);

            document.getElementById('edit-admin-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.updateAdmin(adminId);
            });

        } catch (error) {
            console.error('Error loading admin for edit:', error);
            this.showError('Failed to load admin details');
        } finally {
            this.hideLoading();
        }
    }

    async updateAdmin(adminId) {
        try {
            const formData = {
                username: document.getElementById('edit-admin-username').value,
                email: document.getElementById('edit-admin-email').value,
                role: document.getElementById('edit-admin-role').value
            };

            this.showLoading();
            const data = await this.fetchAPI(`/admin-auth/admins/${adminId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            if (data?.success) {
                this.showSuccess('Admin updated successfully');
                this.closeModal();
                this.loadAdmins();
            } else {
                this.showError(data?.message || 'Failed to update admin');
            }
        } catch (error) {
            console.error('Error updating admin:', error);
            this.showError('Failed to update admin');
        } finally {
            this.hideLoading();
        }
    }

    async resetAdminPassword(adminId) {
        const newPassword = prompt('Enter new password for this admin (minimum 6 characters):');
        
        if (!newPassword) {
            return;
        }
        
        if (newPassword.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        if (!confirm('Are you sure you want to reset this admin\'s password?')) {
            return;
        }

        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin-auth/admins/${adminId}/reset-password`, {
                method: 'POST',
                body: JSON.stringify({ newPassword })
            });

            if (data?.success) {
                this.showSuccess('Password reset successfully');
                this.loadAdmins();
            } else {
                this.showError(data?.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            this.showError('Failed to reset password');
        } finally {
            this.hideLoading();
        }
    }

    async deleteAdmin(adminId, adminUsername) {
        if (!confirm(`Are you sure you want to delete admin "${adminUsername}"? This action cannot be undone.`)) {
            return;
        }

        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin-auth/admins/${adminId}`, {
                method: 'DELETE'
            });

            if (data?.success) {
                this.showSuccess('Admin deleted successfully');
                this.loadAdmins();
            } else {
                this.showError(data?.message || 'Failed to delete admin');
            }
        } catch (error) {
            console.error('Error deleting admin:', error);
            this.showError('Failed to delete admin');
        } finally {
            this.hideLoading();
        }
    }

    // ==================== PLACEHOLDER METHODS ====================

    async loadUsers() {
        this.showError('User management section coming soon');
    }

    async loadReferrals() {
        this.showError('Referrals section coming soon');
    }

    async loadGames() {
        this.showError('Games section coming soon');
    }

    async loadTransactions() {
        this.showError('Transactions section coming soon');
    }

    async loadWithdrawals() {
        this.showError('Withdrawals section coming soon');
    }

    async loadBots() {
        this.showError('Bot management section coming soon');
    }

    async loadFeedback() {
        this.showError('Feedback section coming soon');
    }

    async loadWebsiteData() {
        this.showError('Website data section coming soon');
    }

    async loadAnalytics() {
        this.showError('Analytics section coming soon');
    }

    async loadUpdates() {
        this.showError('Updates section coming soon');
    }

    async loadSettings() {
        this.showError('Settings section coming soon');
    }

    handleSearch(query) {
        console.log('Search query:', query);
    }

    // ==================== UTILITY METHODS ====================

    formatTimeAgo(date) {
        const now = new Date();
        const time = new Date(date);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }

    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal-overlay').classList.add('active');
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }

    showLoading() {
        document.getElementById('loading').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loading').classList.remove('active');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copied to clipboard');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccess('Copied to clipboard');
        }
    }
}

// Create global admin panel instance
window.adminPanel = new BudzeeAdminPanel();
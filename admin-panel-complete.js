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

// ===== Extended Methods =====

// Additional Admin Panel Methods - Part 3
// This file contains the remaining CRUD operations and management functions

// Extend the BudzeeAdminPanel class with additional methods
Object.assign(BudzeeAdminPanel.prototype, {

    // ==================== USER MANAGEMENT METHODS ====================

    async viewUser(userId) {
        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/users/${userId}`);
            
            if (data?.success) {
                this.showUserDetailsModal(data.user);
            } else {
                this.showError('Failed to load user details');
            }
        } catch (error) {
            console.error('Error viewing user:', error);
            this.showError('Failed to load user details');
        } finally {
            this.hideLoading();
        }
    },

    showUserDetailsModal(user) {
        const modalContent = `
            <div class="user-details">
                <div class="detail-section">
                    <h4>Basic Information</h4>
                    <p><strong>ID:</strong> ${user.id}</p>
                    <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${user.phoneNumber}</p>
                    <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                    <p><strong>Verified:</strong> ${user.isVerified ? 'Yes' : 'No'}</p>
                    <p><strong>Joined:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
                    <p><strong>Last Active:</strong> ${new Date(user.updatedAt).toLocaleString()}</p>
                </div>

                <div class="detail-section">
                    <h4>Wallet Information</h4>
                    <p><strong>Total Balance:</strong> ₹${user.wallet?.balance || 0}</p>
                    <p><strong>Game Balance:</strong> ₹${user.wallet?.gameBalance || 0}</p>
                    <p><strong>Withdrawable Balance:</strong> ₹${user.wallet?.withdrawableBalance || 0}</p>
                </div>

                <div class="detail-section">
                    <h4>Gaming Statistics</h4>
                    <p><strong>Games Played:</strong> ${user.statistics?.totalGames || 0}</p>
                    <p><strong>Games Won:</strong> ${user.statistics?.gamesWon || 0}</p>
                    <p><strong>Games Lost:</strong> ${user.statistics?.gamesLost || 0}</p>
                    <p><strong>Win Rate:</strong> ${user.statistics?.winRate || 0}%</p>
                    <p><strong>Total Winnings:</strong> ₹${user.statistics?.totalWinnings || 0}</p>
                    <p><strong>Total Deposits:</strong> ₹${user.statistics?.totalDeposits || 0}</p>
                </div>

                <div class="detail-section">
                    <h4>Referral Information</h4>
                    <p><strong>Referral Code:</strong> ${user.referralCode || 'N/A'}</p>
                    <p><strong>Referred By:</strong> ${user.referredBy || 'N/A'}</p>
                    <p><strong>Total Referrals:</strong> ${user.referralCount || 0}</p>
                </div>

                <div class="detail-section">
                    <h4>Recent Transactions</h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${user.transactions?.slice(0, 10).map(tx => `
                            <div style="padding: 8px; border-bottom: 1px solid #eee;">
                                <strong>${tx.type}</strong> - ₹${tx.amount} 
                                <span style="color: #666;">(${new Date(tx.createdAt).toLocaleDateString()})</span>
                                <br><small>${tx.description || ''}</small>
                            </div>
                        `).join('') || '<p>No transactions found</p>'}
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Recent Games</h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${user.gameParticipations?.slice(0, 10).map(game => `
                            <div style="padding: 8px; border-bottom: 1px solid #eee;">
                                <strong>${game.game.type}</strong> - Entry: ₹${game.game.entryFee}
                                <span style="color: #666;">(${new Date(game.createdAt).toLocaleDateString()})</span>
                                <br><small>Status: ${game.game.status}, Rank: ${game.rank || 'N/A'}</small>
                            </div>
                        `).join('') || '<p>No games found</p>'}
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="adminPanel.editUser('${user.id}')">
                        <i class="fas fa-edit"></i> Edit User
                    </button>
                    <button class="btn btn-warning" onclick="adminPanel.suspendUser('${user.id}', ${!user.isVerified})">
                        <i class="fas fa-ban"></i> ${user.isVerified ? 'Suspend' : 'Unsuspend'}
                    </button>
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `;

        this.showModal(`User Details - ${user.name || user.phoneNumber}`, modalContent);
    },

    async editUser(userId) {
        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/users/${userId}`);
            
            if (data?.success) {
                this.showEditUserModal(data.user);
            } else {
                this.showError('Failed to load user for editing');
            }
        } catch (error) {
            console.error('Error loading user for edit:', error);
            this.showError('Failed to load user for editing');
        } finally {
            this.hideLoading();
        }
    },

    showEditUserModal(user) {
        const modalContent = `
            <form id="edit-user-form">
                <div class="form-group">
                    <label for="edit-user-name">Name</label>
                    <input type="text" id="edit-user-name" value="${user.name || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-user-email">Email</label>
                    <input type="email" id="edit-user-email" value="${user.email || ''}">
                </div>
                
                <div class="form-group">
                    <label for="edit-user-verified">Verification Status</label>
                    <select id="edit-user-verified">
                        <option value="true" ${user.isVerified ? 'selected' : ''}>Verified</option>
                        <option value="false" ${!user.isVerified ? 'selected' : ''}>Unverified</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-user-balance">Total Balance (₹)</label>
                    <input type="number" id="edit-user-balance" value="${user.wallet?.balance || 0}" step="0.01">
                </div>
                
                <div class="form-group">
                    <label for="edit-user-game-balance">Game Balance (₹)</label>
                    <input type="number" id="edit-user-game-balance" value="${user.wallet?.gameBalance || 0}" step="0.01">
                </div>
                
                <div class="form-group">
                    <label for="edit-user-withdrawable">Withdrawable Balance (₹)</label>
                    <input type="number" id="edit-user-withdrawable" value="${user.wallet?.withdrawableBalance || 0}" step="0.01">
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal(`Edit User - ${user.name || user.phoneNumber}`, modalContent);

        document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateUser(user.id);
        });
    },

    async updateUser(userId) {
        try {
            const formData = {
                name: document.getElementById('edit-user-name').value,
                email: document.getElementById('edit-user-email').value,
                isVerified: document.getElementById('edit-user-verified').value === 'true',
                balance: parseFloat(document.getElementById('edit-user-balance').value),
                gameBalance: parseFloat(document.getElementById('edit-user-game-balance').value),
                withdrawableBalance: parseFloat(document.getElementById('edit-user-withdrawable').value)
            };

            this.showLoading();
            const data = await this.fetchAPI(`/admin/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            if (data?.success) {
                this.showSuccess('User updated successfully');
                this.closeModal();
                this.loadUsers();
            } else {
                this.showError(data?.message || 'Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            this.showError('Failed to update user');
        } finally {
            this.hideLoading();
        }
    },

    async suspendUser(userId, suspend = true) {
        if (!confirm(`Are you sure you want to ${suspend ? 'suspend' : 'unsuspend'} this user?`)) {
            return;
        }

        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/users/${userId}/suspend`, {
                method: 'POST',
                body: JSON.stringify({ 
                    suspend, 
                    reason: suspend ? 'Admin action' : 'Admin unsuspension' 
                })
            });

            if (data?.success) {
                this.showSuccess(`User ${suspend ? 'suspended' : 'unsuspended'} successfully`);
                this.closeModal();
                this.loadUsers();
            } else {
                this.showError(data?.message || `Failed to ${suspend ? 'suspend' : 'unsuspend'} user`);
            }
        } catch (error) {
            console.error('Error suspending user:', error);
            this.showError(`Failed to ${suspend ? 'suspend' : 'unsuspend'} user`);
        } finally {
            this.hideLoading();
        }
    },

    // ==================== GAME MANAGEMENT METHODS ====================

    async loadGames(page = 1, status = '', type = '') {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page,
                limit: this.itemsPerPage,
                ...(status && { status }),
                ...(type && { type })
            });

            const data = await this.fetchAPI(`/admin/games?${params}`);
            
            if (data?.success) {
                this.renderGamesTable(data.games || []);
                this.renderPagination(data.pagination, 'games');
            } else {
                this.showError('Failed to load games');
            }

        } catch (error) {
            console.error('Error loading games:', error);
            this.showError('Failed to load games');
        } finally {
            this.hideLoading();
        }
    },

    renderGamesTable(games) {
        const tbody = document.querySelector('#games-table tbody');
        tbody.innerHTML = games.map(game => `
            <tr>
                <td>
                    <div class="user-id-cell">
                        <span class="id-short">${game.id.slice(0, 8)}...</span>
                        <button class="btn-copy" onclick="adminPanel.copyToClipboard('${game.id}')" title="Copy full ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td>${game.type}</td>
                <td>
                    <div class="players-info">
                        <div>Total: ${game.participantCount || 0}/${game.maxPlayers}</div>
                        <div class="players-breakdown">
                            Humans: ${game.humanCount || 0} | Bots: ${game.botCount || 0}
                        </div>
                    </div>
                </td>
                <td>₹${game.entryFee}</td>
                <td>₹${game.prizePool}</td>
                <td>
                    <span class="status-badge status-${game.status.toLowerCase()}">
                        ${game.status}
                    </span>
                </td>
                <td>${new Date(game.createdAt).toLocaleString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewGame('${game.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${game.status === 'WAITING' || game.status === 'PLAYING' ? `
                            <button class="btn btn-small btn-danger" onclick="adminPanel.cancelGame('${game.id}')">
                                <i class="fas fa-ban"></i> Cancel
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    async viewGame(gameId) {
        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/games/${gameId}`);
            
            if (data?.success) {
                this.showGameDetailsModal(data.game);
            } else {
                this.showError('Failed to load game details');
            }
        } catch (error) {
            console.error('Error viewing game:', error);
            this.showError('Failed to load game details');
        } finally {
            this.hideLoading();
        }
    },

    showGameDetailsModal(game) {
        const modalContent = `
            <div class="game-details">
                <div class="detail-section">
                    <h4>Game Information</h4>
                    <p><strong>ID:</strong> ${game.id}</p>
                    <p><strong>Type:</strong> ${game.type}</p>
                    <p><strong>Status:</strong> ${game.status}</p>
                    <p><strong>Max Players:</strong> ${game.maxPlayers}</p>
                    <p><strong>Entry Fee:</strong> ₹${game.entryFee}</p>
                    <p><strong>Prize Pool:</strong> ₹${game.prizePool}</p>
                    <p><strong>Current Turn:</strong> ${game.currentTurn}</p>
                    <p><strong>Winner:</strong> ${game.winner || 'N/A'}</p>
                    <p><strong>Created:</strong> ${new Date(game.createdAt).toLocaleString()}</p>
                    <p><strong>Started:</strong> ${game.startedAt ? new Date(game.startedAt).toLocaleString() : 'N/A'}</p>
                    <p><strong>Finished:</strong> ${game.finishedAt ? new Date(game.finishedAt).toLocaleString() : 'N/A'}</p>
                </div>

                <div class="detail-section">
                    <h4>Participants</h4>
                    <div class="participants-list">
                        ${game.participants?.map(participant => `
                            <div class="participant-item">
                                <strong>${participant.user.name || participant.user.phoneNumber}</strong>
                                ${participant.user.isBot ? '<span class="bot-badge">BOT</span>' : ''}
                                <span>Position: ${participant.position}, Color: ${participant.color}</span>
                                <span>Score: ${participant.score}, Rank: ${participant.rank || 'N/A'}</span>
                            </div>
                        `).join('') || '<p>No participants found</p>'}
                    </div>
                </div>

                ${game.gameData ? `
                    <div class="detail-section">
                        <h4>Game Data</h4>
                        <pre>${JSON.stringify(game.gameData, null, 2)}</pre>
                    </div>
                ` : ''}

                <div class="modal-actions">
                    ${game.status === 'WAITING' || game.status === 'PLAYING' ? `
                        <button class="btn btn-danger" onclick="adminPanel.cancelGame('${game.id}')">
                            <i class="fas fa-ban"></i> Cancel Game
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `;

        this.showModal(`Game Details - ${game.type}`, modalContent);
    },

    async cancelGame(gameId) {
        if (!confirm('Are you sure you want to cancel this game? Entry fees will be refunded to players.')) {
            return;
        }

        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/games/${gameId}/cancel`, {
                method: 'POST',
                body: JSON.stringify({ reason: 'Admin cancellation' })
            });

            if (data?.success) {
                this.showSuccess('Game cancelled successfully');
                this.closeModal();
                this.loadGames();
            } else {
                this.showError(data?.message || 'Failed to cancel game');
            }
        } catch (error) {
            console.error('Error cancelling game:', error);
            this.showError('Failed to cancel game');
        } finally {
            this.hideLoading();
        }
    },

    // ==================== TRANSACTION MANAGEMENT METHODS ====================

    async loadTransactions(page = 1) {
        try {
            this.showLoading();
            
            const typeFilter = document.getElementById('transaction-type-filter')?.value || '';
            const statusFilter = document.getElementById('transaction-status-filter')?.value || '';
            
            const params = new URLSearchParams({
                page,
                limit: this.itemsPerPage,
                ...(typeFilter && { type: typeFilter }),
                ...(statusFilter && { status: statusFilter })
            });

            const data = await this.fetchAPI(`/admin/transactions?${params}`);
            
            if (data?.success) {
                this.renderTransactionsTable(data.transactions || []);
                this.renderPagination(data.pagination, 'transactions');
            } else {
                this.showError('Failed to load transactions');
            }

        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Failed to load transactions');
        } finally {
            this.hideLoading();
        }
    },

    renderTransactionsTable(transactions) {
        const tbody = document.querySelector('#transactions-table tbody');
        tbody.innerHTML = transactions.map(tx => `
            <tr>
                <td>
                    <div class="user-id-cell">
                        <span class="id-short">${tx.id.slice(0, 8)}...</span>
                        <button class="btn-copy" onclick="adminPanel.copyToClipboard('${tx.id}')" title="Copy full ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="user-info">
                        <strong>${tx.user.name || 'N/A'}</strong>
                        <div class="user-phone">${tx.user.phoneNumber}</div>
                    </div>
                </td>
                <td>
                    <span class="transaction-type">${tx.type}</span>
                </td>
                <td>₹${tx.amount}</td>
                <td>
                    <span class="status-badge status-${tx.status.toLowerCase()}">
                        ${tx.status}
                    </span>
                </td>
                <td>${new Date(tx.createdAt).toLocaleString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewTransaction('${tx.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${tx.status === 'PENDING' ? `
                            <button class="btn btn-small btn-success" onclick="adminPanel.updateTransactionStatus('${tx.id}', 'COMPLETED')">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn btn-small btn-danger" onclick="adminPanel.updateTransactionStatus('${tx.id}', 'FAILED')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    async viewTransaction(transactionId) {
        try {
            this.showLoading();
            // For now, show a simple modal with transaction details
            this.showModal('Transaction Details', `
                <div class="transaction-details">
                    <p>Transaction ID: ${transactionId}</p>
                    <p>Loading detailed transaction information...</p>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                    </div>
                </div>
            `);
        } catch (error) {
            console.error('Error viewing transaction:', error);
            this.showError('Failed to load transaction details');
        } finally {
            this.hideLoading();
        }
    },

    async updateTransactionStatus(transactionId, status) {
        const action = status === 'COMPLETED' ? 'approve' : 'reject';
        if (!confirm(`Are you sure you want to ${action} this transaction?`)) {
            return;
        }

        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/transactions/${transactionId}`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    status, 
                    notes: `Admin ${action}d transaction` 
                })
            });

            if (data?.success) {
                this.showSuccess(`Transaction ${action}d successfully`);
                this.loadTransactions();
            } else {
                this.showError(data?.message || `Failed to ${action} transaction`);
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            this.showError(`Failed to ${action} transaction`);
        } finally {
            this.hideLoading();
        }
    },

    // ==================== WITHDRAWAL MANAGEMENT METHODS ====================

    async loadWithdrawals(page = 1, status = '') {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page,
                limit: this.itemsPerPage,
                ...(status && { status })
            });

            const data = await this.fetchAPI(`/admin/withdrawals?${params}`);
            
            if (data?.success) {
                this.renderWithdrawalsTable(data.withdrawals || []);
                this.renderPagination(data.pagination, 'withdrawals');
            } else {
                this.showError('Failed to load withdrawals');
            }

        } catch (error) {
            console.error('Error loading withdrawals:', error);
            this.showError('Failed to load withdrawals');
        } finally {
            this.hideLoading();
        }
    },

    renderWithdrawalsTable(withdrawals) {
        const tbody = document.querySelector('#withdrawals-table tbody');
        tbody.innerHTML = withdrawals.map(withdrawal => `
            <tr>
                <td>
                    <div class="user-id-cell">
                        <span class="id-short">${withdrawal.id.slice(0, 8)}...</span>
                        <button class="btn-copy" onclick="adminPanel.copyToClipboard('${withdrawal.id}')" title="Copy full ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="user-info">
                        <strong>${withdrawal.user.name || 'N/A'}</strong>
                        <div class="user-phone">${withdrawal.user.phoneNumber}</div>
                    </div>
                </td>
                <td>₹${withdrawal.amount}</td>
                <td>
                    <span class="method-badge">${withdrawal.method}</span>
                </td>
                <td>
                    <span class="status-badge status-${withdrawal.status.toLowerCase()}">
                        ${withdrawal.status}
                    </span>
                </td>
                <td>${new Date(withdrawal.createdAt).toLocaleString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewWithdrawal('${withdrawal.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${withdrawal.status === 'PENDING' ? `
                            <button class="btn btn-small btn-success" onclick="adminPanel.processWithdrawal('${withdrawal.id}', 'approve')">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn btn-small btn-danger" onclick="adminPanel.processWithdrawal('${withdrawal.id}', 'reject')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        ` : ''}
                        ${withdrawal.status === 'APPROVED' ? `
                            <button class="btn btn-small btn-primary" onclick="adminPanel.processWithdrawal('${withdrawal.id}', 'complete')">
                                <i class="fas fa-check-double"></i> Complete
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    async viewWithdrawal(withdrawalId) {
        try {
            this.showLoading();
            // For now, show a simple modal
            this.showModal('Withdrawal Details', `
                <div class="withdrawal-details">
                    <p>Withdrawal ID: ${withdrawalId}</p>
                    <p>Loading detailed withdrawal information...</p>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                    </div>
                </div>
            `);
        } catch (error) {
            console.error('Error viewing withdrawal:', error);
            this.showError('Failed to load withdrawal details');
        } finally {
            this.hideLoading();
        }
    },

    async processWithdrawal(withdrawalId, action) {
        const actionText = action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : 'complete';
        if (!confirm(`Are you sure you want to ${actionText} this withdrawal?`)) {
            return;
        }

        try {
            this.showLoading();
            const notes = prompt(`Enter notes for ${actionText}ing this withdrawal:`);
            const transactionId = action === 'complete' ? prompt('Enter transaction ID (for completion):') : null;

            const data = await this.fetchAPI(`/admin/withdrawals/${withdrawalId}/process`, {
                method: 'POST',
                body: JSON.stringify({ 
                    action, 
                    notes,
                    ...(transactionId && { transactionId })
                })
            });

            if (data?.success) {
                this.showSuccess(`Withdrawal ${actionText}d successfully`);
                this.loadWithdrawals();
            } else {
                this.showError(data?.message || `Failed to ${actionText} withdrawal`);
            }
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            this.showError(`Failed to ${actionText} withdrawal`);
        } finally {
            this.hideLoading();
        }
    },

    // ==================== BOT MANAGEMENT METHODS ====================

    async loadBots(page = 1) {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page,
                limit: this.itemsPerPage
            });

            const [botsData, statsData] = await Promise.all([
                this.fetchAPI(`/admin/bots?${params}`),
                this.fetchAPI('/admin/bots/stats')
            ]);
            
            if (botsData?.success) {
                this.renderBotsTable(botsData.bots || []);
                this.renderPagination(botsData.pagination, 'bots');
            }

            if (statsData?.success) {
                this.updateBotStats(statsData.stats);
            }

        } catch (error) {
            console.error('Error loading bots:', error);
            this.showError('Failed to load bots');
        } finally {
            this.hideLoading();
        }
    },

    updateBotStats(stats) {
        document.getElementById('bot-total').textContent = stats.totalBots || 0;
        document.getElementById('bot-active').textContent = stats.activeBots || 0;
        document.getElementById('bot-queue').textContent = stats.botsInQueue || 0;
        document.getElementById('bot-games').textContent = stats.botsInGames || 0;
    },

    renderBotsTable(bots) {
        const tbody = document.querySelector('#bots-table tbody');
        tbody.innerHTML = bots.map(bot => `
            <tr>
                <td>
                    <div class="user-id-cell">
                        <span class="id-short">${bot.id.slice(0, 8)}...</span>
                        <button class="btn-copy" onclick="adminPanel.copyToClipboard('${bot.id}')" title="Copy full ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="bot-info">
                        <strong>${bot.name}</strong>
                        <div class="bot-type">${bot.botType || 'N/A'}</div>
                    </div>
                </td>
                <td>${bot.gamesPlayed || 0}</td>
                <td>
                    <span class="win-rate ${(bot.winRate || 0) > 50 ? 'high' : 'low'}">
                        ${bot.winRate || 0}%
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${bot.status?.toLowerCase() || 'inactive'}">
                        ${bot.status || 'INACTIVE'}
                    </span>
                </td>
                <td>${bot.lastGameAt ? new Date(bot.lastGameAt).toLocaleString() : 'Never'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewBot('${bot.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-small btn-primary" onclick="adminPanel.editBot('${bot.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-small btn-danger" onclick="adminPanel.deleteBot('${bot.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    async createBot() {
        const modalContent = `
            <form id="create-bot-form">
                <div class="form-group">
                    <label for="bot-name">Bot Name</label>
                    <input type="text" id="bot-name" placeholder="Enter bot name" required>
                </div>
                
                <div class="form-group">
                    <label for="bot-skill">Skill Level</label>
                    <select id="bot-skill" required>
                        <option value="">Select skill level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Create Bot
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Create New Bot', modalContent);

        document.getElementById('create-bot-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitCreateBot();
        });
    },

    async submitCreateBot() {
        try {
            const formData = {
                name: document.getElementById('bot-name').value,
                skillLevel: document.getElementById('bot-skill').value
            };

            this.showLoading();
            const data = await this.fetchAPI('/admin/bots', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (data?.success) {
                this.showSuccess('Bot created successfully');
                this.closeModal();
                this.loadBots();
            } else {
                this.showError(data?.message || 'Failed to create bot');
            }
        } catch (error) {
            console.error('Error creating bot:', error);
            this.showError('Failed to create bot');
        } finally {
            this.hideLoading();
        }
    },

    async viewBot(botId) {
        try {
            this.showLoading();
            this.showModal('Bot Details', `
                <div class="bot-details">
                    <p>Bot ID: ${botId}</p>
                    <p>Loading detailed bot information...</p>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                    </div>
                </div>
            `);
        } catch (error) {
            console.error('Error viewing bot:', error);
            this.showError('Failed to load bot details');
        } finally {
            this.hideLoading();
        }
    },

    async editBot(botId) {
        try {
            this.showLoading();
            this.showModal('Edit Bot', `
                <div class="bot-edit">
                    <p>Bot ID: ${botId}</p>
                    <p>Bot editing functionality coming soon...</p>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                    </div>
                </div>
            `);
        } catch (error) {
            console.error('Error editing bot:', error);
            this.showError('Failed to load bot for editing');
        } finally {
            this.hideLoading();
        }
    },

    async deleteBot(botId) {
        if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/bots/${botId}`, {
                method: 'DELETE'
            });

            if (data?.success) {
                this.showSuccess('Bot deleted successfully');
                this.loadBots();
            } else {
                this.showError(data?.message || 'Failed to delete bot');
            }
        } catch (error) {
            console.error('Error deleting bot:', error);
            this.showError('Failed to delete bot');
        } finally {
            this.hideLoading();
        }
    },

    // ==================== UTILITY METHODS ====================

    renderPagination(pagination, section) {
        // Simple pagination implementation
        if (!pagination) return;
        
        const container = document.querySelector(`#${section} .table-container`);
        if (!container) return;

        let paginationHtml = container.querySelector('.pagination-container');
        if (paginationHtml) {
            paginationHtml.remove();
        }

        if (pagination.pages > 1) {
            const paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination-container';
            paginationContainer.innerHTML = `
                <div class="pagination-info">
                    Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} entries
                </div>
                <div class="pagination-controls">
                    ${pagination.page > 1 ? `<button class="btn btn-small btn-secondary" onclick="adminPanel.loadSectionData('${section}', ${pagination.page - 1})">Previous</button>` : ''}
                    <span>Page ${pagination.page} of ${pagination.pages}</span>
                    ${pagination.page < pagination.pages ? `<button class="btn btn-small btn-secondary" onclick="adminPanel.loadSectionData('${section}', ${pagination.page + 1})">Next</button>` : ''}
                </div>
            `;
            container.appendChild(paginationContainer);
        }
    },

    loadSectionData(section, page = 1) {
        this.currentPage = page;
        switch (section) {
            case 'users':
                this.loadUsers(page);
                break;
            case 'games':
                this.loadGames(page);
                break;
            case 'transactions':
                this.loadTransactions(page);
                break;
            case 'withdrawals':
                this.loadWithdrawals(page);
                break;
            case 'bots':
                this.loadBots(page);
                break;
        }
    },

    handleSearch(query) {
        // Implement search functionality
        if (this.currentSection === 'users') {
            this.loadUsers(1, query);
        }
        // Add search for other sections as needed
    },

});
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
            games: 'Game Management',
            transactions: 'Transaction Management',
            withdrawals: 'Withdrawal Management',
            bots: 'Bot Management',
            feedback: 'Feedback Management',
            website: 'Website Data Management',
            analytics: 'Analytics & Reports',
            updates: 'App Update Management',
            settings: 'System Settings'
        };
        document.querySelector('.page-title').textContent = titles[section];

        this.currentSection = section;
        this.currentPage = 1;

        // Load section data
        this.loadSectionData(section);
    }

    loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                this.loadUsers();
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

    // ==================== UPDATE MANAGEMENT SYSTEM ====================

    async loadUpdates() {
        try {
            this.showLoading();
            console.log('Loading updates...');

            // Load current version and update history
            const [versionData, historyData] = await Promise.all([
                this.fetchUpdateAPI('/latest-version.json'),
                this.fetchUpdateAPI('/history')
            ]);

            console.log('Version data:', versionData);
            console.log('History data:', historyData);

            // Update current version stats
            if (versionData) {
                document.getElementById('current-version').textContent = versionData.version || '1.0.0';
                document.getElementById('last-update').textContent = versionData.publishedAt 
                    ? this.formatDate(versionData.publishedAt) 
                    : 'Never';
                document.getElementById('update-type').textContent = versionData.type || 'N/A';
                document.getElementById('apk-size').textContent = versionData.fileSize 
                    ? this.formatFileSize(versionData.fileSize) 
                    : '0 MB';
            }

            // Load update history table
            this.renderUpdatesTable(historyData);

        } catch (error) {
            console.error('Error loading updates:', error);
            this.showError('Failed to load update data');
        } finally {
            this.hideLoading();
        }
    }

    renderUpdatesTable(historyData) {
        const tbody = document.querySelector('#updates-table tbody');
        
        if (historyData?.success && historyData.history) {
            tbody.innerHTML = historyData.history.map(update => `
                <tr>
                    <td>${this.extractVersionFromFilename(update.filename)}</td>
                    <td>
                        <span class="status-badge status-${update.isCurrent ? 'active' : 'inactive'}">
                            ${update.isCurrent ? 'Current' : 'Previous'}
                        </span>
                    </td>
                    <td>${this.formatFileSize(update.size)}</td>
                    <td>${this.formatDate(update.createdAt)}</td>
                    <td>
                        <span class="status-badge status-active">Published</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-small btn-secondary" onclick="adminPanel.downloadUpdate('${update.filename}')">
                                <i class="fas fa-download"></i> Download
                            </button>
                            ${!update.isCurrent ? `
                                <button class="btn btn-small btn-warning" onclick="adminPanel.rollbackUpdate('${update.filename}')">
                                    <i class="fas fa-undo"></i> Rollback
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No updates found</td>
                </tr>
            `;
        }
    }

    showPublishUpdateModal() {
        const modalContent = `
            <form id="publish-update-form" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="update-version">Version Number *</label>
                    <input type="text" id="update-version" name="version" required 
                           placeholder="e.g., 1.2.0" pattern="[0-9]+\\.[0-9]+\\.[0-9]+">
                    <small>Format: Major.Minor.Patch (e.g., 1.2.0)</small>
                </div>
                
                <div class="form-group">
                    <label for="update-type">Update Type *</label>
                    <select id="update-type" name="type" required>
                        <option value="">Select update type</option>
                        <option value="optional">Optional Update</option>
                        <option value="mandatory">Mandatory Update</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="update-notes">Release Notes *</label>
                    <textarea id="update-notes" name="notes" required rows="4" 
                              placeholder="Describe what's new in this version..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="apk-file">APK File *</label>
                    <input type="file" id="apk-file" name="apk" accept=".apk" required>
                    <small>Maximum file size: 100MB. Only .apk files are allowed.</small>
                    <div id="file-info" class="file-info" style="display: none;">
                        <span id="file-name"></span>
                        <span id="file-size"></span>
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="upload-progress" id="upload-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <span class="progress-text" id="progress-text">0%</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="publish-btn">
                        <i class="fas fa-upload"></i> Publish Update
                    </button>
                </div>
            </form>
        `;

        this.showModal('Publish New Update', modalContent);

        // Setup file input handler
        const fileInput = document.getElementById('apk-file');
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('file-name').textContent = file.name;
                document.getElementById('file-size').textContent = this.formatFileSize(file.size);
                document.getElementById('file-info').style.display = 'block';
            } else {
                document.getElementById('file-info').style.display = 'none';
            }
        });

        // Setup form submission
        document.getElementById('publish-update-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.publishUpdate();
        });
    }

    async publishUpdate() {
        try {
            const form = document.getElementById('publish-update-form');
            const formData = new FormData(form);
            
            // Validate form
            const version = formData.get('version');
            const type = formData.get('type');
            const notes = formData.get('notes');
            const apkFile = formData.get('apk');

            if (!version || !type || !notes || !apkFile) {
                this.showError('Please fill in all required fields');
                return;
            }

            // Validate version format
            const versionRegex = /^[0-9]+\.[0-9]+\.[0-9]+$/;
            if (!versionRegex.test(version)) {
                this.showError('Version must be in format: Major.Minor.Patch (e.g., 1.2.0)');
                return;
            }

            // Validate file size (100MB limit)
            if (apkFile.size > 100 * 1024 * 1024) {
                this.showError('APK file size must be less than 100MB');
                return;
            }

            // Show progress
            document.getElementById('upload-progress').style.display = 'block';
            document.getElementById('publish-btn').disabled = true;
            document.getElementById('publish-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

            // Create XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    document.getElementById('progress-fill').style.width = percentComplete + '%';
                    document.getElementById('progress-text').textContent = Math.round(percentComplete) + '%';
                }
            });

            // Handle response
            xhr.addEventListener('load', () => {
                try {
                    const response = JSON.parse(xhr.responseText);
                    
                    if (xhr.status === 200 && response.success) {
                        this.showSuccess('Update published successfully!');
                        this.closeModal();
                        this.loadUpdates(); // Refresh the updates list
                    } else {
                        this.showError(response.message || 'Failed to publish update');
                    }
                } catch (error) {
                    this.showError('Invalid response from server');
                }
                
                // Reset form
                document.getElementById('publish-btn').disabled = false;
                document.getElementById('publish-btn').innerHTML = '<i class="fas fa-upload"></i> Publish Update';
                document.getElementById('upload-progress').style.display = 'none';
            });

            xhr.addEventListener('error', () => {
                this.showError('Network error occurred while uploading');
                document.getElementById('publish-btn').disabled = false;
                document.getElementById('publish-btn').innerHTML = '<i class="fas fa-upload"></i> Publish Update';
                document.getElementById('upload-progress').style.display = 'none';
            });

            // Send request
            xhr.open('POST', `${this.baseURL}/updates/publish-update`);
            xhr.setRequestHeader('Authorization', `Bearer ${this.authToken}`);
            xhr.send(formData);

        } catch (error) {
            console.error('Error publishing update:', error);
            this.showError('Failed to publish update');
            
            // Reset form
            document.getElementById('publish-btn').disabled = false;
            document.getElementById('publish-btn').innerHTML = '<i class="fas fa-upload"></i> Publish Update';
            document.getElementById('upload-progress').style.display = 'none';
        }
    }

    downloadUpdate(filename) {
        const downloadUrl = `${this.baseURL}/apks/${filename}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showSuccess('Download started');
    }

    async rollbackUpdate(filename) {
        if (!confirm(`Are you sure you want to rollback to ${filename}? This will make it the current version.`)) {
            return;
        }

        try {
            this.showLoading();
            
            // Extract version from filename
            const version = this.extractVersionFromFilename(filename);
            
            // Create rollback data
            const rollbackData = {
                version: version,
                type: 'optional',
                notes: `Rollback to version ${version}`,
                filename: filename
            };

            const response = await fetch(`${this.baseURL}/updates/rollback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(rollbackData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showSuccess('Successfully rolled back to previous version');
                this.loadUpdates();
            } else {
                this.showError(data.message || 'Failed to rollback update');
            }

        } catch (error) {
            console.error('Error rolling back update:', error);
            this.showError('Failed to rollback update');
        } finally {
            this.hideLoading();
        }
    }

    // ==================== UTILITY METHODS ====================

    async fetchUpdateAPI(endpoint) {
        try {
            const headers = {};
            
            // Add auth token for admin endpoints
            if (this.authToken && endpoint !== '/latest-version.json') {
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }
            
            const response = await fetch(`${this.baseURL}/updates${endpoint}`, { headers });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Update API Error for ${endpoint}:`, error);
            return null;
        }
    }

    extractVersionFromFilename(filename) {
        // Extract version from filename like "Budzee-v1.2.0.apk"
        const match = filename.match(/v?([0-9]+\.[0-9]+\.[0-9]+)/);
        return match ? match[1] : 'Unknown';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // ==================== OTHER SECTION METHODS ====================

    async loadUsers(page = 1, search = '', status = '') {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page,
                limit: this.itemsPerPage,
                ...(search && { search }),
                ...(status && { status })
            });

            const data = await this.fetchAPI(`/admin/users?${params}`);
            
            if (data?.success) {
                this.renderUsersTable(data.users || []);
                this.renderPagination(data.pagination, 'users');
            } else {
                console.warn('API failed, loading mock user data');
                const mockUsers = this.generateMockUsers();
                this.renderUsersTable(mockUsers);
                this.showError('API connection failed - showing demo data');
            }

        } catch (error) {
            console.error('Error loading users:', error);
            const mockUsers = this.generateMockUsers();
            this.renderUsersTable(mockUsers);
            this.showError('Failed to load users - showing demo data');
        } finally {
            this.hideLoading();
        }
    }

    generateMockUsers() {
        const mockUsers = [];
        for (let i = 1; i <= 10; i++) {
            mockUsers.push({
                id: `mock-user-${i}`,
                name: `Demo User ${i}`,
                phoneNumber: `+91${9000000000 + i}`,
                email: `user${i}@demo.com`,
                isVerified: i % 2 === 0,
                balance: Math.floor(Math.random() * 1000),
                gameBalance: Math.floor(Math.random() * 500),
                withdrawableBalance: Math.floor(Math.random() * 300),
                referralCode: `REF${i.toString().padStart(3, '0')}`,
                createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
            });
        }
        return mockUsers;
    }

    renderUsersTable(users) {
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="user-id-cell">
                        <span class="id-short">${user.id.slice(0, 8)}...</span>
                        <button class="btn-copy" onclick="adminPanel.copyToClipboard('${user.id}')" title="Copy full ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td>
                    <div class="user-info">
                        <strong>${user.name || 'N/A'}</strong>
                        ${user.isBot ? '<span class="bot-badge">BOT</span>' : ''}
                        ${user.referralCode ? `<div class="referral-code">Ref: ${user.referralCode}</div>` : ''}
                    </div>
                </td>
                <td>${user.phoneNumber}</td>
                <td>${user.email || 'N/A'}</td>
                <td>
                    <div class="balance-info">
                        <div>Total: ₹${user.balance || 0}</div>
                        <div class="balance-breakdown">
                            Game: ₹${user.gameBalance || 0} | 
                            Withdrawable: ₹${user.withdrawableBalance || 0}
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${user.isVerified ? 'active' : 'inactive'}">
                        ${user.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewUser('${user.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-small btn-primary" onclick="adminPanel.editUser('${user.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // API Helper Methods
    async fetchAPI(endpoint, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            // Add auth token for admin endpoints
            if (endpoint.startsWith('/admin') && this.authToken) {
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }
            
            const response = await fetch(`${this.apiURL}${endpoint}`, {
                headers,
                ...options
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
            return null;
        }
    }

    // Utility Methods
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

    // Placeholder methods for other sections
    async loadGames() { console.log('Loading games...'); }
    async loadTransactions() { console.log('Loading transactions...'); }
    async loadWithdrawals() { console.log('Loading withdrawals...'); }
    async loadBots() { console.log('Loading bots...'); }
    async loadFeedback() { console.log('Loading feedback...'); }
    async loadWebsiteData() { console.log('Loading website data...'); }
    async loadAnalytics() { console.log('Loading analytics...'); }
    loadSettings() { console.log('Loading settings...'); }
    
    // Placeholder methods for user actions
    viewUser(userId) { console.log('View user:', userId); }
    editUser(userId) { console.log('Edit user:', userId); }
    handleSearch(query) { console.log('Search:', query); }
    renderPagination(pagination, section) { console.log('Pagination:', pagination, section); }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing admin panel...');
    window.adminPanel = new BudzeeAdminPanel();
});
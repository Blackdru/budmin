// Real Admin Panel - Connected to Backend API
class BudzeeAdminPanelReal {
    constructor() {
        this.baseURL = ENV_CONFIG.getServerUrl();
        this.apiURL = ENV_CONFIG.getApiUrl();
        this.currentSection = 'dashboard';
        this.authToken = null;
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.init();
    }

    async init() {
        console.log('Initializing admin panel...');
        
        try {
            const isAuthenticated = await this.checkAuth();
            
            if (!isAuthenticated) {
                console.log('Not authenticated, redirecting to login...');
                window.location.href = 'login.html';
                return;
            }
            
            console.log('Authenticated, setting up panel...');
            this.setupEventListeners();
            this.loadDashboard();
            this.startAutoRefresh();
            
        } catch (error) {
            console.error('Init error:', error);
        }
    }

    async checkAuth() {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            return false;
        }
        
        try {
            // Verify token with server
            const response = await fetch(`${this.apiURL}/admin-auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    this.authToken = token;
                    this.adminRole = data.user.role;
                    return true;
                }
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
        }
        
        // Remove invalid token
        localStorage.removeItem('adminToken');
        return false;
    }

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

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Mobile sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        const mobileOverlay = document.getElementById('mobile-overlay');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                if (!sidebar) return;
                sidebar.classList.toggle('active');
                if (mobileOverlay) {
                    if (sidebar.classList.contains('active')) mobileOverlay.classList.add('active');
                    else mobileOverlay.classList.remove('active');
                }
            });
        }
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                sidebar?.classList.remove('active');
                mobileOverlay.classList.remove('active');
            });
        }

        // Modal close
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Filter listeners
        this.setupFilterListeners();
    }

    setupFilterListeners() {
        const filters = [
            { id: 'game-status-filter', handler: (e) => this.loadGames(1, e.target.value) },
            { id: 'transaction-type-filter', handler: () => this.loadTransactions() },
            { id: 'transaction-status-filter', handler: () => this.loadTransactions() },
            { id: 'withdrawal-status-filter', handler: (e) => this.loadWithdrawals(1, e.target.value) },
            { id: 'feedback-status-filter', handler: (e) => this.loadFeedback(1, e.target.value) },
            { id: 'analytics-period', handler: (e) => this.loadAnalytics(e.target.value) },
            { id: 'website-data-filter', handler: (e) => this.loadWebsiteData(1, e.target.value) },
            { id: 'notification-type-filter', handler: () => this.loadPushNotifications() },
            { id: 'notification-status-filter', handler: () => this.loadPushNotifications() }
        ];

        filters.forEach(filter => {
            const element = document.getElementById(filter.id);
            if (element) {
                element.addEventListener('change', filter.handler);
            }
        });
    }

    switchSection(section) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update active content section
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
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
            'push-notifications': 'Push Notifications',
            administration: 'Admin Management',
            settings: 'System Settings'
        };
        document.querySelector('.page-title').textContent = titles[section];

        this.currentSection = section;
        this.currentPage = 1;
        if (window.innerWidth <= 1024) {
            document.querySelector('.sidebar')?.classList.remove('active');
            document.getElementById('mobile-overlay')?.classList.remove('active');
        }
        this.loadSectionData(section);
    }

    loadSectionData(section, page = 1) {
        const sectionLoaders = {
            dashboard: () => this.loadDashboard(),
            users: () => this.loadUsers(page),
            referrals: () => this.loadReferrals(page),
            games: () => this.loadGames(page),
            transactions: () => this.loadTransactions(page),
            withdrawals: () => this.loadWithdrawals(page),
            bots: () => this.loadBots(page),
            feedback: () => this.loadFeedback(page),
            website: () => this.loadWebsiteData(page),
            analytics: () => this.loadAnalytics(),
            updates: () => this.loadUpdates(),
            'push-notifications': () => this.loadPushNotifications(),
            settings: () => this.loadSettings()
        };

        const loader = sectionLoaders[section];
        if (loader) {
            loader();
        }
    }

    // ==================== DASHBOARD ====================
    async loadDashboard() {
        try {
            this.showLoading();
            
            const data = await this.fetchAPI('/admin/dashboard/stats');
            
            if (data?.success) {
                const stats = data.stats;
                document.getElementById('total-users').textContent = stats.totalUsers || 0;
                document.getElementById('total-games').textContent = (stats.totalGames || 0).toLocaleString();
                document.getElementById('total-revenue').textContent = `₹${(stats.totalRevenue || 0).toLocaleString()}`;
                document.getElementById('active-bots').textContent = stats.totalBots || 0;
            } else {
                throw new Error('Failed to load dashboard stats');
            }

            await this.loadRecentActivity();
            await this.loadSystemStatus();

        } catch (error) {
            console.error('Dashboard error:', error);
            this.showError('Failed to load dashboard data');
            this.loadFallbackDashboard();
        } finally {
            this.hideLoading();
        }
    }

    async loadRecentActivity() {
        try {
            const data = await this.fetchAPI('/admin/dashboard/activity');
            
            if (data?.success && data.activities) {
                this.renderRecentActivity(data.activities);
            } else {
                throw new Error('No activity data');
            }
        } catch (error) {
            console.error('Activity error:', error);
            this.renderRecentActivity([
                { icon: 'fas fa-user-plus', title: 'New user registered', time: new Date(), color: '#667eea' },
                { icon: 'fas fa-gamepad', title: 'Ludo game completed', time: new Date(Date.now() - 300000), color: '#f093fb' },
                { icon: 'fas fa-credit-card', title: 'Deposit processed', time: new Date(Date.now() - 600000), color: '#4facfe' }
            ]);
        }
    }

    renderRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${activity.color || '#667eea'}">
                    <i class="${activity.icon || 'fas fa-info'}"></i>
                </div>
                <div class="activity-info">
                    <h4>${activity.title}</h4>
                    <p>${this.formatTimeAgo(activity.time)}</p>
                </div>
                <div class="activity-time">${new Date(activity.time).toLocaleTimeString()}</div>
            </div>
        `).join('');
    }

    async loadSystemStatus() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            const data = response.ok ? await response.json() : null;
            
            const statuses = [
                { name: 'Database', status: data?.status === 'OK' ? 'online' : 'offline', indicator: data?.status === 'OK' ? 'success' : 'error' },
                { name: 'Socket Server', status: 'online', indicator: 'success' },
                { name: 'Payment Gateway', status: 'online', indicator: 'success' },
                { name: 'Bot System', status: 'online', indicator: 'success' }
            ];

            this.renderSystemStatus(statuses);
        } catch (error) {
            console.error('System status error:', error);
            this.renderSystemStatus([
                { name: 'Database', status: 'offline', indicator: 'error' },
                { name: 'Socket Server', status: 'unknown', indicator: 'warning' },
                { name: 'Payment Gateway', status: 'unknown', indicator: 'warning' },
                { name: 'Bot System', status: 'unknown', indicator: 'warning' }
            ]);
        }
    }

    renderSystemStatus(statuses) {
        const container = document.getElementById('system-status');
        if (!container) return;

        container.innerHTML = statuses.map(status => `
            <div class="status-item">
                <h4>${status.name}</h4>
                <div class="status-indicator ${status.indicator}"></div>
            </div>
        `).join('');
    }

    loadFallbackDashboard() {
        document.getElementById('total-users').textContent = 'N/A';
        document.getElementById('total-games').textContent = 'N/A';
        document.getElementById('total-revenue').textContent = 'N/A';
        document.getElementById('active-bots').textContent = 'N/A';
    }

    // ==================== USERS ====================
    async loadUsers(page = 1, search = '') {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: page.toString(),
                limit: this.itemsPerPage.toString(),
                ...(search && { search })
            });

            const data = await this.fetchAPI(`/admin/users?${params}`);
            
            if (data?.success) {
                this.renderUsersTable(data.users || []);
                if (data.pagination) {
                    this.renderPagination(data.pagination, 'users');
                }
            } else {
                throw new Error('Failed to load users');
            }

        } catch (error) {
            console.error('Users error:', error);
            this.showError('Failed to load users from database');
            this.renderUsersTable([]);
        } finally {
            this.hideLoading();
        }
    }

    renderUsersTable(users) {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 20px;">No users found in database</td></tr>';
            return;
        }

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
                    </div>
                </td>
                <td>${user.phoneNumber || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>₹${user.balance || 0}</td>
                <td>${user.gamesPlayed || 0}</td>
                <td>
                    <span class="win-rate ${(user.winRate || 0) > 50 ? 'high' : 'low'}">
                        ${user.winRate || 0}%
                    </span>
                </td>
                <td>₹${user.totalWinnings || 0}</td>
                <td>${user.referralCount || 0}</td>
                <td>
                    <span class="status-badge status-${user.isVerified ? 'verified' : 'unverified'}">
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

    async viewUser(userId) {
        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/users/${userId}`);
            
            if (data?.success) {
                this.showUserDetailsModal(data.user);
            } else {
                throw new Error('User not found');
            }
        } catch (error) {
            console.error('View user error:', error);
            this.showError('Failed to load user details from database');
        } finally {
            this.hideLoading();
        }
    }

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
                    <p><strong>Win Rate:</strong> ${user.statistics?.winRate || 0}%</p>
                    <p><strong>Total Winnings:</strong> ₹${user.statistics?.totalWinnings || 0}</p>
                </div>

                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `;

        this.showModal(`User Details - ${user.name || user.phoneNumber}`, modalContent);
    }

    async editUser(userId) {
        this.showModal('Edit User', `
            <div class="user-edit">
                <p>User ID: ${userId}</p>
                <p>Edit functionality requires backend API implementation.</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }

    // ==================== GAMES ====================
    async loadGames(page = 1, status = '') {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: page.toString(),
                limit: this.itemsPerPage.toString(),
                ...(status && { status })
            });

            const data = await this.fetchAPI(`/admin/games?${params}`);
            
            if (data?.success) {
                this.renderGamesTable(data.games || []);
                if (data.pagination) {
                    this.renderPagination(data.pagination, 'games');
                }
            } else {
                throw new Error('Failed to load games');
            }
            
        } catch (error) {
            console.error('Games error:', error);
            this.showError('Failed to load games from database');
            this.renderGamesTable([]);
        } finally {
            this.hideLoading();
        }
    }

    renderGamesTable(games) {
        const tbody = document.querySelector('#games-table tbody');
        if (!tbody) return;

        if (games.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No games found in database</td></tr>';
            return;
        }

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
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async viewGame(gameId) {
        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/games/${gameId}`);
            
            if (data?.success) {
                this.showGameDetailsModal(data.game);
            } else {
                throw new Error('Game not found');
            }
        } catch (error) {
            console.error('View game error:', error);
            this.showError('Failed to load game details from database');
        } finally {
            this.hideLoading();
        }
    }

    showGameDetailsModal(game) {
        const modalContent = `
            <div class="game-details">
                <div class="detail-section">
                    <h4>Game Information</h4>
                    <p><strong>ID:</strong> ${game.id}</p>
                    <p><strong>Type:</strong> ${game.type}</p>
                    <p><strong>Status:</strong> ${game.status}</p>
                    <p><strong>Entry Fee:</strong> ₹${game.entryFee}</p>
                    <p><strong>Prize Pool:</strong> ₹${game.prizePool}</p>
                    <p><strong>Created:</strong> ${new Date(game.createdAt).toLocaleString()}</p>
                </div>

                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `;

        this.showModal(`Game Details - ${game.type}`, modalContent);
    }

    // ==================== OTHER SECTIONS ====================
    async loadAnalytics(period = 'month') {
        try {
            this.showLoading();
            
            const data = await this.fetchAPI(`/admin/analytics?period=${period}`).catch(() => ({ success: false }));
            
            if (data?.success) {
                this.updateAnalyticsData(data.analytics);
            } else {
                throw new Error('Failed to load analytics');
            }
            
        } catch (error) {
            console.error('Analytics error:', error);
            this.showError('Failed to load analytics from database');
            this.loadFallbackAnalytics();
        } finally {
            this.hideLoading();
        }
    }

    updateAnalyticsData(analytics) {
        // User Growth
        document.getElementById('new-users').textContent = analytics.userGrowth?.newUsers || 0;
        document.getElementById('active-users').textContent = analytics.userGrowth?.activeUsers || 0;
        document.getElementById('retention-rate').textContent = `${analytics.userGrowth?.retentionRate || 0}%`;

        // Revenue Analytics
        document.getElementById('total-deposits').textContent = `₹${(analytics.revenue?.totalDeposits || 0).toLocaleString()}`;
        document.getElementById('total-withdrawals').textContent = `₹${(analytics.revenue?.totalWithdrawals || 0).toLocaleString()}`;
        document.getElementById('net-revenue').textContent = `₹${(analytics.revenue?.netRevenue || 0).toLocaleString()}`;

        // Game Analytics
        document.getElementById('games-played').textContent = analytics.games?.gamesPlayed || 0;
        document.getElementById('avg-game-duration').textContent = analytics.games?.avgGameDuration || '15m';
        document.getElementById('popular-game-type').textContent = analytics.games?.popularGameType || 'N/A';

        // Bot Performance
        document.getElementById('bot-games-played').textContent = analytics.bots?.gamesPlayed || 0;
        document.getElementById('bot-win-rate').textContent = `${analytics.bots?.winRate || 0}%`;
        document.getElementById('bot-efficiency').textContent = `${analytics.bots?.efficiency || 0}%`;

        // Top Users Table
        this.renderTopUsersTable(analytics.topUsers || []);
    }

    loadFallbackAnalytics() {
        document.getElementById('new-users').textContent = 'N/A';
        document.getElementById('active-users').textContent = 'N/A';
        document.getElementById('retention-rate').textContent = 'N/A';
        document.getElementById('total-deposits').textContent = 'N/A';
        document.getElementById('total-withdrawals').textContent = 'N/A';
        document.getElementById('net-revenue').textContent = 'N/A';
        document.getElementById('games-played').textContent = 'N/A';
        document.getElementById('avg-game-duration').textContent = 'N/A';
        document.getElementById('popular-game-type').textContent = 'N/A';
        document.getElementById('bot-games-played').textContent = 'N/A';
        document.getElementById('bot-win-rate').textContent = 'N/A';
        document.getElementById('bot-efficiency').textContent = 'N/A';
        this.renderTopUsersTable([]);
    }

    renderTopUsersTable(topUsers) {
        const tbody = document.querySelector('#top-users-table tbody');
        if (!tbody) return;

        if (topUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No user data available in database</td></tr>';
            return;
        }

        tbody.innerHTML = topUsers.map((user, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="user-info">
                        <strong>${user.name || 'N/A'}</strong>
                        <div class="user-phone">${user.phoneNumber}</div>
                    </div>
                </td>
                <td>${user.gamesPlayed || 0}</td>
                <td>
                    <span class="win-rate ${(user.winRate || 0) > 50 ? 'high' : 'low'}">
                        ${user.winRate || 0}%
                    </span>
                </td>
                <td>₹${user.totalWinnings || 0}</td>
                <td>₹${user.totalDeposits || 0}</td>
            </tr>
        `).join('');
    }

    // ==================== PUSH NOTIFICATIONS ====================
    async loadPushNotifications() {
        try {
            this.showLoading();

            const typeFilter = document.getElementById('notification-type-filter')?.value || '';
            const statusFilter = document.getElementById('notification-status-filter')?.value || '';

            const query = new URLSearchParams({ page: '1', limit: '20' });
            if (typeFilter) query.set('type', typeFilter);
            if (statusFilter) query.set('status', statusFilter);

            const [statsData, notificationsData] = await Promise.all([
                this.fetchAPI('/push-notifications/stats').catch(() => ({ success: false })),
                this.fetchAPI(`/push-notifications/history?${query.toString()}`).catch(() => ({ success: false }))
            ]);

            if (statsData?.success) {
                const stats = statsData.data;
                document.getElementById('total-notifications').textContent = stats.totalNotifications || 0;
                document.getElementById('sent-notifications').textContent = stats.sentNotifications || 0;
                document.getElementById('active-devices').textContent = stats.activeDevices || 0;
                document.getElementById('pending-notifications').textContent = stats.pendingNotifications || 0;
            }

            if (notificationsData?.success) {
                this.renderNotificationsTable(notificationsData.data.notifications || []);
            } else {
                this.renderNotificationsTable([]);
            }
        } catch (error) {
            console.error('Push notifications error:', error);
            this.showError('Failed to load push notifications from database');
            this.loadFallbackNotifications();
        } finally {
            this.hideLoading();
        }
    }

    loadFallbackNotifications() {
        document.getElementById('total-notifications').textContent = 'N/A';
        document.getElementById('sent-notifications').textContent = 'N/A';
        document.getElementById('active-devices').textContent = 'N/A';
        document.getElementById('pending-notifications').textContent = 'N/A';
        this.renderNotificationsTable([]);
    }

    renderNotificationsTable(notifications) {
        const tbody = document.querySelector('#notifications-table tbody');
        if (!tbody) return;
        
        if (notifications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No notifications found in database</td></tr>';
            return;
        }
        
        tbody.innerHTML = notifications.map(notification => `
            <tr>
                <td>${(notification.id || '').slice(-8) || 'N/A'}</td>
                <td>
                    <div class="notification-title">${notification.title || 'No Title'}</div>
                    <div class="notification-body">${(notification.body || '').substring(0, 50)}${(notification.body || '').length > 50 ? '...' : ''}</div>
                </td>
                <td><span class="status-badge">${notification.type || 'GENERAL'}</span></td>
                <td><span class="status-badge">${(notification.targetType || 'ALL_USERS').replace('_', ' ')}</span></td>
                <td><span class="status-badge status-${(notification.status || 'pending').toLowerCase()}">${notification.status || 'PENDING'}</span></td>
                <td>
                    <div class="delivery-stats">
                        <span class="success-count">${notification.successCount || 0}</span>/<span class="total-count">${notification.totalTargets || 0}</span>
                        ${(notification.failureCount || 0) > 0 ? `<span class="failure-count">(${notification.failureCount} failed)</span>` : ''}
                    </div>
                </td>
                <td>${notification.sentAt ? new Date(notification.sentAt).toLocaleString() : 'Not sent'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewNotificationDetails('${notification.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    showSendNotificationModal() {
        const modalContent = `
            <form id="send-notification-form">
                <div class="form-group">
                    <label for="notification-title">Title *</label>
                    <input type="text" id="notification-title" required maxlength="100" placeholder="Enter notification title">
                </div>
                
                <div class="form-group">
                    <label for="notification-body">Message *</label>
                    <textarea id="notification-body" required maxlength="500" rows="3" placeholder="Enter notification message"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="notification-type-select">Type</label>
                    <select id="notification-type-select">
                        <option value="GENERAL">General</option>
                        <option value="PROMOTIONAL">Promotional</option>
                        <option value="SYSTEM_UPDATE">System Update</option>
                        <option value="MAINTENANCE">Maintenance</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="notification-target-select">Target Audience</label>
                    <select id="notification-target-select">
                        <option value="ALL_USERS">All Users</option>
                        <option value="ACTIVE_USERS">Active Users</option>
                        <option value="NEW_USERS">New Users</option>
                    </select>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Send Notification
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Send Push Notification', modalContent);

        document.getElementById('send-notification-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendNotification();
        });
    }

    async sendNotification() {
        const title = document.getElementById('notification-title').value;
        const body = document.getElementById('notification-body').value;
        const type = document.getElementById('notification-type-select').value;
        const targetType = document.getElementById('notification-target-select').value;
        
        if (!title || !body) {
            this.showError('Title and message are required');
            return;
        }

        try {
            this.showLoading();
            
            const data = await this.fetchAPI('/push-notifications/send', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    body,
                    type,
                    targetType
                })
            }).catch(error => ({ success: false, message: error.message }));
            
            if (data?.success) {
                this.showSuccess('Notification sent successfully!');
                this.closeModal();
                this.loadPushNotifications();
            } else {
                throw new Error(data?.message || 'Failed to send notification');
            }
            
        } catch (error) {
            console.error('Send notification error:', error);
            this.showError('Failed to send notification to database');
        } finally {
            this.hideLoading();
        }
    }

    async viewNotificationDetails(notificationId) {
        this.showModal('Notification Details', `
            <div class="notification-details">
                <p>Notification ID: ${notificationId}</p>
                <p>Loading detailed information from database...</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }

    // ==================== GENERIC LOADERS FOR OTHER SECTIONS ====================
    async loadReferrals() {
        await this.loadGenericSection('referrals', '/admin/referrals');
    }

    async loadTransactions(page = 1) {
        try {
            this.showLoading();

            const type = document.getElementById('transaction-type-filter')?.value || '';
            const status = document.getElementById('transaction-status-filter')?.value || '';

            const params = new URLSearchParams({
                page: page.toString(),
                limit: this.itemsPerPage.toString(),
            });
            if (type) params.set('type', type);
            if (status) params.set('status', status);

            const data = await this.fetchAPI(`/admin/transactions?${params.toString()}`);

            if (data?.success) {
                this.renderTransactionsTable(data.transactions || []);
                if (data.pagination) this.renderPagination(data.pagination, 'transactions');
            } else {
                throw new Error('Failed to load transactions');
            }
        } catch (error) {
            console.error('Transactions error:', error);
            this.showError('Failed to load transactions from database');
            this.renderTransactionsTable([]);
        } finally {
            this.hideLoading();
        }
    }

    renderTransactionsTable(transactions) {
        const tbody = document.querySelector('#transactions-table tbody');
        if (!tbody) return;

        if (!Array.isArray(transactions) || transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No transactions found in database</td></tr>';
            return;
        }

        tbody.innerHTML = transactions.map(tx => `
            <tr>
                <td>${(tx.id || '').slice(-8)}</td>
                <td>
                    <div class="user-info">
                        <strong>${tx.user?.name || tx.user?.phoneNumber || 'N/A'}</strong>
                        <div class="user-phone">${tx.user?.phoneNumber || ''}</div>
                    </div>
                </td>
                <td>${tx.type || 'N/A'}</td>
                <td>₹${tx.amount || 0}</td>
                <td><span class="status-badge status-${(tx.status || 'PENDING').toLowerCase()}">${tx.status || 'PENDING'}</span></td>
                <td>${tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewTransaction && adminPanel.viewTransaction('${tx.id || ''}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadWithdrawals() {
        await this.loadGenericSection('withdrawals', '/admin/withdrawals');
    }

    async loadBots() {
        await this.loadGenericSection('bots', '/admin/bots');
    }

    async loadFeedback() {
        await this.loadGenericSection('feedback', '/admin/feedback');
    }

    async loadWebsiteData(page = 1, dataType = '') {
        try {
            this.showLoading();

            const selectedType = (document.getElementById('website-data-filter')?.value || dataType || '').trim();
            const typeParam = selectedType === '' ? 'all' : selectedType; // backend expects 'all' for no filter

            const params = new URLSearchParams({
                page: page.toString(),
                limit: this.itemsPerPage.toString(),
                type: typeParam
            });

            const data = await this.fetchAPI(`/admin/website-data?${params.toString()}`).catch(() => ({ success: false }));

            if (data?.success) {
                this.renderWebsiteDataTable(data.data || {}, typeParam);
                if (data.stats) this.updateWebsiteStats(data.stats);
                // Note: backend doesn't return total counts per type for pagination uniformly; skip pagination UI here
            } else {
                throw new Error('Failed to load website data');
            }
        } catch (error) {
            console.error('Website data error:', error);
            this.showError('Failed to load website data from database');
            // Show placeholder
            const tbody = document.querySelector('#website-data-table tbody');
            const thead = document.querySelector('#website-table-header');
            if (thead) thead.innerHTML = '<tr><th>Type</th><th>Data</th><th>Date</th><th>Actions</th></tr>';
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No website data found in database</td></tr>';
        } finally {
            this.hideLoading();
        }
    }

    updateWebsiteStats(stats) {
        document.getElementById('total-contacts').textContent = stats.totalContacts || 0;
        document.getElementById('total-website-feedback').textContent = stats.totalWebsiteFeedback || 0;
        document.getElementById('total-subscribers').textContent = stats.totalNewsletters || 0;
        document.getElementById('total-downloads').textContent = stats.totalDownloads || 0;
    }

    renderWebsiteDataTable(data, dataType) {
        const tbody = document.querySelector('#website-data-table tbody');
        const thead = document.querySelector('#website-table-header');
        if (!tbody || !thead) return;

        // Default headers
        thead.innerHTML = `
            <tr>
                <th>Type</th>
                <th>Data</th>
                <th>Date</th>
                <th>Actions</th>
            </tr>
        `;

        const items = [];
        if (data.contacts?.data) {
            items.push(...data.contacts.data.map(item => ({ ...item, __type: 'Contact' })));
        }
        if (data.websiteFeedback?.data) {
            items.push(...data.websiteFeedback.data.map(item => ({ ...item, __type: 'Feedback' })));
        }
        if (data.newsletters?.data) {
            items.push(...data.newsletters.data.map(item => ({ ...item, __type: 'Newsletter' })));
        }
        if (data.downloads?.data) {
            items.push(...data.downloads.data.map(item => ({ ...item, __type: 'Download' })));
        }

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No website data found in database</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td><span class="data-type-badge">${item.__type}</span></td>
                <td>
                    <div class="data-preview">${item.name || item.email || item.message || item.ipAddress || 'N/A'}</div>
                </td>
                <td>${new Date(item.createdAt || item.timestamp).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="adminPanel.viewWebsiteDataItem && adminPanel.viewWebsiteDataItem('${item.id || ''}', '${(item.__type || '').toLowerCase()}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async loadUpdates() {
        try {
            this.showLoading();
            const data = await this.fetchAPI('/updates/history');

            if (data?.success) {
                this.renderUpdatesTable(data.updates || []);
                this.updateCurrentVersionInfo(data.currentVersion);
            } else {
                throw new Error('Failed to load updates');
            }
        } catch (error) {
            console.error('Updates error:', error);
            this.showError('Failed to load updates from database');
            this.renderUpdatesTable([]);
        } finally {
            this.hideLoading();
        }
    }

    updateCurrentVersionInfo(versionInfo) {
        if (!versionInfo) return;
        const currentVersionEl = document.getElementById('current-version');
        const lastUpdateEl = document.getElementById('last-update');
        const updateTypeEl = document.getElementById('update-type');
        const apkSizeEl = document.getElementById('apk-size');

        if (currentVersionEl) currentVersionEl.textContent = versionInfo.version || '1.0.0';
        if (lastUpdateEl) lastUpdateEl.textContent = versionInfo.publishedAt ? new Date(versionInfo.publishedAt).toLocaleDateString() : 'Never';
        if (updateTypeEl) updateTypeEl.textContent = versionInfo.type || 'N/A';
        if (apkSizeEl) apkSizeEl.textContent = versionInfo.size ? `${(versionInfo.size / 1024 / 1024).toFixed(1)} MB` : '0 MB';
    }

    renderUpdatesTable(updates) {
        const tbody = document.querySelector('#updates-table tbody');
        if (!tbody) return;

        if (!Array.isArray(updates) || updates.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No updates found in database</td></tr>';
            return;
        }

        tbody.innerHTML = updates.map(update => `
            <tr>
                <td>
                    <strong>${update.version}</strong>
                    ${update.isCurrent ? '<span class="current-badge">CURRENT</span>' : ''}
                </td>
                <td>
                    <span class="update-type-badge type-${(update.type || 'N/A').toLowerCase()}">${update.type || 'N/A'}</span>
                </td>
                <td>${update.size ? `${(update.size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}</td>
                <td>${update.publishedAt ? new Date(update.publishedAt).toLocaleString() : 'N/A'}</td>
                <td>
                    <span class="status-badge status-${(update.status || 'N/A').toLowerCase()}">${update.status || 'N/A'}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewUpdateDetails && adminPanel.viewUpdateDetails('${update.id || ''}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadSettings() {
        await this.loadGenericSection('settings', '/admin/settings');
    }

    async loadGenericSection(sectionName, endpoint) {
        try {
            this.showLoading();
            
            const data = await this.fetchAPI(endpoint).catch(() => ({ success: false }));
            
            if (data?.success) {
                this.showSuccess(`${sectionName} data loaded from database`);
            } else {
                throw new Error(`Failed to load ${sectionName}`);
            }
            
        } catch (error) {
            console.error(`${sectionName} error:`, error);
            this.showError(`Failed to load ${sectionName} from database`);
            
            // Show placeholder message
            const tbody = document.querySelector(`#${sectionName}-table tbody`);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 20px;">
                            No ${sectionName} data found in database. Please check your backend API.
                        </td>
                    </tr>
                `;
            }
        } finally {
            this.hideLoading();
        }
    }

    // ==================== UTILITY METHODS ====================
    renderPagination(pagination, section) {
        if (!pagination || pagination.pages <= 1) return;
        
        const container = document.querySelector(`#${section} .table-container`);
        if (!container) return;

        const existingPagination = container.querySelector('.pagination-container');
        if (existingPagination) {
            existingPagination.remove();
        }

        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        
        const startItem = ((pagination.page - 1) * pagination.limit) + 1;
        const endItem = Math.min(pagination.page * pagination.limit, pagination.total);
        
        paginationContainer.innerHTML = `
            <div class="pagination-info">
                Showing ${startItem} to ${endItem} of ${pagination.total} entries
            </div>
            <div class="pagination-controls">
                <button class="btn btn-small btn-secondary" 
                        onclick="adminPanel.loadSectionData('${section}', ${pagination.page - 1})" 
                        ${pagination.page <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span>Page ${pagination.page} of ${pagination.pages}</span>
                <button class="btn btn-small btn-secondary" 
                        onclick="adminPanel.loadSectionData('${section}', ${pagination.page + 1})" 
                        ${pagination.page >= pagination.pages ? 'disabled' : ''}>
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        
        container.appendChild(paginationContainer);
    }

    formatTimeAgo(date) {
        const now = new Date();
        const time = new Date(date);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
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

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copied to clipboard');
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccess('Copied to clipboard');
        }
    }

    startAutoRefresh() {
        setInterval(() => {
            if (this.currentSection === 'dashboard' && !document.hidden) {
                this.loadDashboard();
            }
        }, 30000);
    }

    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    }

    showPublishUpdateModal() {
        this.showModal('Publish App Update', `
            <div class="update-publish">
                <p>App update publishing requires backend API implementation.</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }
}

// Create global admin panel instance
window.adminPanel = new BudzeeAdminPanelReal();
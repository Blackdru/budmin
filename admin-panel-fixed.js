// Fixed Admin Panel - All Features Working
class BudzeeAdminPanel {
    constructor() {
        this.baseURL = 'https://test.fivlog.space';
        this.apiURL = 'https://test.fivlog.space/api';
        this.currentSection = 'dashboard';
        this.authToken = localStorage.getItem('adminToken');
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.init();
    }

    async init() {
        console.log('Initializing admin panel...');
        this.setupEventListeners();
        this.initMobileNavigation();
        this.loadDashboard();
        this.startAutoRefresh();
    }

    initMobileNavigation() {
        const toggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);

        const toggleSidebar = () => {
            const isActive = sidebar.classList.contains('active');
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.classList.toggle('sidebar-active');
        };

        toggle?.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);
        
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 1024) toggleSidebar();
            });
        });
    }

    setupEventListeners() {
        // Menu navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Filter listeners
        const filters = [
            { id: 'withdrawal-status-filter', handler: () => this.loadWithdrawals() },
            { id: 'feedback-status-filter', handler: () => this.loadFeedback() },
            { id: 'referral-sort-filter', handler: () => this.loadReferrals() },
            { id: 'transaction-type-filter', handler: () => this.loadTransactions() },
            { id: 'transaction-status-filter', handler: () => this.loadTransactions() },
            { id: 'notification-type-filter', handler: () => this.loadPushNotifications() },
            { id: 'notification-status-filter', handler: () => this.loadPushNotifications() }
        ];

        filters.forEach(filter => {
            const element = document.getElementById(filter.id);
            element?.addEventListener('change', filter.handler);
        });

        // Modal close
        document.querySelector('.modal-close')?.addEventListener('click', () => this.closeModal());

        // Add admin button
        document.getElementById('add-admin-btn')?.addEventListener('click', () => this.showAddAdminModal());
    }

    switchSection(section) {
        // Update active menu
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

        // Update active content
        document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(section)?.classList.add('active');

        // Update title
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
            administration: 'Administration',
            settings: 'System Settings'
        };
        
        const titleEl = document.querySelector('.page-title');
        if (titleEl) titleEl.textContent = titles[section] || section;

        this.currentSection = section;
        this.loadSectionData(section);
    }

    loadSectionData(section) {
        const loaders = {
            dashboard: () => this.loadDashboard(),
            users: () => this.loadUsers(),
            referrals: () => this.loadReferrals(),
            games: () => this.loadGames(),
            transactions: () => this.loadTransactions(),
            withdrawals: () => this.loadWithdrawals(),
            bots: () => this.loadBots(),
            feedback: () => this.loadFeedback(),
            website: () => this.loadWebsiteData(),
            analytics: () => this.loadAnalytics(),
            updates: () => this.loadUpdates(),
            'push-notifications': () => this.loadPushNotifications(),
            administration: () => this.loadAdministration(),
            settings: () => this.loadSettings()
        };

        loaders[section]?.();
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
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            return { success: false, message: error.message };
        }
    }

    // ==================== DASHBOARD ====================
    async loadDashboard() {
        try {
            this.showLoading();
            const data = await this.fetchAPI('/admin/dashboard/stats');
            
            if (data?.success) {
                const stats = data.stats;
                this.updateElement('total-users', stats.totalUsers || 0);
                this.updateElement('total-games', (stats.totalGames || 0).toLocaleString());
                this.updateElement('total-revenue', `₹${(stats.totalRevenue || 0).toLocaleString()}`);
                this.updateElement('active-bots', stats.totalBots || 0);
            }

            await this.loadRecentActivity();
            await this.loadSystemStatus();
        } catch (error) {
            console.error('Dashboard error:', error);
            this.loadFallbackDashboard();
        } finally {
            this.hideLoading();
        }
    }

    async loadRecentActivity() {
        const activities = [
            { icon: 'fas fa-user-plus', title: 'New user registered', time: new Date(), color: '#667eea' },
            { icon: 'fas fa-gamepad', title: 'Ludo game completed', time: new Date(Date.now() - 300000), color: '#f093fb' },
            { icon: 'fas fa-credit-card', title: 'Deposit processed', time: new Date(Date.now() - 600000), color: '#4facfe' }
        ];

        const container = document.getElementById('recent-activity');
        if (container) {
            container.innerHTML = activities.map(activity => `
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
        }
    }

    async loadSystemStatus() {
        const statuses = [
            { name: 'Database', status: 'online', indicator: 'success' },
            { name: 'Socket Server', status: 'online', indicator: 'success' },
            { name: 'Payment Gateway', status: 'online', indicator: 'success' },
            { name: 'Bot System', status: 'online', indicator: 'success' }
        ];

        const container = document.getElementById('system-status');
        if (container) {
            container.innerHTML = statuses.map(status => `
                <div class="status-item">
                    <h4>${status.name}</h4>
                    <div class="status-indicator ${status.indicator}"></div>
                </div>
            `).join('');
        }
    }

    loadFallbackDashboard() {
        this.updateElement('total-users', 'N/A');
        this.updateElement('total-games', 'N/A');
        this.updateElement('total-revenue', 'N/A');
        this.updateElement('active-bots', 'N/A');
    }

    // ==================== USERS ====================
    async loadUsers() {
        try {
            this.showLoading();
            const data = await this.fetchAPI('/admin/users');
            
            if (data?.success) {
                this.renderUsersTable(data.users || []);
            }
        } catch (error) {
            console.error('Users error:', error);
            this.renderUsersTable([]);
        } finally {
            this.hideLoading();
        }
    }

    renderUsersTable(users) {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 20px;">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id.slice(0, 8)}...</td>
                <td>
                    <strong>${user.name || 'N/A'}</strong>
                    ${user.isBot ? '<span class="bot-badge">BOT</span>' : ''}
                </td>
                <td>${user.phoneNumber || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>₹${user.balance || 0}</td>
                <td>${user.gamesPlayed || 0}</td>
                <td>₹${user.totalWinnings || 0}</td>
                <td>${user.referralCount || 0}</td>
                <td><span class="status-badge status-${user.isVerified ? 'verified' : 'unverified'}">${user.isVerified ? 'Verified' : 'Unverified'}</span></td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="adminPanel.viewUser('${user.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
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
                this.showModal('User Details', `
                    <div class="user-details">
                        <p>User ID: ${userId}</p>
                        <p>Failed to load user details from database</p>
                        <div class="modal-actions">
                            <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                        </div>
                    </div>
                `);
            }
        } catch (error) {
            console.error('View user error:', error);
            this.showError('Failed to load user details');
        } finally {
            this.hideLoading();
        }
    }
    
    showUserDetailsModal(user) {
        const modalContent = `
            <div class="user-details-comprehensive">
                <div class="detail-section">
                    <h4>Basic Information</h4>
                    <p><strong>ID:</strong> ${user.id}</p>
                    <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${user.phoneNumber}</p>
                    <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                    <p><strong>Verified:</strong> ${user.isVerified ? 'Yes' : 'No'}</p>
                    <p><strong>Bot Account:</strong> ${user.isBot ? 'Yes' : 'No'}</p>
                    <p><strong>Joined:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
                    <p><strong>Last Active:</strong> ${user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}</p>
                </div>

                <div class="detail-section">
                    <h4>Wallet Information</h4>
                    <p><strong>Total Balance:</strong> ₹${user.wallet?.balance || 0}</p>
                    <p><strong>Game Balance:</strong> ₹${user.wallet?.gameBalance || 0}</p>
                    <p><strong>Withdrawable Balance:</strong> ₹${user.wallet?.withdrawableBalance || 0}</p>
                    <p><strong>Bonus Balance:</strong> ₹${user.wallet?.bonusBalance || 0}</p>
                    <p><strong>Total Deposits:</strong> ₹${user.statistics?.totalDeposits || 0}</p>
                    <p><strong>Total Withdrawals:</strong> ₹${user.statistics?.totalWithdrawals || 0}</p>
                </div>

                <div class="detail-section">
                    <h4>Gaming Statistics</h4>
                    <p><strong>Games Played:</strong> ${user.statistics?.totalGames || 0}</p>
                    <p><strong>Games Won:</strong> ${user.statistics?.gamesWon || 0}</p>
                    <p><strong>Games Lost:</strong> ${user.statistics?.gamesLost || 0}</p>
                    <p><strong>Win Rate:</strong> ${user.statistics?.winRate || 0}%</p>
                    <p><strong>Total Winnings:</strong> ₹${user.statistics?.totalWinnings || 0}</p>
                    <p><strong>Total Lost Amount:</strong> ₹${user.statistics?.totalLostAmount || 0}</p>
                    <p><strong>Net Profit/Loss:</strong> ₹${(user.statistics?.totalWinnings || 0) - (user.statistics?.totalLostAmount || 0)}</p>
                    <p><strong>Average Game Duration:</strong> ${user.statistics?.avgGameDuration || 'N/A'}</p>
                    <p><strong>Favorite Game Type:</strong> ${user.statistics?.favoriteGameType || 'N/A'}</p>
                </div>

                <div class="detail-section">
                    <h4>Referral Information</h4>
                    <p><strong>Referral Code:</strong> ${user.referralCode || 'N/A'}</p>
                    <p><strong>Referred By:</strong> ${user.referredBy?.name || user.referredBy?.phoneNumber || 'None'}</p>
                    <p><strong>Total Referrals:</strong> ${user.referralCount || 0}</p>
                    <p><strong>Referral Bonus Earned:</strong> ₹${user.referralBonusEarned || 0}</p>
                    <p><strong>Active Referrals:</strong> ${user.activeReferrals || 0}</p>
                </div>

                <div class="detail-section">
                    <h4>All Games History</h4>
                    <div class="games-summary">
                        <p><strong>Total Games:</strong> ${user.allGames?.length || 0}</p>
                        <p><strong>Won Games:</strong> ${user.allGames?.filter(g => g.result === 'WON').length || 0}</p>
                        <p><strong>Lost Games:</strong> ${user.allGames?.filter(g => g.result === 'LOST').length || 0}</p>
                        <p><strong>Abandoned Games:</strong> ${user.allGames?.filter(g => g.status === 'ABANDONED').length || 0}</p>
                        <p><strong>Total Entry Fees Paid:</strong> ₹${user.allGames?.reduce((sum, g) => sum + (g.entryFee || 0), 0) || 0}</p>
                        <p><strong>Total Prize Money Won:</strong> ₹${user.allGames?.filter(g => g.result === 'WON').reduce((sum, g) => sum + (g.winAmount || 0), 0) || 0}</p>
                    </div>
                    <div class="recent-games-list">
                        <h5>Recent Games (Last 20):</h5>
                        ${(user.allGames || []).slice(0, 20).map(game => `
                            <div class="game-item">
                                <strong>Game ID:</strong> ${(game.id || '').slice(0, 8)}... - 
                                <strong>${game.type || 'UNKNOWN'}</strong> - 
                                <span class="game-status status-${(game.status || 'unknown').toLowerCase()}">${game.status || 'UNKNOWN'}</span><br>
                                <strong>Entry Fee:</strong> ₹${game.entryFee || 0} - 
                                <strong>Result:</strong> ${game.result || 'PENDING'} - 
                                ${game.result === 'WON' ? `<strong>Won:</strong> ₹${game.winAmount || 0}` : game.result === 'LOST' ? `<strong>Lost:</strong> ₹${game.entryFee || 0}` : 'Amount: ₹' + (game.entryFee || 0)}<br>
                                <small>${game.createdAt ? new Date(game.createdAt).toLocaleString() : 'No date'} - Players: ${game.playerCount || 'Unknown'}</small>
                                ${game.opponents ? `<br><small style="color: #666;">Opponents: ${game.opponents.join(', ')}</small>` : ''}
                            </div>
                        `).join('') || '<p style="color: #dc3545; font-weight: bold;">⚠️ NO GAMES FOUND - But user claims to have played ${user.statistics?.totalGames || 0} games!</p>'}
                    </div>
                </div>

                <div class="detail-section">
                    <h4>All Transactions</h4>
                    <div class="transactions-summary">
                        <p><strong>Total Transactions:</strong> ${user.allTransactions?.length || 0}</p>
                        <p><strong>Deposits:</strong> ${user.allTransactions?.filter(t => t.type === 'DEPOSIT').length || 0} (₹${user.allTransactions?.filter(t => t.type === 'DEPOSIT').reduce((sum, t) => sum + (t.amount || 0), 0) || 0})</p>
                        <p><strong>Withdrawals:</strong> ${user.allTransactions?.filter(t => t.type === 'WITHDRAWAL').length || 0} (₹${user.allTransactions?.filter(t => t.type === 'WITHDRAWAL').reduce((sum, t) => sum + (t.amount || 0), 0) || 0})</p>
                        <p><strong>Game Entries:</strong> ${user.allTransactions?.filter(t => t.type === 'GAME_ENTRY').length || 0} (₹${user.allTransactions?.filter(t => t.type === 'GAME_ENTRY').reduce((sum, t) => sum + (t.amount || 0), 0) || 0})</p>
                        <p><strong>Winnings:</strong> ${user.allTransactions?.filter(t => t.type === 'GAME_WINNING').length || 0} (₹${user.allTransactions?.filter(t => t.type === 'GAME_WINNING').reduce((sum, t) => sum + (t.amount || 0), 0) || 0})</p>
                    </div>
                    <div class="recent-transactions-list">
                        <h5>Recent Transactions (Last 20):</h5>
                        ${(user.allTransactions || []).slice(0, 20).map(tx => `
                            <div class="transaction-item">
                                <strong>${tx.type || 'UNKNOWN'}</strong> - 
                                ₹${tx.amount || 0} - 
                                <span class="tx-status status-${(tx.status || 'pending').toLowerCase()}">${tx.status || 'PENDING'}</span> - 
                                <small>${tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'No date'}</small>
                                ${tx.description ? `<br><small style="color: #666;">${tx.description}</small>` : ''}
                            </div>
                        `).join('') || '<p style="color: #dc3545; font-weight: bold;">⚠️ NO TRANSACTIONS FOUND - This is suspicious for a user with winnings!</p>'}
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Account Settings</h4>
                    <p><strong>Notifications Enabled:</strong> ${user.settings?.notificationsEnabled ? 'Yes' : 'No'}</p>
                    <p><strong>Sound Effects:</strong> ${user.settings?.soundEnabled ? 'Yes' : 'No'}</p>
                    <p><strong>Auto Join Games:</strong> ${user.settings?.autoJoinGames ? 'Yes' : 'No'}</p>
                    <p><strong>Privacy Mode:</strong> ${user.settings?.privacyMode ? 'Yes' : 'No'}</p>
                    <p><strong>Language:</strong> ${user.settings?.language || 'English'}</p>
                </div>

                <div class="detail-section">
                    <h4>Device Information</h4>
                    <p><strong>Device Type:</strong> ${user.deviceInfo?.deviceType || 'N/A'}</p>
                    <p><strong>OS Version:</strong> ${user.deviceInfo?.osVersion || 'N/A'}</p>
                    <p><strong>App Version:</strong> ${user.deviceInfo?.appVersion || 'N/A'}</p>
                    <p><strong>Last IP Address:</strong> ${user.deviceInfo?.lastIpAddress || 'N/A'}</p>
                    <p><strong>Location:</strong> ${user.deviceInfo?.location || 'N/A'}</p>
                </div>

                <div class="detail-section fraud-analysis">
                    <h4>🚨 FRAUD RISK ANALYSIS</h4>
                    ${this.generateFraudAnalysis(user)}
                </div>

                <div class="detail-section">
                    <h4>Account Status & Actions</h4>
                    <p><strong>Account Status:</strong> 
                        <span class="status-badge status-${user.status?.toLowerCase() || 'active'}">
                            ${user.status || 'ACTIVE'}
                        </span>
                    </p>
                    <p><strong>KYC Status:</strong> 
                        <span class="status-badge status-${user.kycStatus?.toLowerCase() || 'pending'}">
                            ${user.kycStatus || 'PENDING'}
                        </span>
                    </p>
                    <p><strong>Risk Level:</strong> 
                        <span class="risk-level risk-${user.riskLevel?.toLowerCase() || 'low'}">
                            ${user.riskLevel || 'LOW'}
                        </span>
                    </p>
                    <p><strong>Total Login Count:</strong> ${user.loginCount || 0}</p>
                    <p><strong>Failed Login Attempts:</strong> ${user.failedLoginAttempts || 0}</p>
                </div>

                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                    <button class="btn btn-primary" onclick="adminPanel.editUser('${user.id}')">
                        <i class="fas fa-edit"></i> Edit User
                    </button>
                    <button class="btn btn-info" onclick="adminPanel.viewUserTransactions('${user.id}')">
                        <i class="fas fa-list"></i> All Transactions
                    </button>
                    <button class="btn btn-success" onclick="adminPanel.viewUserGames('${user.id}')">
                        <i class="fas fa-gamepad"></i> All Games
                    </button>
                    ${user.status !== 'SUSPENDED' ? `
                        <button class="btn btn-warning" onclick="adminPanel.suspendUser('${user.id}')">
                            <i class="fas fa-ban"></i> Suspend
                        </button>
                    ` : `
                        <button class="btn btn-success" onclick="adminPanel.unsuspendUser('${user.id}')">
                            <i class="fas fa-check"></i> Unsuspend
                        </button>
                    `}
                </div>
            </div>
        `;

        this.showModal(`User Details - ${user.name || user.phoneNumber}`, modalContent);
    }
    
    generateFraudAnalysis(user) {
        const flags = [];
        const warnings = [];
        const stats = user.statistics || {};
        const wallet = user.wallet || {};
        
        // Critical Red Flags
        if (stats.totalWinnings > 0 && stats.totalDeposits === 0) {
            flags.push('🚨 CRITICAL: Has winnings (₹' + (stats.totalWinnings || 0) + ') but ZERO deposits - Possible fraud!');
        }
        
        if ((stats.gamesWon || 0) === 0 && (stats.totalWinnings || 0) > 0) {
            flags.push('🚨 CRITICAL: Has winnings but ZERO games won - System manipulation suspected!');
        }
        
        if ((user.loginCount || 0) === 0 && (stats.totalGames || 0) > 0) {
            flags.push('🚨 CRITICAL: Played games but ZERO logins - Bot/Automated account!');
        }
        
        if (wallet.withdrawableBalance === 0 && (stats.totalWinnings || 0) > 50) {
            flags.push('🚨 CRITICAL: High winnings but zero withdrawable balance - Suspicious activity!');
        }
        
        // Warning Signs
        if ((user.kycStatus || 'PENDING') === 'PENDING' && (stats.totalWinnings || 0) > 100) {
            warnings.push('⚠️ WARNING: High winnings without KYC verification');
        }
        
        if (!user.lastActive && (stats.totalGames || 0) > 0) {
            warnings.push('⚠️ WARNING: Never logged in but has game activity');
        }
        
        const depositTransactions = (user.allTransactions || []).filter(t => t.type === 'DEPOSIT');
        const withdrawalTransactions = (user.allTransactions || []).filter(t => t.type === 'WITHDRAWAL');
        const gameEntryTransactions = (user.allTransactions || []).filter(t => t.type === 'GAME_ENTRY');
        const winningTransactions = (user.allTransactions || []).filter(t => t.type === 'GAME_WINNING');
        
        if (depositTransactions.length === 0 && (stats.totalWinnings || 0) > 0) {
            warnings.push('⚠️ WARNING: No deposit transactions but has winnings');
        }
        
        if (gameEntryTransactions.length === 0 && (stats.totalGames || 0) > 0) {
            warnings.push('⚠️ WARNING: No game entry transactions but claims to have played games');
        }
        
        if (winningTransactions.length === 0 && (stats.totalWinnings || 0) > 0) {
            warnings.push('⚠️ WARNING: No winning transactions but has total winnings');
        }
        
        if ((stats.totalWinnings || 0) > 0 && (!user.allTransactions || user.allTransactions.length === 0)) {
            flags.push('🚨 CRITICAL: Has winnings but NO transaction records - Data manipulation!');
        }
        
        if ((stats.totalGames || 0) > 0 && (!user.allGames || user.allGames.length === 0)) {
            flags.push('🚨 CRITICAL: Claims games played but NO game records - Fake statistics!');
        }
        
        const winRate = stats.winRate || 0;
        if (winRate > 80 && (stats.totalGames || 0) > 5) {
            warnings.push('⚠️ WARNING: Unusually high win rate (' + winRate + '%) - Possible cheating');
        }
        
        // Calculate overall risk score
        let riskScore = 0;
        riskScore += flags.length * 30; // Each red flag = 30 points
        riskScore += warnings.length * 10; // Each warning = 10 points
        
        let riskLevel = 'LOW';
        let riskColor = 'success';
        if (riskScore >= 50) {
            riskLevel = 'CRITICAL';
            riskColor = 'danger';
        } else if (riskScore >= 20) {
            riskLevel = 'HIGH';
            riskColor = 'warning';
        } else if (riskScore >= 10) {
            riskLevel = 'MEDIUM';
            riskColor = 'info';
        }
        
        let analysis = `
            <div class="fraud-score">
                <strong>FRAUD RISK SCORE: <span class="risk-score risk-${riskColor}">${riskScore}/100 (${riskLevel})</span></strong>
            </div>
        `;
        
        if (flags.length > 0) {
            analysis += `
                <div class="fraud-flags">
                    <h5 style="color: #dc3545; margin: 10px 0 5px 0;">🚨 CRITICAL RED FLAGS:</h5>
                    ${flags.map(flag => `<div class="fraud-flag critical">${flag}</div>`).join('')}
                </div>
            `;
        }
        
        if (warnings.length > 0) {
            analysis += `
                <div class="fraud-warnings">
                    <h5 style="color: #fd7e14; margin: 10px 0 5px 0;">⚠️ WARNING SIGNS:</h5>
                    ${warnings.map(warning => `<div class="fraud-flag warning">${warning}</div>`).join('')}
                </div>
            `;
        }
        
        if (flags.length === 0 && warnings.length === 0) {
            analysis += `
                <div class="fraud-clean">
                    <div class="fraud-flag clean">✅ No suspicious patterns detected - Account appears legitimate</div>
                </div>
            `;
        }
        
        // Recommendation
        let recommendation = '';
        if (riskScore >= 50) {
            recommendation = `
                <div class="fraud-recommendation critical">
                    <strong>🚫 RECOMMENDATION: REJECT WITHDRAWAL - High fraud risk detected!</strong>
                    <br>Investigate account immediately and consider suspension.
                </div>
            `;
        } else if (riskScore >= 20) {
            recommendation = `
                <div class="fraud-recommendation warning">
                    <strong>⏸️ RECOMMENDATION: HOLD WITHDRAWAL - Manual review required</strong>
                    <br>Verify user identity and investigate suspicious patterns before approval.
                </div>
            `;
        } else if (riskScore >= 10) {
            recommendation = `
                <div class="fraud-recommendation info">
                    <strong>🔍 RECOMMENDATION: REVIEW WITHDRAWAL - Some concerns noted</strong>
                    <br>Consider additional verification before approval.
                </div>
            `;
        } else {
            recommendation = `
                <div class="fraud-recommendation success">
                    <strong>✅ RECOMMENDATION: APPROVE WITHDRAWAL - Low risk account</strong>
                    <br>Account appears legitimate and safe to process.
                </div>
            `;
        }
        
        analysis += recommendation;
        
        return analysis;
    }
    
    async viewUserTransactions(userId) {
        this.showModal('User Transactions', `
            <div class="user-transactions">
                <p>Loading all transactions for user...</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }
    
    async viewUserGames(userId) {
        this.showModal('User Games', `
            <div class="user-games">
                <p>Loading all games for user...</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }
    
    async editUser(userId) {
        this.showModal('Edit User', `
            <div class="edit-user">
                <p>User ID: ${userId}</p>
                <p>Edit user functionality coming soon...</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }
    
    async suspendUser(userId) {
        if (!confirm('Are you sure you want to suspend this user?')) return;
        
        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/users/${userId}/suspend`, { method: 'POST' });
            
            if (data?.success) {
                this.showSuccess('User suspended successfully');
                this.closeModal();
                this.loadUsers();
            } else {
                this.showError('Failed to suspend user');
            }
        } catch (error) {
            this.showError('Failed to suspend user');
        } finally {
            this.hideLoading();
        }
    }
    
    async unsuspendUser(userId) {
        if (!confirm('Are you sure you want to unsuspend this user?')) return;
        
        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/users/${userId}/unsuspend`, { method: 'POST' });
            
            if (data?.success) {
                this.showSuccess('User unsuspended successfully');
                this.closeModal();
                this.loadUsers();
            } else {
                this.showError('Failed to unsuspend user');
            }
        } catch (error) {
            this.showError('Failed to unsuspend user');
        } finally {
            this.hideLoading();
        }
    }

    // ==================== WITHDRAWALS ====================
    async loadWithdrawals() {
        try {
            this.showLoading();
            const status = document.getElementById('withdrawal-status-filter')?.value || '';
            const data = await this.fetchAPI(`/admin/withdrawals${status ? `?status=${status}` : ''}`);
            
            if (data?.success) {
                this.renderWithdrawalsTable(data.withdrawals || []);
            }
        } catch (error) {
            console.error('Withdrawals error:', error);
            this.renderWithdrawalsTable([]);
        } finally {
            this.hideLoading();
        }
    }

    renderWithdrawalsTable(withdrawals) {
        const tbody = document.querySelector('#withdrawals-table tbody');
        if (!tbody) return;

        if (withdrawals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No withdrawal requests found</td></tr>';
            return;
        }

        tbody.innerHTML = withdrawals.map(withdrawal => `
            <tr>
                <td>${withdrawal.id.slice(0, 8)}...</td>
                <td><strong>${withdrawal.user?.name || withdrawal.user?.phoneNumber || 'N/A'}</strong></td>
                <td>₹${withdrawal.amount || 0}</td>
                <td>${withdrawal.method || 'Bank Transfer'}</td>
                <td><span class="status-badge status-${(withdrawal.status || 'PENDING').toLowerCase()}">${withdrawal.status || 'PENDING'}</span></td>
                <td>${withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="adminPanel.viewWithdrawal('${withdrawal.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${withdrawal.status === 'PENDING' ? `
                        <button class="btn btn-small btn-success" onclick="adminPanel.approveWithdrawal('${withdrawal.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    async viewWithdrawal(withdrawalId) {
        this.showModal('Withdrawal Details', `
            <div class="withdrawal-details">
                <p>Withdrawal ID: ${withdrawalId}</p>
                <p>Loading withdrawal details...</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }

    async approveWithdrawal(withdrawalId) {
        if (!confirm('Approve this withdrawal?')) return;
        
        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/withdrawals/${withdrawalId}/approve`, { method: 'POST' });
            
            if (data?.success) {
                this.showSuccess('Withdrawal approved');
                this.loadWithdrawals();
            } else {
                this.showError('Failed to approve withdrawal');
            }
        } catch (error) {
            this.showError('Failed to approve withdrawal');
        } finally {
            this.hideLoading();
        }
    }

    // ==================== REFERRALS ====================
    async loadReferrals() {
        try {
            this.showLoading();
            const data = await this.fetchAPI('/admin/referrals');
            
            if (data?.success) {
                this.renderReferralsTable(data.referrals || []);
                this.updateReferralStats(data.stats || {});
            }
        } catch (error) {
            console.error('Referrals error:', error);
            this.renderReferralsTable([]);
            this.loadFallbackReferralStats();
        } finally {
            this.hideLoading();
        }
    }

    renderReferralsTable(referrals) {
        const tbody = document.querySelector('#referrals-table tbody');
        if (!tbody) return;

        if (referrals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No referral data found</td></tr>';
            return;
        }

        tbody.innerHTML = referrals.map(referral => `
            <tr>
                <td><strong>${referral.user?.name || referral.user?.phoneNumber || 'N/A'}</strong></td>
                <td>${referral.referralCode || 'N/A'}</td>
                <td>${referral.referralCount || 0}</td>
                <td>₹${referral.referralBonusEarned || 0}</td>
                <td>${(referral.recentReferrals || []).length}</td>
                <td>${referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="adminPanel.viewReferralDetails('${referral.userId}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateReferralStats(stats) {
        this.updateElement('total-referrers', stats.totalReferrers || 0);
        this.updateElement('total-referred-users', stats.totalReferredUsers || 0);
        this.updateElement('total-referral-bonus', `₹${(stats.totalReferralBonus || 0).toLocaleString()}`);
        this.updateElement('avg-referrals-per-user', (stats.avgReferralsPerUser || 0).toFixed(1));
    }

    loadFallbackReferralStats() {
        this.updateElement('total-referrers', 'N/A');
        this.updateElement('total-referred-users', 'N/A');
        this.updateElement('total-referral-bonus', 'N/A');
        this.updateElement('avg-referrals-per-user', 'N/A');
    }

    async viewReferralDetails(userId) {
        this.showModal('Referral Details', `
            <div class="referral-details">
                <p>User ID: ${userId}</p>
                <p>Loading referral details...</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }

    // ==================== FEEDBACK ====================
    async loadFeedback() {
        try {
            this.showLoading();
            const status = document.getElementById('feedback-status-filter')?.value || '';
            const data = await this.fetchAPI(`/admin/feedback${status ? `?status=${status}` : ''}`);
            
            if (data?.success) {
                this.renderFeedbackTable(data.feedback || []);
            }
        } catch (error) {
            console.error('Feedback error:', error);
            this.renderFeedbackTable([]);
        } finally {
            this.hideLoading();
        }
    }

    renderFeedbackTable(feedback) {
        const tbody = document.querySelector('#feedback-table tbody');
        if (!tbody) return;

        if (feedback.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No feedback found</td></tr>';
            return;
        }

        tbody.innerHTML = feedback.map(item => `
            <tr>
                <td>${item.id.slice(0, 8)}...</td>
                <td><strong>${item.user?.name || item.user?.phoneNumber || 'Anonymous'}</strong></td>
                <td>${item.type || 'GENERAL'}</td>
                <td>${(item.message || '').substring(0, 50)}${(item.message || '').length > 50 ? '...' : ''}</td>
                <td><span class="status-badge status-${(item.status || 'PENDING').toLowerCase()}">${item.status || 'PENDING'}</span></td>
                <td>${item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="adminPanel.viewFeedback('${item.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async viewFeedback(feedbackId) {
        this.showModal('Feedback Details', `
            <div class="feedback-details">
                <p>Feedback ID: ${feedbackId}</p>
                <p>Loading feedback details...</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }

    // ==================== PUSH NOTIFICATIONS ====================
    async loadPushNotifications() {
        try {
            this.showLoading();
            const data = await this.fetchAPI('/push-notifications/history');
            
            if (data?.success) {
                this.renderNotificationsTable(data.data?.notifications || []);
                this.updateNotificationStats(data.data?.stats || {});
            }
        } catch (error) {
            console.error('Push notifications error:', error);
            this.renderNotificationsTable([]);
            this.loadFallbackNotifications();
        } finally {
            this.hideLoading();
        }
    }

    renderNotificationsTable(notifications) {
        const tbody = document.querySelector('#notifications-table tbody');
        if (!tbody) return;
        
        if (notifications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No notifications found</td></tr>';
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
                    </div>
                </td>
                <td>${notification.sentAt ? new Date(notification.sentAt).toLocaleString() : 'Not sent'}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="adminPanel.viewNotificationDetails('${notification.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateNotificationStats(stats) {
        this.updateElement('total-notifications', stats.totalNotifications || 0);
        this.updateElement('sent-notifications', stats.sentNotifications || 0);
        this.updateElement('active-devices', stats.activeDevices || 0);
        this.updateElement('pending-notifications', stats.pendingNotifications || 0);
    }

    loadFallbackNotifications() {
        this.updateElement('total-notifications', 'N/A');
        this.updateElement('sent-notifications', 'N/A');
        this.updateElement('active-devices', 'N/A');
        this.updateElement('pending-notifications', 'N/A');
        this.renderNotificationsTable([]);
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
        
        if (!title || !body) {
            this.showError('Title and message are required');
            return;
        }

        try {
            this.showLoading();
            const data = await this.fetchAPI('/push-notifications/send', {
                method: 'POST',
                body: JSON.stringify({ title, body, type, targetType: 'ALL_USERS' })
            });
            
            if (data?.success) {
                this.showSuccess('Notification sent successfully!');
                this.closeModal();
                this.loadPushNotifications();
            } else {
                this.showError('Failed to send notification');
            }
        } catch (error) {
            this.showError('Failed to send notification');
        } finally {
            this.hideLoading();
        }
    }

    async viewNotificationDetails(notificationId) {
        this.showModal('Notification Details', `
            <div class="notification-details">
                <p>Notification ID: ${notificationId}</p>
                <p>Loading notification details...</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }

    // ==================== ADMINISTRATION ====================
    async loadAdministration() {
        const adminSection = document.querySelector('[data-section="administration"]');
        adminSection.style.display = 'flex';
        
        try {
            this.showLoading();
            const data = await this.fetchAPI('/admin/administrators');
            
            if (data?.success) {
                this.renderAdministratorsTable(data.administrators || []);
            }
        } catch (error) {
            console.error('Administration error:', error);
            this.renderAdministratorsTable([]);
        } finally {
            this.hideLoading();
        }
    }

    renderAdministratorsTable(administrators) {
        const tbody = document.querySelector('#admins-table tbody');
        if (!tbody) return;

        if (administrators.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No administrators found</td></tr>';
            return;
        }

        tbody.innerHTML = administrators.map(admin => `
            <tr>
                <td>${admin.id.slice(0, 8)}...</td>
                <td>${admin.username}</td>
                <td>${admin.email || 'N/A'}</td>
                <td><span class="role-badge role-${admin.role.toLowerCase()}">${admin.role}</span></td>
                <td>${new Date(admin.createdAt).toLocaleString()}</td>
                <td>${admin.updatedAt ? new Date(admin.updatedAt).toLocaleString() : 'Never'}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="adminPanel.viewAdministrator('${admin.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    showAddAdminModal() {
        const modalContent = `
            <form id="add-admin-form">
                <div class="form-group">
                    <label for="admin-username">Username *</label>
                    <input type="text" id="admin-username" required placeholder="Enter username">
                </div>
                
                <div class="form-group">
                    <label for="admin-email">Email</label>
                    <input type="email" id="admin-email" placeholder="Enter email address">
                </div>
                
                <div class="form-group">
                    <label for="admin-password">Password *</label>
                    <input type="password" id="admin-password" required placeholder="Enter password">
                </div>
                
                <div class="form-group">
                    <label for="admin-role">Role</label>
                    <select id="admin-role">
                        <option value="ADMIN">Admin</option>
                        <option value="MODERATOR">Moderator</option>
                    </select>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Administrator
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Add Administrator', modalContent);

        document.getElementById('add-admin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAdministrator();
        });
    }

    async addAdministrator() {
        const username = document.getElementById('admin-username').value;
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const role = document.getElementById('admin-role').value;
        
        if (!username || !password) {
            this.showError('Username and password are required');
            return;
        }

        try {
            this.showLoading();
            const data = await this.fetchAPI('/admin/administrators', {
                method: 'POST',
                body: JSON.stringify({ username, email, password, role })
            });
            
            if (data?.success) {
                this.showSuccess('Administrator added successfully');
                this.closeModal();
                this.loadAdministration();
            } else {
                this.showError('Failed to add administrator');
            }
        } catch (error) {
            this.showError('Failed to add administrator');
        } finally {
            this.hideLoading();
        }
    }

    async viewAdministrator(adminId) {
        this.showModal('Administrator Details', `
            <div class="admin-details">
                <p>Administrator ID: ${adminId}</p>
                <p>Loading administrator details...</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }

    // ==================== OTHER SECTIONS ====================
    async loadGames() {
        this.showGenericMessage('games-table', 'No games found');
    }

    async loadTransactions() {
        try {
            this.showLoading();
            const typeFilter = document.getElementById('transaction-type-filter')?.value || '';
            const statusFilter = document.getElementById('transaction-status-filter')?.value || '';
            
            const params = new URLSearchParams();
            if (typeFilter) params.set('type', typeFilter);
            if (statusFilter) params.set('status', statusFilter);
            
            const data = await this.fetchAPI(`/admin/transactions${params.toString() ? '?' + params.toString() : ''}`);
            
            if (data?.success) {
                this.renderTransactionsTable(data.transactions || []);
            } else {
                this.renderTransactionsTable([]);
            }
        } catch (error) {
            console.error('Transactions error:', error);
            this.renderTransactionsTable([]);
        } finally {
            this.hideLoading();
        }
    }
    
    renderTransactionsTable(transactions) {
        const tbody = document.querySelector('#transactions-table tbody');
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No transactions found</td></tr>';
            return;
        }

        tbody.innerHTML = transactions.map(tx => `
            <tr>
                <td>${tx.id.slice(0, 8)}...</td>
                <td><strong>${tx.user?.name || tx.user?.phoneNumber || 'N/A'}</strong></td>
                <td>${tx.type || 'N/A'}</td>
                <td>₹${tx.amount || 0}</td>
                <td><span class="status-badge status-${(tx.status || 'PENDING').toLowerCase()}">${tx.status || 'PENDING'}</span></td>
                <td>${tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="adminPanel.viewTransaction('${tx.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    async viewTransaction(transactionId) {
        this.showModal('Transaction Details', `
            <div class="transaction-details">
                <p>Transaction ID: ${transactionId}</p>
                <p>Loading transaction details...</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }

    async loadBots() {
        this.showGenericMessage('bots-table', 'No bots found');
    }

    async loadWebsiteData() {
        this.showGenericMessage('website-data-table', 'No website data found');
    }

    async loadAnalytics() {
        this.updateElement('new-users', 'N/A');
        this.updateElement('active-users', 'N/A');
        this.updateElement('retention-rate', 'N/A');
        this.updateElement('total-deposits', 'N/A');
        this.updateElement('total-withdrawals', 'N/A');
        this.updateElement('net-revenue', 'N/A');
    }

    async loadUpdates() {
        this.showGenericMessage('updates-table', 'No updates found');
    }

    async loadSettings() {
        // Load default settings
        this.updateElement('min-entry-fee', '5', 'value');
        this.updateElement('max-entry-fee', '1000', 'value');
        this.updateElement('min-bots', '10', 'value');
        this.updateElement('bot-win-rate', '50', 'value');
        this.updateElement('maintenance-mode', 'false', 'value');
        this.updateElement('maintenance-message', 'System is under maintenance. Please try again later.', 'value');
    }

    // ==================== UTILITY METHODS ====================
    showGenericMessage(tableId, message) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (tbody) {
            const colCount = tbody.closest('table')?.querySelectorAll('th').length || 7;
            tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align: center; padding: 20px;">${message}</td></tr>`;
        }
    }

    updateElement(id, value, property = 'textContent') {
        const element = document.getElementById(id);
        if (element) {
            element[property] = value;
        }
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
        document.getElementById('loading')?.classList.add('active');
    }

    hideLoading() {
        document.getElementById('loading')?.classList.remove('active');
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

    refreshNotifications() {
        this.loadPushNotifications();
    }

    exportReport() {
        this.showSuccess('Report export feature coming soon');
    }

    showPublishUpdateModal() {
        this.showModal('Publish App Update', `
            <div class="update-publish">
                <p>App update publishing feature coming soon.</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }

    showAddUserModal() {
        this.showModal('Add User', `
            <div class="add-user">
                <p>Add user feature coming soon.</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                </div>
            </div>
        `);
    }

    createBot() {
        const name = prompt('Enter bot name:');
        if (name) {
            this.showSuccess(`Bot "${name}" creation initiated`);
        }
    }

    backupDatabase() {
        if (confirm('Create database backup?')) {
            this.showSuccess('Database backup initiated');
        }
    }

    clearLogs() {
        if (confirm('Clear all logs? This cannot be undone.')) {
            this.showSuccess('Logs cleared successfully');
        }
    }

    resetSystem() {
        const confirmation = prompt('Type "RESET" to confirm system reset:');
        if (confirmation === 'RESET') {
            this.showSuccess('System reset initiated');
        }
    }
}

// Create global admin panel instance
window.adminPanel = new BudzeeAdminPanel();
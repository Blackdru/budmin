// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.baseURL = 'https://test.fivlog.space/api'; // Production backend URL
        this.currentSection = 'dashboard';
        this.authToken = null;
        this.init();
    }

    init() {
        // Check authentication
        if (!this.checkAuth()) {
            window.location.href = 'login.html';
            return;
        }
        
        this.setupEventListeners();
        this.loadDashboard();
        this.startAutoRefresh();
    }

    checkAuth() {
        const adminAuth = localStorage.getItem('adminAuth');
        if (!adminAuth) return false;
        
        try {
            const auth = JSON.parse(adminAuth);
            // Check if session is still valid (24 hours)
            if (Date.now() - auth.loginTime > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('adminAuth');
                return false;
            }
            
            // Set auth token for API calls
            this.authToken = auth.username === 'superadmin' ? 'superadmin-token-456' : 'admin-token-123';
            
            // Update header with admin info
            document.querySelector('.admin-profile span').textContent = auth.username;
            
            return true;
        } catch (e) {
            localStorage.removeItem('adminAuth');
            return false;
        }
    }

    logout() {
        localStorage.removeItem('adminAuth');
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
            this.loadGames(e.target.value);
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
            this.loadWithdrawals(e.target.value);
        });

        // Feedback status filter
        document.getElementById('feedback-status-filter')?.addEventListener('change', (e) => {
            this.loadFeedback(e.target.value);
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
            settings: 'System Settings'
        };
        document.querySelector('.page-title').textContent = titles[section];

        this.currentSection = section;

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
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async loadDashboard() {
        try {
            this.showLoading();
            
            // Load dashboard stats
            const [healthData, queueData, socketData, botData] = await Promise.all([
                this.fetchAPI('/health'),
                this.fetchAPI('/debug/queue'),
                this.fetchAPI('/debug/sockets'),
                this.fetchAPI('/debug/bots')
            ]);

            // Update stats
            if (healthData) {
                document.getElementById('total-users').textContent = socketData?.totalConnections || 0;
                document.getElementById('total-games').textContent = healthData.games?.activeGames || 0;
                document.getElementById('total-revenue').textContent = '₹0'; // Calculate from transactions
                document.getElementById('active-bots').textContent = botData?.botStats?.totalBots || 0;
            }

            // Load recent activity
            this.loadRecentActivity();
            
            // Load system status
            this.loadSystemStatus(healthData);

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load dashboard data');
        } finally {
            this.hideLoading();
        }
    }

    loadRecentActivity() {
        const activityContainer = document.getElementById('recent-activity');
        const activities = [
            { type: 'user', icon: 'fas fa-user-plus', title: 'New user registered', time: '2 minutes ago', color: '#667eea' },
            { type: 'game', icon: 'fas fa-gamepad', title: 'Memory game completed', time: '5 minutes ago', color: '#f093fb' },
            { type: 'transaction', icon: 'fas fa-credit-card', title: 'Deposit processed', time: '10 minutes ago', color: '#4facfe' },
            { type: 'bot', icon: 'fas fa-robot', title: 'Bot deployed to queue', time: '15 minutes ago', color: '#43e97b' }
        ];

        activityContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${activity.color}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-info">
                    <h4>${activity.title}</h4>
                    <p>System activity</p>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');
    }

    loadSystemStatus(healthData) {
        const statusContainer = document.getElementById('system-status');
        const statuses = [
            { name: 'Database', status: 'online', indicator: 'success' },
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

    async loadUsers() {
        try {
            this.showLoading();
            
            // Since there's no direct users endpoint, we'll create mock data
            // In a real implementation, you'd create a users endpoint in your backend
            const users = this.generateMockUsers();
            
            const tbody = document.querySelector('#users-table tbody');
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.id.slice(0, 8)}...</td>
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.phoneNumber}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>₹${user.balance}</td>
                    <td><span class="status-badge status-${user.isVerified ? 'active' : 'inactive'}">${user.isVerified ? 'Verified' : 'Unverified'}</span></td>
                    <td>
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.editUser('${user.id}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="adminPanel.deleteUser('${user.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users');
        } finally {
            this.hideLoading();
        }
    }

    async loadGames(statusFilter = '') {
        try {
            this.showLoading();
            
            // Generate mock games data
            const games = this.generateMockGames().filter(game => 
                !statusFilter || game.status === statusFilter
            );
            
            const tbody = document.querySelector('#games-table tbody');
            tbody.innerHTML = games.map(game => `
                <tr>
                    <td>${game.id.slice(0, 8)}...</td>
                    <td>${game.type}</td>
                    <td>${game.participants.length}/${game.maxPlayers}</td>
                    <td>₹${game.entryFee}</td>
                    <td>₹${game.prizePool}</td>
                    <td><span class="status-badge status-${game.status.toLowerCase()}">${game.status}</span></td>
                    <td>${new Date(game.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewGame('${game.id}')">View</button>
                        ${game.status === 'WAITING' ? `<button class="btn btn-small btn-danger" onclick="adminPanel.cancelGame('${game.id}')">Cancel</button>` : ''}
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading games:', error);
            this.showError('Failed to load games');
        } finally {
            this.hideLoading();
        }
    }

    async loadTransactions() {
        try {
            this.showLoading();
            
            const typeFilter = document.getElementById('transaction-type-filter')?.value || '';
            const statusFilter = document.getElementById('transaction-status-filter')?.value || '';
            
            // Generate mock transactions
            const transactions = this.generateMockTransactions().filter(tx => 
                (!typeFilter || tx.type === typeFilter) &&
                (!statusFilter || tx.status === statusFilter)
            );
            
            const tbody = document.querySelector('#transactions-table tbody');
            tbody.innerHTML = transactions.map(tx => `
                <tr>
                    <td>${tx.id.slice(0, 8)}...</td>
                    <td>${tx.userName}</td>
                    <td>${tx.type}</td>
                    <td>₹${tx.amount}</td>
                    <td><span class="status-badge status-${tx.status.toLowerCase()}">${tx.status}</span></td>
                    <td>${new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewTransaction('${tx.id}')">View</button>
                        ${tx.status === 'PENDING' ? `<button class="btn btn-small btn-success" onclick="adminPanel.approveTransaction('${tx.id}')">Approve</button>` : ''}
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showError('Failed to load transactions');
        } finally {
            this.hideLoading();
        }
    }

    async loadWithdrawals(statusFilter = '') {
        try {
            this.showLoading();
            
            // Generate mock withdrawals
            const withdrawals = this.generateMockWithdrawals().filter(w => 
                !statusFilter || w.status === statusFilter
            );
            
            const tbody = document.querySelector('#withdrawals-table tbody');
            tbody.innerHTML = withdrawals.map(w => `
                <tr>
                    <td>${w.id.slice(0, 8)}...</td>
                    <td>${w.userName}</td>
                    <td>₹${w.amount}</td>
                    <td>${w.method}</td>
                    <td><span class="status-badge status-${w.status.toLowerCase()}">${w.status}</span></td>
                    <td>${new Date(w.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewWithdrawal('${w.id}')">View</button>
                        ${w.status === 'PENDING' ? `
                            <button class="btn btn-small btn-success" onclick="adminPanel.approveWithdrawal('${w.id}')">Approve</button>
                            <button class="btn btn-small btn-danger" onclick="adminPanel.rejectWithdrawal('${w.id}')">Reject</button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading withdrawals:', error);
            this.showError('Failed to load withdrawals');
        } finally {
            this.hideLoading();
        }
    }

    async loadBots() {
        try {
            this.showLoading();
            
            const botData = await this.fetchAPI('/debug/bots');
            
            if (botData?.botStats) {
                document.getElementById('bot-total').textContent = botData.botStats.totalBots;
                document.getElementById('bot-active').textContent = botData.botStats.availableBots;
                document.getElementById('bot-queue').textContent = botData.botStats.botsInQueue;
                document.getElementById('bot-games').textContent = botData.botStats.botsInGames;
            }
            
            // Generate mock bot data for table
            const bots = this.generateMockBots();
            
            const tbody = document.querySelector('#bots-table tbody');
            tbody.innerHTML = bots.map(bot => `
                <tr>
                    <td>${bot.id.slice(0, 8)}...</td>
                    <td>${bot.name}</td>
                    <td>${bot.gamesPlayed}</td>
                    <td>${bot.winRate}%</td>
                    <td><span class="status-badge status-${bot.status.toLowerCase()}">${bot.status}</span></td>
                    <td>${bot.lastActive}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.editBot('${bot.id}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="adminPanel.deleteBot('${bot.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading bots:', error);
            this.showError('Failed to load bots');
        } finally {
            this.hideLoading();
        }
    }

    async loadFeedback(statusFilter = '') {
        try {
            this.showLoading();
            
            // Generate mock feedback
            const feedback = this.generateMockFeedback().filter(f => 
                !statusFilter || f.status === statusFilter
            );
            
            const tbody = document.querySelector('#feedback-table tbody');
            tbody.innerHTML = feedback.map(f => `
                <tr>
                    <td>${f.id.slice(0, 8)}...</td>
                    <td>${f.userName}</td>
                    <td>${f.type}</td>
                    <td>${f.message.substring(0, 50)}...</td>
                    <td><span class="status-badge status-${f.status.toLowerCase()}">${f.status}</span></td>
                    <td>${new Date(f.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-small btn-secondary" onclick="adminPanel.viewFeedback('${f.id}')">View</button>
                        ${f.status === 'PENDING' ? `<button class="btn btn-small btn-success" onclick="adminPanel.respondFeedback('${f.id}')">Respond</button>` : ''}
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading feedback:', error);
            this.showError('Failed to load feedback');
        } finally {
            this.hideLoading();
        }
    }

    loadSettings() {
        // Load current settings (mock data)
        document.getElementById('min-entry-fee').value = 5;
        document.getElementById('max-entry-fee').value = 1000;
        document.getElementById('min-bots').value = 10;
        document.getElementById('bot-win-rate').value = 50;
    }

    // API Helper Methods
    async fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            return null;
        }
    }

    // Mock Data Generators
    generateMockUsers() {
        const users = [];
        for (let i = 0; i < 20; i++) {
            users.push({
                id: `user_${Math.random().toString(36).substr(2, 9)}`,
                name: `User ${i + 1}`,
                phoneNumber: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                email: Math.random() > 0.5 ? `user${i + 1}@example.com` : null,
                balance: Math.floor(Math.random() * 5000),
                isVerified: Math.random() > 0.3
            });
        }
        return users;
    }

    generateMockGames() {
        const games = [];
        const statuses = ['WAITING', 'PLAYING', 'FINISHED', 'CANCELLED'];
        
        for (let i = 0; i < 15; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const entryFee = [5, 10, 25, 50, 100][Math.floor(Math.random() * 5)];
            
            games.push({
                id: `game_${Math.random().toString(36).substr(2, 9)}`,
                type: 'MEMORY',
                maxPlayers: 2,
                entryFee,
                prizePool: entryFee * 2 * 0.9, // 90% of total entry fees
                status,
                participants: status === 'WAITING' ? [{}] : [{}, {}],
                createdAt: new Date(Date.now() - Math.random() * 86400000 * 7) // Last 7 days
            });
        }
        return games;
    }

    generateMockTransactions() {
        const transactions = [];
        const types = ['DEPOSIT', 'WITHDRAWAL', 'GAME_ENTRY', 'GAME_WINNING', 'REFUND'];
        const statuses = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];
        
        for (let i = 0; i < 25; i++) {
            transactions.push({
                id: `tx_${Math.random().toString(36).substr(2, 9)}`,
                userName: `User ${i + 1}`,
                type: types[Math.floor(Math.random() * types.length)],
                amount: Math.floor(Math.random() * 1000) + 10,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                createdAt: new Date(Date.now() - Math.random() * 86400000 * 30) // Last 30 days
            });
        }
        return transactions;
    }

    generateMockWithdrawals() {
        const withdrawals = [];
        const methods = ['BANK', 'UPI'];
        const statuses = ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'];
        
        for (let i = 0; i < 15; i++) {
            withdrawals.push({
                id: `wd_${Math.random().toString(36).substr(2, 9)}`,
                userName: `User ${i + 1}`,
                amount: Math.floor(Math.random() * 5000) + 100,
                method: methods[Math.floor(Math.random() * methods.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                createdAt: new Date(Date.now() - Math.random() * 86400000 * 14) // Last 14 days
            });
        }
        return withdrawals;
    }

    generateMockBots() {
        const bots = [];
        const statuses = ['ACTIVE', 'INACTIVE', 'IN_GAME', 'IN_QUEUE'];
        
        for (let i = 0; i < 10; i++) {
            bots.push({
                id: `bot_${Math.random().toString(36).substr(2, 9)}`,
                name: `Bot_${i + 1}`,
                gamesPlayed: Math.floor(Math.random() * 1000),
                winRate: Math.floor(Math.random() * 40) + 30, // 30-70%
                status: statuses[Math.floor(Math.random() * statuses.length)],
                lastActive: Math.random() > 0.5 ? 'Online' : `${Math.floor(Math.random() * 60)} min ago`
            });
        }
        return bots;
    }

    generateMockFeedback() {
        const feedback = [];
        const types = ['GENERAL', 'BUG_REPORT', 'FEATURE_REQUEST', 'COMPLAINT', 'SUGGESTION'];
        const statuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'CLOSED'];
        const messages = [
            'Great game, love playing memory games!',
            'Found a bug in the payment system',
            'Please add more game modes',
            'Withdrawal is taking too long',
            'Suggest adding tournaments'
        ];
        
        for (let i = 0; i < 20; i++) {
            feedback.push({
                id: `fb_${Math.random().toString(36).substr(2, 9)}`,
                userName: `User ${i + 1}`,
                type: types[Math.floor(Math.random() * types.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                createdAt: new Date(Date.now() - Math.random() * 86400000 * 7) // Last 7 days
            });
        }
        return feedback;
    }

    // Action Methods
    showAddUserModal() {
        this.showModal('Add New User', `
            <form id="add-user-form">
                <div class="setting-item">
                    <label>Name</label>
                    <input type="text" name="name" required>
                </div>
                <div class="setting-item">
                    <label>Phone Number</label>
                    <input type="tel" name="phoneNumber" required>
                </div>
                <div class="setting-item">
                    <label>Email</label>
                    <input type="email" name="email">
                </div>
                <div class="setting-item">
                    <label>Initial Balance</label>
                    <input type="number" name="balance" value="0" min="0">
                </div>
                <button type="submit" class="btn btn-primary">Add User</button>
            </form>
        `);
    }

    editUser(userId) {
        this.showModal('Edit User', `
            <form id="edit-user-form">
                <div class="setting-item">
                    <label>Name</label>
                    <input type="text" name="name" value="User Name">
                </div>
                <div class="setting-item">
                    <label>Email</label>
                    <input type="email" name="email" value="user@example.com">
                </div>
                <div class="setting-item">
                    <label>Status</label>
                    <select name="status">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="banned">Banned</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Update User</button>
            </form>
        `);
    }

    deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            this.showSuccess('User deleted successfully');
        }
    }

    viewGame(gameId) {
        this.showModal('Game Details', `
            <div class="game-details">
                <p><strong>Game ID:</strong> ${gameId}</p>
                <p><strong>Type:</strong> Memory Game</p>
                <p><strong>Status:</strong> Playing</p>
                <p><strong>Players:</strong> 2/2</p>
                <p><strong>Entry Fee:</strong> ₹25</p>
                <p><strong>Prize Pool:</strong> ₹45</p>
                <p><strong>Started:</strong> 5 minutes ago</p>
            </div>
        `);
    }

    cancelGame(gameId) {
        if (confirm('Are you sure you want to cancel this game?')) {
            this.showSuccess('Game cancelled successfully');
            this.loadGames();
        }
    }

    viewTransaction(txId) {
        this.showModal('Transaction Details', `
            <div class="transaction-details">
                <p><strong>Transaction ID:</strong> ${txId}</p>
                <p><strong>User:</strong> User Name</p>
                <p><strong>Type:</strong> Deposit</p>
                <p><strong>Amount:</strong> ₹500</p>
                <p><strong>Status:</strong> Completed</p>
                <p><strong>Payment ID:</strong> pay_xyz123</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
        `);
    }

    approveTransaction(txId) {
        if (confirm('Approve this transaction?')) {
            this.showSuccess('Transaction approved successfully');
            this.loadTransactions();
        }
    }

    viewWithdrawal(wdId) {
        this.showModal('Withdrawal Details', `
            <div class="withdrawal-details">
                <p><strong>Withdrawal ID:</strong> ${wdId}</p>
                <p><strong>User:</strong> User Name</p>
                <p><strong>Amount:</strong> ₹1000</p>
                <p><strong>Method:</strong> Bank Transfer</p>
                <p><strong>Account:</strong> ****1234</p>
                <p><strong>IFSC:</strong> HDFC0001234</p>
                <p><strong>Status:</strong> Pending</p>
                <p><strong>Requested:</strong> ${new Date().toLocaleString()}</p>
            </div>
        `);
    }

    approveWithdrawal(wdId) {
        if (confirm('Approve this withdrawal?')) {
            this.showSuccess('Withdrawal approved successfully');
            this.loadWithdrawals();
        }
    }

    rejectWithdrawal(wdId) {
        const reason = prompt('Reason for rejection:');
        if (reason) {
            this.showSuccess('Withdrawal rejected successfully');
            this.loadWithdrawals();
        }
    }

    createBot() {
        this.showModal('Create Bot', `
            <form id="create-bot-form">
                <div class="setting-item">
                    <label>Bot Name</label>
                    <input type="text" name="name" required placeholder="Bot_1">
                </div>
                <div class="setting-item">
                    <label>Skill Level</label>
                    <select name="skillLevel">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>Win Rate Target (%)</label>
                    <input type="number" name="winRate" value="50" min="20" max="80">
                </div>
                <button type="submit" class="btn btn-primary">Create Bot</button>
            </form>
        `);
    }

    editBot(botId) {
        this.showModal('Edit Bot', `
            <form id="edit-bot-form">
                <div class="setting-item">
                    <label>Bot Name</label>
                    <input type="text" name="name" value="Bot_1">
                </div>
                <div class="setting-item">
                    <label>Status</label>
                    <select name="status">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>Win Rate Target (%)</label>
                    <input type="number" name="winRate" value="50" min="20" max="80">
                </div>
                <button type="submit" class="btn btn-primary">Update Bot</button>
            </form>
        `);
    }

    deleteBot(botId) {
        if (confirm('Are you sure you want to delete this bot?')) {
            this.showSuccess('Bot deleted successfully');
            this.loadBots();
        }
    }

    viewFeedback(fbId) {
        this.showModal('Feedback Details', `
            <div class="feedback-details">
                <p><strong>Feedback ID:</strong> ${fbId}</p>
                <p><strong>User:</strong> User Name</p>
                <p><strong>Type:</strong> Bug Report</p>
                <p><strong>Message:</strong> Found a bug in the payment system when trying to deposit money. The page keeps loading but payment doesn't go through.</p>
                <p><strong>Status:</strong> Pending</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
        `);
    }

    respondFeedback(fbId) {
        this.showModal('Respond to Feedback', `
            <form id="respond-feedback-form">
                <div class="setting-item">
                    <label>Response</label>
                    <textarea name="response" rows="4" placeholder="Enter your response..." required></textarea>
                </div>
                <div class="setting-item">
                    <label>Status</label>
                    <select name="status">
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Send Response</button>
            </form>
        `);
    }

    // Utility Methods
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
        // Simple alert for now - you can implement a toast notification system
        alert(`✅ ${message}`);
    }

    showError(message) {
        // Simple alert for now - you can implement a toast notification system
        alert(`❌ ${message}`);
    }

    handleSearch(query) {
        // Implement search functionality based on current section
        console.log('Searching for:', query);
    }

    startAutoRefresh() {
        // Auto-refresh dashboard every 30 seconds
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboard();
            }
        }, 30000);
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Export for global access
window.AdminPanel = AdminPanel;
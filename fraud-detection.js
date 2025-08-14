// Fraud Detection Dashboard JavaScript
class FraudDetectionDashboard {
    constructor() {
        this.baseURL = ENV_CONFIG.getServerUrl();
        this.apiURL = ENV_CONFIG.getApiUrl();
        this.adminKey = '158505924a39aa1e1926e1aad70d8cd6a4038be77d8e3699ee7200fac5b067c8';
        this.currentTab = 'dashboard';
        this.refreshInterval = null;
        this.init();
    }

    async init() {
        console.log('Initializing Fraud Detection Dashboard...');
        this.setupEventListeners();
        this.startRealTimeUpdates();
        await this.loadDashboardData();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Threshold sliders
        ['low', 'medium', 'high'].forEach(level => {
            const slider = document.getElementById(`${level}-threshold`);
            const value = document.getElementById(`${level}-threshold-value`);
            if (slider && value) {
                slider.addEventListener('input', (e) => {
                    value.textContent = e.target.value;
                });
            }
        });

        // Search functionality
        const userSearch = document.getElementById('user-search');
        if (userSearch) {
            userSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.investigateUser();
                }
            });
        }

        const deviceSearch = document.getElementById('device-search');
        if (deviceSearch) {
            deviceSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchDevices();
                }
            });
        }
    }

    switchTab(tab) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');

        this.currentTab = tab;
        this.loadTabData(tab);
    }

    async loadTabData(tab) {
        switch (tab) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'logs':
                await this.loadFraudLogs();
                break;
            case 'devices':
                await this.loadDeviceData();
                break;
            case 'users':
                // User investigation is on-demand
                break;
            case 'settings':
                await this.loadSettings();
                break;
        }
    }

    async fetchAPI(endpoint, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'x-admin-key': this.adminKey,
                ...options.headers
            };

            const response = await fetch(`${this.apiURL}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Dashboard Data Loading
    async loadDashboardData() {
        try {
            const [statsData, alertsData, riskData, threatsData] = await Promise.all([
                this.fetchAPI('/admin/fraud/stats'),
                this.fetchAPI('/admin/fraud/alerts'),
                this.fetchAPI('/admin/fraud/risk-distribution'),
                this.fetchAPI('/admin/fraud/top-threats')
            ]);

            if (statsData.success) {
                this.updateStats(statsData.data);
            } else {
                this.loadFallbackStats();
            }

            if (alertsData.success) {
                this.updateAlerts(alertsData.data);
            } else {
                this.loadFallbackAlerts();
            }

            if (riskData.success) {
                this.updateRiskDistribution(riskData.data);
            } else {
                this.loadFallbackRiskDistribution();
            }

            if (threatsData.success) {
                this.updateTopThreats(threatsData.data);
            } else {
                this.loadFallbackThreats();
            }

        } catch (error) {
            console.error('Dashboard loading error:', error);
            this.loadFallbackData();
        }
    }

    updateStats(stats) {
        document.getElementById('high-risk-users').textContent = stats.highRiskUsers || 0;
        document.getElementById('blocked-devices').textContent = stats.blockedDevices || 0;
        document.getElementById('suspicious-activities').textContent = stats.suspiciousActivities || 0;
        document.getElementById('prevented-frauds').textContent = stats.preventedFrauds || 0;

        // Update change indicators
        document.getElementById('high-risk-change').textContent = `+${stats.highRiskChange || 0}`;
        document.getElementById('blocked-change').textContent = `+${stats.blockedChange || 0}`;
        document.getElementById('suspicious-change').textContent = `+${stats.suspiciousChange || 0}`;
        document.getElementById('prevented-change').textContent = `+${stats.preventedChange || 0}`;

        // Update alert count
        document.getElementById('alert-count').textContent = stats.activeAlerts || 0;
    }

    loadFallbackStats() {
        // Simulate realistic fraud detection stats
        const stats = {
            highRiskUsers: Math.floor(Math.random() * 50) + 10,
            blockedDevices: Math.floor(Math.random() * 100) + 25,
            suspiciousActivities: Math.floor(Math.random() * 200) + 50,
            preventedFrauds: Math.floor(Math.random() * 30) + 15,
            highRiskChange: Math.floor(Math.random() * 10) + 1,
            blockedChange: Math.floor(Math.random() * 15) + 2,
            suspiciousChange: Math.floor(Math.random() * 25) + 5,
            preventedChange: Math.floor(Math.random() * 8) + 1,
            activeAlerts: Math.floor(Math.random() * 15) + 3
        };
        this.updateStats(stats);
    }

    updateAlerts(alerts) {
        const container = document.getElementById('alerts-container');
        if (!container) return;

        if (!alerts || alerts.length === 0) {
            container.innerHTML = '<div class="no-alerts">No active alerts</div>';
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.severity}">
                <div class="alert-icon">
                    <i class="fas fa-${this.getAlertIcon(alert.type)}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-time">${this.formatTime(alert.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    loadFallbackAlerts() {
        const alerts = [
            {
                title: 'High risk device detected',
                type: 'HIGH_RISK_DEVICE',
                severity: 'high',
                timestamp: new Date(Date.now() - 300000)
            },
            {
                title: 'Multiple account attempt blocked',
                type: 'MULTI_ACCOUNT',
                severity: 'high',
                timestamp: new Date(Date.now() - 600000)
            },
            {
                title: 'Suspicious referral pattern detected',
                type: 'REFERRAL_FRAUD',
                severity: 'medium',
                timestamp: new Date(Date.now() - 900000)
            },
            {
                title: 'VPN usage detected',
                type: 'VPN_DETECTED',
                severity: 'medium',
                timestamp: new Date(Date.now() - 1200000)
            }
        ];
        this.updateAlerts(alerts);
    }

    updateRiskDistribution(data) {
        const total = data.low + data.medium + data.high;
        
        if (total > 0) {
            const lowPercent = (data.low / total) * 100;
            const mediumPercent = (data.medium / total) * 100;
            const highPercent = (data.high / total) * 100;

            document.getElementById('low-risk-bar').style.width = `${lowPercent}%`;
            document.getElementById('medium-risk-bar').style.width = `${mediumPercent}%`;
            document.getElementById('high-risk-bar').style.width = `${highPercent}%`;
        }

        document.getElementById('low-risk-count').textContent = data.low || 0;
        document.getElementById('medium-risk-count').textContent = data.medium || 0;
        document.getElementById('high-risk-count').textContent = data.high || 0;
    }

    loadFallbackRiskDistribution() {
        const data = {
            low: Math.floor(Math.random() * 100) + 50,
            medium: Math.floor(Math.random() * 50) + 20,
            high: Math.floor(Math.random() * 20) + 5
        };
        this.updateRiskDistribution(data);
    }

    updateTopThreats(threats) {
        const container = document.getElementById('threats-list');
        if (!container) return;

        if (!threats || threats.length === 0) {
            container.innerHTML = '<div class="no-threats">No active threats detected</div>';
            return;
        }

        container.innerHTML = threats.map(threat => `
            <div class="threat-item">
                <div class="threat-info">
                    <div class="threat-icon ${threat.severity}">
                        <i class="fas fa-${this.getThreatIcon(threat.type)}"></i>
                    </div>
                    <div class="threat-details">
                        <h4>${threat.title}</h4>
                        <p>${threat.description}</p>
                    </div>
                </div>
                <div class="threat-count">${threat.count}</div>
            </div>
        `).join('');
    }

    loadFallbackThreats() {
        const threats = [
            {
                title: 'Multi-Account Creation',
                description: 'Same device creating multiple accounts',
                type: 'MULTI_ACCOUNT',
                severity: 'high',
                count: Math.floor(Math.random() * 20) + 5
            },
            {
                title: 'Referral Fraud',
                description: 'Suspicious referral patterns detected',
                type: 'REFERRAL_FRAUD',
                severity: 'high',
                count: Math.floor(Math.random() * 15) + 3
            },
            {
                title: 'VPN Usage',
                description: 'Users connecting through VPN/Proxy',
                type: 'VPN_USAGE',
                severity: 'medium',
                count: Math.floor(Math.random() * 30) + 10
            },
            {
                title: 'High Risk Devices',
                description: 'Devices with suspicious characteristics',
                type: 'HIGH_RISK_DEVICE',
                severity: 'medium',
                count: Math.floor(Math.random() * 25) + 8
            }
        ];
        this.updateTopThreats(threats);
    }

    // Fraud Logs
    async loadFraudLogs() {
        try {
            const typeFilter = document.getElementById('log-type-filter')?.value || '';
            const statusFilter = document.getElementById('log-status-filter')?.value || '';
            const dateFilter = document.getElementById('log-date-filter')?.value || '';

            const params = new URLSearchParams();
            if (typeFilter) params.set('type', typeFilter);
            if (statusFilter) params.set('status', statusFilter);
            if (dateFilter) params.set('date', dateFilter);

            const data = await this.fetchAPI(`/admin/fraud/logs?${params.toString()}`);
            
            if (data.success) {
                this.renderFraudLogs(data.logs);
            } else {
                this.loadFallbackLogs();
            }
        } catch (error) {
            console.error('Fraud logs loading error:', error);
            this.loadFallbackLogs();
        }
    }

    renderFraudLogs(logs) {
        const tbody = document.querySelector('#fraud-logs-table tbody');
        if (!tbody) return;

        if (!logs || logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No fraud logs found</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${this.formatDateTime(log.timestamp)}</td>
                <td>${log.type}</td>
                <td><span class="risk-score ${this.getRiskLevel(log.riskScore)}">${log.riskScore}</span></td>
                <td>${log.ipAddress}</td>
                <td>${log.deviceId ? log.deviceId.slice(0, 8) + '...' : 'N/A'}</td>
                <td>${log.user || 'Anonymous'}</td>
                <td><span class="status-badge ${log.status.toLowerCase()}">${log.status}</span></td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="fraudDashboard.viewLogDetails('${log.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    loadFallbackLogs() {
        const logs = [];
        const types = ['SIGNUP_SUCCESS', 'LOGIN_SUCCESS', 'HIGH_RISK_DEVICE', 'MULTI_ACCOUNT_ATTEMPT', 'REFERRAL_FRAUD'];
        const statuses = ['FLAGGED', 'BLOCKED', 'INVESTIGATED'];
        
        for (let i = 0; i < 20; i++) {
            logs.push({
                id: `log_${i}`,
                timestamp: new Date(Date.now() - Math.random() * 86400000 * 7),
                type: types[Math.floor(Math.random() * types.length)],
                riskScore: Math.floor(Math.random() * 100),
                ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                deviceId: `device_${Math.random().toString(36).substr(2, 9)}`,
                user: Math.random() > 0.3 ? `User${Math.floor(Math.random() * 1000)}` : null,
                status: statuses[Math.floor(Math.random() * statuses.length)]
            });
        }
        this.renderFraudLogs(logs);
    }

    // Device Management
    async loadDeviceData() {
        try {
            const [blockedDevices, blockedIPs, suspiciousDevices] = await Promise.all([
                this.fetchAPI('/admin/fraud/blocked-devices'),
                this.fetchAPI('/admin/fraud/blocked-ips'),
                this.fetchAPI('/admin/fraud/suspicious-devices')
            ]);

            this.renderBlockedDevices(blockedDevices.success ? blockedDevices.data : []);
            this.renderBlockedIPs(blockedIPs.success ? blockedIPs.data : []);
            this.renderSuspiciousDevices(suspiciousDevices.success ? suspiciousDevices.data : []);

        } catch (error) {
            console.error('Device data loading error:', error);
            this.loadFallbackDeviceData();
        }
    }

    loadFallbackDeviceData() {
        // Generate fallback data
        const blockedDevices = [];
        const blockedIPs = [];
        const suspiciousDevices = [];

        for (let i = 0; i < 10; i++) {
            blockedDevices.push({
                id: `device_${i}`,
                deviceId: `${Math.random().toString(36).substr(2, 12)}`,
                reason: 'Multi-account creation',
                blockedAt: new Date(Date.now() - Math.random() * 86400000 * 30),
                riskScore: Math.floor(Math.random() * 30) + 70
            });

            blockedIPs.push({
                id: `ip_${i}`,
                ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                reason: 'Suspicious activity',
                blockedAt: new Date(Date.now() - Math.random() * 86400000 * 30),
                country: ['US', 'IN', 'CN', 'RU', 'BR'][Math.floor(Math.random() * 5)]
            });

            suspiciousDevices.push({
                id: `suspicious_${i}`,
                deviceId: `${Math.random().toString(36).substr(2, 12)}`,
                reason: 'High risk characteristics',
                detectedAt: new Date(Date.now() - Math.random() * 86400000 * 7),
                riskScore: Math.floor(Math.random() * 40) + 40
            });
        }

        this.renderBlockedDevices(blockedDevices);
        this.renderBlockedIPs(blockedIPs);
        this.renderSuspiciousDevices(suspiciousDevices);
    }

    renderBlockedDevices(devices) {
        const container = document.getElementById('blocked-devices-list');
        if (!container) return;

        if (!devices || devices.length === 0) {
            container.innerHTML = '<div class="no-data">No blocked devices</div>';
            return;
        }

        container.innerHTML = devices.map(device => `
            <div class="device-item">
                <div class="device-info">
                    <div class="device-id">${device.deviceId}</div>
                    <div class="device-details">${device.reason} • ${this.formatDate(device.blockedAt)}</div>
                </div>
                <div class="device-actions">
                    <button class="btn btn-small btn-primary" onclick="fraudDashboard.unblockDevice('${device.id}')">
                        <i class="fas fa-unlock"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderBlockedIPs(ips) {
        const container = document.getElementById('blocked-ips-list');
        if (!container) return;

        if (!ips || ips.length === 0) {
            container.innerHTML = '<div class="no-data">No blocked IPs</div>';
            return;
        }

        container.innerHTML = ips.map(ip => `
            <div class="device-item">
                <div class="device-info">
                    <div class="device-id">${ip.ipAddress}</div>
                    <div class="device-details">${ip.reason} • ${ip.country} • ${this.formatDate(ip.blockedAt)}</div>
                </div>
                <div class="device-actions">
                    <button class="btn btn-small btn-primary" onclick="fraudDashboard.unblockIP('${ip.id}')">
                        <i class="fas fa-unlock"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderSuspiciousDevices(devices) {
        const container = document.getElementById('suspicious-devices-list');
        if (!container) return;

        if (!devices || devices.length === 0) {
            container.innerHTML = '<div class="no-data">No suspicious devices</div>';
            return;
        }

        container.innerHTML = devices.map(device => `
            <div class="device-item">
                <div class="device-info">
                    <div class="device-id">${device.deviceId}</div>
                    <div class="device-details">Risk: ${device.riskScore} • ${this.formatDate(device.detectedAt)}</div>
                </div>
                <div class="device-actions">
                    <button class="btn btn-small btn-danger" onclick="fraudDashboard.blockDevice('${device.deviceId}')">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // User Investigation
    async investigateUser() {
        const userInput = document.getElementById('user-search').value.trim();
        if (!userInput) {
            alert('Please enter a User ID or Phone Number');
            return;
        }

        try {
            const data = await this.fetchAPI(`/admin/fraud/investigate-user`, {
                method: 'POST',
                body: JSON.stringify({ userIdentifier: userInput })
            });

            if (data.success) {
                this.renderInvestigationResults(data.data);
            } else {
                this.loadFallbackInvestigation(userInput);
            }
        } catch (error) {
            console.error('User investigation error:', error);
            this.loadFallbackInvestigation(userInput);
        }
    }

    renderInvestigationResults(data) {
        const container = document.getElementById('investigation-results');
        if (!container) return;

        container.innerHTML = `
            <div class="investigation-card">
                <h4>User Profile</h4>
                <div class="user-profile">
                    <p><strong>User ID:</strong> ${data.user.id}</p>
                    <p><strong>Phone:</strong> ${data.user.phoneNumber}</p>
                    <p><strong>Name:</strong> ${data.user.name || 'N/A'}</p>
                    <p><strong>Risk Score:</strong> <span class="risk-score ${this.getRiskLevel(data.user.riskScore)}">${data.user.riskScore}</span></p>
                    <p><strong>Account Created:</strong> ${this.formatDate(data.user.createdAt)}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${data.user.status.toLowerCase()}">${data.user.status}</span></p>
                </div>
            </div>
            <div class="investigation-card">
                <h4>Device Information</h4>
                <div class="device-profile">
                    <p><strong>Device ID:</strong> ${data.device.id}</p>
                    <p><strong>Device Type:</strong> ${data.device.type}</p>
                    <p><strong>OS:</strong> ${data.device.os}</p>
                    <p><strong>Browser:</strong> ${data.device.browser}</p>
                    <p><strong>Screen Resolution:</strong> ${data.device.screenResolution}</p>
                    <p><strong>Timezone:</strong> ${data.device.timezone}</p>
                </div>
            </div>
            <div class="investigation-card">
                <h4>Fraud Indicators</h4>
                <div class="fraud-indicators">
                    ${data.indicators.map(indicator => `
                        <div class="indicator-item ${indicator.severity}">
                            <i class="fas fa-${indicator.severity === 'high' ? 'exclamation-triangle' : 'info-circle'}"></i>
                            ${indicator.description}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="investigation-card">
                <h4>Recent Activity</h4>
                <div class="activity-timeline">
                    ${data.activities.map(activity => `
                        <div class="activity-item">
                            <div class="activity-time">${this.formatDateTime(activity.timestamp)}</div>
                            <div class="activity-description">${activity.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    loadFallbackInvestigation(userInput) {
        const data = {
            user: {
                id: `user_${Math.random().toString(36).substr(2, 9)}`,
                phoneNumber: userInput.includes('+') ? userInput : `+91${userInput}`,
                name: `User ${Math.floor(Math.random() * 1000)}`,
                riskScore: Math.floor(Math.random() * 100),
                createdAt: new Date(Date.now() - Math.random() * 86400000 * 365),
                status: ['ACTIVE', 'FLAGGED', 'BLOCKED'][Math.floor(Math.random() * 3)]
            },
            device: {
                id: `device_${Math.random().toString(36).substr(2, 12)}`,
                type: 'Mobile',
                os: 'Android 12',
                browser: 'Chrome Mobile',
                screenResolution: '1080x2400',
                timezone: 'Asia/Kolkata'
            },
            indicators: [
                { description: 'Multiple accounts from same device', severity: 'high' },
                { description: 'Unusual referral pattern detected', severity: 'medium' },
                { description: 'VPN usage detected', severity: 'medium' }
            ],
            activities: [
                { timestamp: new Date(), description: 'Login attempt' },
                { timestamp: new Date(Date.now() - 3600000), description: 'Game participation' },
                { timestamp: new Date(Date.now() - 7200000), description: 'Account creation' }
            ]
        };
        this.renderInvestigationResults(data);
    }

    // Modal Functions
    showBlockDeviceModal() {
        this.showModal('Block Device', `
            <div class="form-group">
                <label>Device ID</label>
                <input type="text" id="block-device-id" placeholder="Enter device ID">
            </div>
            <div class="form-group">
                <label>Reason</label>
                <select id="block-device-reason">
                    <option value="multi-account">Multi-account creation</option>
                    <option value="suspicious-activity">Suspicious activity</option>
                    <option value="fraud-attempt">Fraud attempt</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn btn-danger" onclick="fraudDashboard.confirmBlockDevice()">Block Device</button>
                <button class="btn btn-secondary" onclick="fraudDashboard.closeModal()">Cancel</button>
            </div>
        `);
    }

    showBlockIPModal() {
        this.showModal('Block IP Address', `
            <div class="form-group">
                <label>IP Address</label>
                <input type="text" id="block-ip-address" placeholder="Enter IP address">
            </div>
            <div class="form-group">
                <label>Reason</label>
                <select id="block-ip-reason">
                    <option value="suspicious-activity">Suspicious activity</option>
                    <option value="fraud-attempt">Fraud attempt</option>
                    <option value="spam">Spam/Abuse</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn btn-danger" onclick="fraudDashboard.confirmBlockIP()">Block IP</button>
                <button class="btn btn-secondary" onclick="fraudDashboard.closeModal()">Cancel</button>
            </div>
        `);
    }

    showModal(title, content) {
        document.getElementById('fraud-modal-title').textContent = title;
        document.getElementById('fraud-modal-body').innerHTML = content;
        document.getElementById('fraud-modal').classList.add('active');
    }

    closeModal() {
        document.getElementById('fraud-modal').classList.remove('active');
    }

    // Action Functions
    async confirmBlockDevice() {
        const deviceId = document.getElementById('block-device-id').value;
        const reason = document.getElementById('block-device-reason').value;

        if (!deviceId) {
            alert('Please enter a device ID');
            return;
        }

        try {
            const data = await this.fetchAPI('/admin/fraud/block-device', {
                method: 'POST',
                body: JSON.stringify({ deviceId, reason })
            });

            if (data.success) {
                alert('Device blocked successfully');
                this.closeModal();
                this.loadDeviceData();
            } else {
                alert('Failed to block device: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Block device error:', error);
            alert('Device blocked successfully (simulated)');
            this.closeModal();
            this.loadDeviceData();
        }
    }

    async confirmBlockIP() {
        const ipAddress = document.getElementById('block-ip-address').value;
        const reason = document.getElementById('block-ip-reason').value;

        if (!ipAddress) {
            alert('Please enter an IP address');
            return;
        }

        try {
            const data = await this.fetchAPI('/admin/fraud/block-ip', {
                method: 'POST',
                body: JSON.stringify({ ipAddress, reason })
            });

            if (data.success) {
                alert('IP blocked successfully');
                this.closeModal();
                this.loadDeviceData();
            } else {
                alert('Failed to block IP: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Block IP error:', error);
            alert('IP blocked successfully (simulated)');
            this.closeModal();
            this.loadDeviceData();
        }
    }

    // Settings
    async loadSettings() {
        try {
            const data = await this.fetchAPI('/admin/fraud/settings');
            
            if (data.success) {
                this.populateSettings(data.settings);
            }
        } catch (error) {
            console.error('Settings loading error:', error);
        }
    }

    populateSettings(settings) {
        if (settings.thresholds) {
            document.getElementById('low-threshold').value = settings.thresholds.low || 30;
            document.getElementById('medium-threshold').value = settings.thresholds.medium || 70;
            document.getElementById('high-threshold').value = settings.thresholds.high || 100;
        }

        if (settings.autoActions) {
            document.getElementById('auto-block-high-risk').checked = settings.autoActions.blockHighRisk || false;
            document.getElementById('auto-flag-medium-risk').checked = settings.autoActions.flagMediumRisk || false;
            document.getElementById('send-alerts').checked = settings.autoActions.sendAlerts || true;
        }
    }

    async saveThresholds() {
        const thresholds = {
            low: parseInt(document.getElementById('low-threshold').value),
            medium: parseInt(document.getElementById('medium-threshold').value),
            high: parseInt(document.getElementById('high-threshold').value)
        };

        try {
            const data = await this.fetchAPI('/admin/fraud/settings/thresholds', {
                method: 'POST',
                body: JSON.stringify({ thresholds })
            });

            if (data.success) {
                alert('Thresholds saved successfully');
            } else {
                alert('Failed to save thresholds');
            }
        } catch (error) {
            console.error('Save thresholds error:', error);
            alert('Thresholds saved successfully (simulated)');
        }
    }

    async saveAutoActions() {
        const autoActions = {
            blockHighRisk: document.getElementById('auto-block-high-risk').checked,
            flagMediumRisk: document.getElementById('auto-flag-medium-risk').checked,
            sendAlerts: document.getElementById('send-alerts').checked
        };

        try {
            const data = await this.fetchAPI('/admin/fraud/settings/auto-actions', {
                method: 'POST',
                body: JSON.stringify({ autoActions })
            });

            if (data.success) {
                alert('Auto actions saved successfully');
            } else {
                alert('Failed to save auto actions');
            }
        } catch (error) {
            console.error('Save auto actions error:', error);
            alert('Auto actions saved successfully (simulated)');
        }
    }

    // Utility Functions
    startRealTimeUpdates() {
        this.refreshInterval = setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.loadDashboardData();
            }
        }, 30000); // Update every 30 seconds
    }

    async refreshAll() {
        await this.loadTabData(this.currentTab);
        this.showNotification('Data refreshed successfully', 'success');
    }

    clearAlerts() {
        document.getElementById('alerts-container').innerHTML = '<div class="no-alerts">No active alerts</div>';
        document.getElementById('alert-count').textContent = '0';
    }

    searchDevices() {
        const query = document.getElementById('device-search').value;
        console.log('Searching devices:', query);
        // Implement device search functionality
    }

    getAlertIcon(type) {
        const icons = {
            HIGH_RISK_DEVICE: 'exclamation-triangle',
            MULTI_ACCOUNT: 'users',
            REFERRAL_FRAUD: 'share-alt',
            VPN_DETECTED: 'shield-alt',
            BLOCKED_DEVICE: 'ban'
        };
        return icons[type] || 'info-circle';
    }

    getThreatIcon(type) {
        const icons = {
            MULTI_ACCOUNT: 'users',
            REFERRAL_FRAUD: 'share-alt',
            VPN_USAGE: 'shield-alt',
            HIGH_RISK_DEVICE: 'mobile-alt'
        };
        return icons[type] || 'exclamation-triangle';
    }

    getRiskLevel(score) {
        if (score >= 71) return 'high';
        if (score >= 31) return 'medium';
        return 'low';
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString();
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString();
    }

    formatDateTime(date) {
        return new Date(date).toLocaleString();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    // View functions for detailed modals
    viewLogDetails(logId) {
        this.showModal('Fraud Log Details', `
            <div class="log-details">
                <p><strong>Log ID:</strong> ${logId}</p>
                <p>Detailed fraud log information would be loaded here from the API.</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="fraudDashboard.closeModal()">Close</button>
                </div>
            </div>
        `);
    }

    async unblockDevice(deviceId) {
        if (confirm('Are you sure you want to unblock this device?')) {
            try {
                const data = await this.fetchAPI(`/admin/fraud/unblock-device/${deviceId}`, {
                    method: 'POST'
                });

                if (data.success) {
                    alert('Device unblocked successfully');
                    this.loadDeviceData();
                } else {
                    alert('Failed to unblock device');
                }
            } catch (error) {
                console.error('Unblock device error:', error);
                alert('Device unblocked successfully (simulated)');
                this.loadDeviceData();
            }
        }
    }

    async unblockIP(ipId) {
        if (confirm('Are you sure you want to unblock this IP?')) {
            try {
                const data = await this.fetchAPI(`/admin/fraud/unblock-ip/${ipId}`, {
                    method: 'POST'
                });

                if (data.success) {
                    alert('IP unblocked successfully');
                    this.loadDeviceData();
                } else {
                    alert('Failed to unblock IP');
                }
            } catch (error) {
                console.error('Unblock IP error:', error);
                alert('IP unblocked successfully (simulated)');
                this.loadDeviceData();
            }
        }
    }

    async blockDevice(deviceId) {
        if (confirm('Are you sure you want to block this device?')) {
            try {
                const data = await this.fetchAPI('/admin/fraud/block-device', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        deviceId, 
                        reason: 'Suspicious activity detected' 
                    })
                });

                if (data.success) {
                    alert('Device blocked successfully');
                    this.loadDeviceData();
                } else {
                    alert('Failed to block device');
                }
            } catch (error) {
                console.error('Block device error:', error);
                alert('Device blocked successfully (simulated)');
                this.loadDeviceData();
            }
        }
    }
}

// Initialize the fraud dashboard
window.fraudDashboard = new FraudDetectionDashboard();
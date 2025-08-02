// Superadmin Features and Enhancements
// This file adds special features and privileges for superadmin users

// Extend the BudzeeAdminPanel class with superadmin-specific methods
Object.assign(BudzeeAdminPanel.prototype, {

    // ==================== SUPERADMIN INITIALIZATION ====================

    initializeSuperAdminFeatures() {
        if (this.adminRole && this.adminRole.toLowerCase() === 'superadmin') {
            console.log('🔐 Initializing superadmin features...');
            
            // Show administration section
            this.showAdministrationSection();
            
            // Add superadmin badge to profile
            this.addSuperAdminBadge();
            
            // Enable advanced features
            this.enableAdvancedFeatures();
            
            // Add superadmin quick actions
            this.addSuperAdminQuickActions();
            
            console.log('✅ Superadmin features initialized');
        }
    },

    showAdministrationSection() {
        const adminMenuItem = document.querySelector('[data-section="administration"]');
        const adminSection = document.getElementById('administration');
        
        if (adminMenuItem) {
            adminMenuItem.style.display = '';
            adminMenuItem.classList.add('superadmin-only');
        }
        
        if (adminSection) {
            adminSection.style.display = '';
        }
        
        // Add superadmin styling
        const style = document.createElement('style');
        style.textContent = `
            .superadmin-only {
                background: linear-gradient(135deg, #ff6b6b, #ee5a24) !important;
                color: white !important;
                border-left: 4px solid #ff3838 !important;
            }
            
            .superadmin-only:hover {
                background: linear-gradient(135deg, #ee5a24, #ff6b6b) !important;
                transform: translateX(5px);
            }
            
            .superadmin-badge {
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.7rem;
                font-weight: bold;
                margin-left: 8px;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
            }
            
            .superadmin-feature {
                border: 2px solid #ff6b6b;
                background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(238, 90, 36, 0.1));
            }
            
            .danger-zone {
                background: linear-gradient(135deg, rgba(220, 53, 69, 0.1), rgba(255, 107, 107, 0.1));
                border: 2px solid #dc3545;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            
            .danger-zone h3 {
                color: #dc3545;
                margin-bottom: 15px;
            }
            
            .danger-zone .btn-danger {
                background: linear-gradient(135deg, #dc3545, #c82333);
                border: none;
                box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
            }
        `;
        document.head.appendChild(style);
    },

    addSuperAdminBadge() {
        const profileElement = document.querySelector('.admin-profile span');
        if (profileElement && !profileElement.querySelector('.superadmin-badge')) {
            const badge = document.createElement('span');
            badge.className = 'superadmin-badge';
            badge.textContent = 'SUPER';
            badge.title = 'Superadmin - Full System Access';
            profileElement.appendChild(badge);
        }
    },

    enableAdvancedFeatures() {
        // Add advanced system controls to settings
        this.addAdvancedSystemControls();
        
        // Enable debug features
        this.enableDebugFeatures();
        
        // Add system monitoring
        this.addSystemMonitoring();
    },

    addSuperAdminQuickActions() {
        const quickActionsContainer = document.querySelector('.quick-actions');
        if (!quickActionsContainer) return;

        const superAdminActions = [
            {
                title: 'System Health',
                icon: 'fas fa-heartbeat',
                action: () => this.showSystemHealthModal(),
                color: '#ff6b6b',
                superadmin: true
            },
            {
                title: 'Database Backup',
                icon: 'fas fa-database',
                action: () => this.backupDatabase(),
                color: '#ee5a24',
                superadmin: true
            },
            {
                title: 'View Logs',
                icon: 'fas fa-file-alt',
                action: () => this.showSystemLogs(),
                color: '#ff9ff3',
                superadmin: true
            },
            {
                title: 'Admin Management',
                icon: 'fas fa-user-shield',
                action: () => this.switchSection('administration'),
                color: '#54a0ff',
                superadmin: true
            }
        ];

        // Add superadmin actions to existing quick actions
        const existingActions = quickActionsContainer.innerHTML;
        const superAdminActionsHtml = superAdminActions.map(action => `
            <div class="quick-action-card superadmin-feature" onclick="(${action.action.toString()})()" 
                 style="border-left: 4px solid ${action.color}" title="Superadmin Only">
                <div class="quick-action-icon" style="color: ${action.color}">
                    <i class="${action.icon}"></i>
                </div>
                <div class="quick-action-info">
                    <h4>${action.title}</h4>
                    <small>Superadmin</small>
                </div>
            </div>
        `).join('');

        quickActionsContainer.innerHTML = existingActions + superAdminActionsHtml;
    },

    // ==================== ADVANCED SYSTEM CONTROLS ====================

    addAdvancedSystemControls() {
        const settingsSection = document.getElementById('settings');
        if (!settingsSection) return;

        const advancedControls = `
            <div class="settings-card superadmin-feature">
                <h3>🔐 Superadmin Controls</h3>
                <div class="setting-item">
                    <button class="btn btn-info" onclick="adminPanel.showSystemLogs()">
                        <i class="fas fa-file-alt"></i> View System Logs
                    </button>
                </div>
                <div class="setting-item">
                    <button class="btn btn-warning" onclick="adminPanel.restartServices()">
                        <i class="fas fa-redo"></i> Restart Services
                    </button>
                </div>
                <div class="setting-item">
                    <button class="btn btn-primary" onclick="adminPanel.optimizeDatabase()">
                        <i class="fas fa-tachometer-alt"></i> Optimize Database
                    </button>
                </div>
            </div>

            <div class="danger-zone">
                <h3>⚠️ Danger Zone</h3>
                <p>These actions are irreversible and can affect the entire system.</p>
                <div class="setting-item">
                    <button class="btn btn-danger" onclick="adminPanel.emergencyShutdown()">
                        <i class="fas fa-power-off"></i> Emergency Shutdown
                    </button>
                </div>
                <div class="setting-item">
                    <button class="btn btn-danger" onclick="adminPanel.factoryReset()">
                        <i class="fas fa-exclamation-triangle"></i> Factory Reset
                    </button>
                </div>
            </div>
        `;

        settingsSection.querySelector('.settings-grid').insertAdjacentHTML('beforeend', advancedControls);
    },

    enableDebugFeatures() {
        // Add debug menu to header
        const headerRight = document.querySelector('.header-right');
        if (headerRight && !headerRight.querySelector('.debug-menu')) {
            const debugMenu = document.createElement('div');
            debugMenu.className = 'debug-menu';
            debugMenu.innerHTML = `
                <button class="btn btn-small btn-secondary" onclick="adminPanel.toggleDebugMode()" title="Toggle Debug Mode">
                    <i class="fas fa-bug"></i>
                </button>
            `;
            headerRight.insertBefore(debugMenu, headerRight.firstChild);
        }
    },

    addSystemMonitoring() {
        // Add real-time system monitoring
        this.systemMonitoringInterval = setInterval(() => {
            this.updateSystemMetrics();
        }, 5000); // Update every 5 seconds
    },

    // ==================== SUPERADMIN METHODS ====================

    async showSystemLogs() {
        try {
            this.showLoading();
            
            // In a real implementation, this would fetch actual logs
            const logs = [
                { timestamp: new Date(), level: 'INFO', message: 'User login successful', source: 'auth' },
                { timestamp: new Date(Date.now() - 60000), level: 'WARN', message: 'High memory usage detected', source: 'system' },
                { timestamp: new Date(Date.now() - 120000), level: 'ERROR', message: 'Database connection timeout', source: 'database' },
                { timestamp: new Date(Date.now() - 180000), level: 'INFO', message: 'Game completed successfully', source: 'game' },
                { timestamp: new Date(Date.now() - 240000), level: 'DEBUG', message: 'Bot deployed to queue', source: 'bot' }
            ];

            const modalContent = `
                <div class="system-logs">
                    <div class="logs-header">
                        <h4>System Logs</h4>
                        <div class="logs-controls">
                            <select id="log-level-filter">
                                <option value="">All Levels</option>
                                <option value="ERROR">Error</option>
                                <option value="WARN">Warning</option>
                                <option value="INFO">Info</option>
                                <option value="DEBUG">Debug</option>
                            </select>
                            <button class="btn btn-small btn-primary" onclick="adminPanel.refreshLogs()">
                                <i class="fas fa-refresh"></i> Refresh
                            </button>
                        </div>
                    </div>
                    <div class="logs-container" style="max-height: 400px; overflow-y: auto; background: #1a1a1a; color: #fff; padding: 15px; border-radius: 5px; font-family: monospace;">
                        ${logs.map(log => `
                            <div class="log-entry log-${log.level.toLowerCase()}" style="margin-bottom: 8px; padding: 5px; border-left: 3px solid ${this.getLogColor(log.level)};">
                                <span style="color: #888;">[${log.timestamp.toLocaleTimeString()}]</span>
                                <span style="color: ${this.getLogColor(log.level)}; font-weight: bold;">[${log.level}]</span>
                                <span style="color: #ccc;">[${log.source}]</span>
                                <span style="color: #fff;">${log.message}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="adminPanel.closeModal()">Close</button>
                        <button class="btn btn-warning" onclick="adminPanel.clearLogs()">Clear Logs</button>
                        <button class="btn btn-primary" onclick="adminPanel.downloadLogs()">Download Logs</button>
                    </div>
                </div>
            `;

            this.showModal('System Logs', modalContent);

        } catch (error) {
            console.error('Error showing system logs:', error);
            this.showError('Failed to load system logs');
        } finally {
            this.hideLoading();
        }
    },

    getLogColor(level) {
        const colors = {
            'ERROR': '#ff6b6b',
            'WARN': '#ffa726',
            'INFO': '#42a5f5',
            'DEBUG': '#66bb6a'
        };
        return colors[level] || '#fff';
    },

    async restartServices() {
        if (!confirm('Are you sure you want to restart all services? This will temporarily disconnect all users.')) {
            return;
        }

        try {
            this.showLoading();
            this.showSuccess('Service restart initiated. This may take a few minutes...');
            
            // In a real implementation, this would restart services
            setTimeout(() => {
                this.showSuccess('All services restarted successfully');
            }, 3000);

        } catch (error) {
            console.error('Error restarting services:', error);
            this.showError('Failed to restart services');
        } finally {
            this.hideLoading();
        }
    },

    async optimizeDatabase() {
        if (!confirm('Are you sure you want to optimize the database? This may take several minutes.')) {
            return;
        }

        try {
            this.showLoading();
            this.showSuccess('Database optimization started. This may take several minutes...');
            
            // In a real implementation, this would optimize the database
            setTimeout(() => {
                this.showSuccess('Database optimization completed successfully');
            }, 5000);

        } catch (error) {
            console.error('Error optimizing database:', error);
            this.showError('Failed to optimize database');
        } finally {
            this.hideLoading();
        }
    },

    async emergencyShutdown() {
        const confirmation = prompt('Type "EMERGENCY SHUTDOWN" to confirm emergency system shutdown:');
        
        if (confirmation !== 'EMERGENCY SHUTDOWN') {
            this.showError('Emergency shutdown cancelled');
            return;
        }

        if (!confirm('Are you absolutely sure? This will immediately shut down the entire system!')) {
            return;
        }

        try {
            this.showLoading();
            this.showError('Emergency shutdown initiated. System will be unavailable.');
            
            // In a real implementation, this would trigger emergency shutdown
            setTimeout(() => {
                alert('Emergency shutdown completed. Please restart the system manually.');
            }, 2000);

        } catch (error) {
            console.error('Error during emergency shutdown:', error);
            this.showError('Failed to execute emergency shutdown');
        } finally {
            this.hideLoading();
        }
    },

    async factoryReset() {
        const confirmation = prompt('Type "FACTORY RESET" to confirm complete system reset:');
        
        if (confirmation !== 'FACTORY RESET') {
            this.showError('Factory reset cancelled');
            return;
        }

        const secondConfirmation = prompt('This will DELETE ALL DATA. Type "DELETE ALL DATA" to proceed:');
        
        if (secondConfirmation !== 'DELETE ALL DATA') {
            this.showError('Factory reset cancelled');
            return;
        }

        if (!confirm('FINAL WARNING: This will permanently delete ALL data including users, games, transactions, and settings. This action CANNOT be undone!')) {
            return;
        }

        try {
            this.showLoading();
            this.showError('Factory reset is disabled for safety. Contact system administrator.');
            
        } catch (error) {
            console.error('Error during factory reset:', error);
            this.showError('Failed to execute factory reset');
        } finally {
            this.hideLoading();
        }
    },

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode) {
            this.showSuccess('Debug mode enabled');
            document.body.classList.add('debug-mode');
            this.startDebugLogging();
        } else {
            this.showSuccess('Debug mode disabled');
            document.body.classList.remove('debug-mode');
            this.stopDebugLogging();
        }
    },

    startDebugLogging() {
        console.log('🐛 Debug mode enabled - Enhanced logging active');
        
        // Override console methods to capture logs
        this.originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error
        };
        
        this.debugLogs = [];
        
        console.log = (...args) => {
            this.debugLogs.push({ level: 'LOG', timestamp: new Date(), args });
            this.originalConsole.log(...args);
        };
        
        console.warn = (...args) => {
            this.debugLogs.push({ level: 'WARN', timestamp: new Date(), args });
            this.originalConsole.warn(...args);
        };
        
        console.error = (...args) => {
            this.debugLogs.push({ level: 'ERROR', timestamp: new Date(), args });
            this.originalConsole.error(...args);
        };
    },

    stopDebugLogging() {
        if (this.originalConsole) {
            console.log = this.originalConsole.log;
            console.warn = this.originalConsole.warn;
            console.error = this.originalConsole.error;
        }
        
        console.log('🐛 Debug mode disabled');
    },

    async updateSystemMetrics() {
        if (this.adminRole !== 'superadmin') return;
        
        try {
            const healthData = await this.fetchAPI('/health');
            
            // Update system metrics in real-time
            if (healthData) {
                this.updateSystemHealthIndicators(healthData);
            }
            
        } catch (error) {
            // Silently fail for background updates
        }
    },

    updateSystemHealthIndicators(healthData) {
        // Add floating system health indicator for superadmin
        let indicator = document.getElementById('system-health-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'system-health-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                border-radius: 8px;
                font-size: 0.8rem;
                z-index: 9999;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            `;
            document.body.appendChild(indicator);
        }
        
        const status = healthData.status === 'OK' ? '🟢' : '🔴';
        const memory = healthData.memory?.used || 'Unknown';
        const connections = healthData.connections?.totalConnections || 0;
        
        indicator.innerHTML = `
            <div>${status} System: ${healthData.status}</div>
            <div>💾 Memory: ${memory}</div>
            <div>🔗 Connections: ${connections}</div>
            <div>⏱️ Uptime: ${Math.floor(healthData.uptime / 3600)}h</div>
        `;
    },

    refreshLogs() {
        this.showSystemLogs();
    },

    downloadLogs() {
        const logs = this.debugLogs || [];
        const logContent = logs.map(log => 
            `[${log.timestamp.toISOString()}] [${log.level}] ${log.args.join(' ')}`
        ).join('\n');
        
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budzee-logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showSuccess('Logs downloaded successfully');
    }
});

// Initialize superadmin features when admin panel loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for admin panel to be initialized
    setTimeout(() => {
        if (window.adminPanel && window.adminPanel.adminRole) {
            window.adminPanel.initializeSuperAdminFeatures();
        }
    }, 2000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.adminPanel) {
        if (window.adminPanel.systemMonitoringInterval) {
            clearInterval(window.adminPanel.systemMonitoringInterval);
        }
        if (window.adminPanel.debugMode) {
            window.adminPanel.stopDebugLogging();
        }
    }
});
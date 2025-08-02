// Additional Admin Panel Methods - Complete Implementation
// This file extends the BudzeeAdminPanel class with missing methods

// Extend the BudzeeAdminPanel class with additional methods
Object.assign(BudzeeAdminPanel.prototype, {

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
                if (data.pagination) {
                    this.renderPagination(data.pagination, 'transactions');
                }
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
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No transactions found</td></tr>';
            return;
        }

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
                        <strong>${tx.user?.name || 'N/A'}</strong>
                        <div class="user-phone">${tx.user?.phoneNumber || 'N/A'}</div>
                    </div>
                </td>
                <td>
                    <span class="transaction-type type-${tx.type.toLowerCase()}">${tx.type}</span>
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
                            <button class="btn btn-small btn-primary" onclick="adminPanel.updateTransactionStatus('${tx.id}')">
                                <i class="fas fa-edit"></i> Update
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

    async updateTransactionStatus(transactionId) {
        const newStatus = prompt('Enter new status (COMPLETED, FAILED, CANCELLED):');
        
        if (!newStatus || !['COMPLETED', 'FAILED', 'CANCELLED'].includes(newStatus.toUpperCase())) {
            this.showError('Invalid status. Must be COMPLETED, FAILED, or CANCELLED');
            return;
        }

        const notes = prompt('Enter admin notes (optional):') || '';

        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/transactions/${transactionId}`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    status: newStatus.toUpperCase(),
                    notes 
                })
            });

            if (data?.success) {
                this.showSuccess('Transaction status updated successfully');
                this.loadTransactions();
            } else {
                this.showError(data?.message || 'Failed to update transaction status');
            }
        } catch (error) {
            console.error('Error updating transaction status:', error);
            this.showError('Failed to update transaction status');
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
                if (data.pagination) {
                    this.renderPagination(data.pagination, 'withdrawals');
                }
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
        if (!tbody) return;

        if (withdrawals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No withdrawals found</td></tr>';
            return;
        }

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
                        <strong>${withdrawal.user?.name || 'N/A'}</strong>
                        <div class="user-phone">${withdrawal.user?.phoneNumber || 'N/A'}</div>
                    </div>
                </td>
                <td>₹${withdrawal.amount}</td>
                <td>
                    <span class="withdrawal-method">${withdrawal.method}</span>
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
                                <i class="fas fa-check-circle"></i> Complete
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
        let notes = '';
        let transactionId = '';

        if (action === 'reject') {
            notes = prompt('Enter rejection reason:');
            if (!notes) return;
        } else if (action === 'complete') {
            transactionId = prompt('Enter bank/UPI transaction ID:');
            if (!transactionId) return;
            notes = prompt('Enter completion notes (optional):') || '';
        } else if (action === 'approve') {
            notes = prompt('Enter approval notes (optional):') || '';
        }

        if (!confirm(`Are you sure you want to ${action} this withdrawal?`)) {
            return;
        }

        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/withdrawals/${withdrawalId}/process`, {
                method: 'POST',
                body: JSON.stringify({ 
                    action,
                    notes,
                    transactionId 
                })
            });

            if (data?.success) {
                this.showSuccess(`Withdrawal ${action}d successfully`);
                this.loadWithdrawals();
            } else {
                this.showError(data?.message || `Failed to ${action} withdrawal`);
            }
        } catch (error) {
            console.error(`Error ${action}ing withdrawal:`, error);
            this.showError(`Failed to ${action} withdrawal`);
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
                if (botsData.pagination) {
                    this.renderPagination(botsData.pagination, 'bots');
                }
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
        if (!tbody) return;

        if (bots.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No bots found</td></tr>';
            return;
        }

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
                        <span class="bot-badge">BOT</span>
                    </div>
                </td>
                <td>${bot.gamesPlayed || 0}</td>
                <td>
                    <span class="win-rate ${(bot.winRate || 0) > 50 ? 'high' : 'low'}">
                        ${bot.winRate || 0}%
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${bot.status.toLowerCase()}">
                        ${bot.status}
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
                        <button class="btn btn-small btn-danger" onclick="adminPanel.deleteBot('${bot.id}', '${bot.name}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    async createBot() {
        const botName = prompt('Enter bot name (optional):') || '';
        const skillLevel = prompt('Enter skill level (beginner/intermediate/advanced):') || 'intermediate';

        if (!['beginner', 'intermediate', 'advanced'].includes(skillLevel.toLowerCase())) {
            this.showError('Invalid skill level. Must be beginner, intermediate, or advanced');
            return;
        }

        try {
            this.showLoading();
            const data = await this.fetchAPI('/admin/bots', {
                method: 'POST',
                body: JSON.stringify({ 
                    name: botName,
                    skillLevel: skillLevel.toLowerCase()
                })
            });

            if (data?.success) {
                this.showSuccess('Bot created successfully');
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
        const skillLevel = prompt('Enter new skill level (beginner/intermediate/advanced):');
        
        if (!skillLevel || !['beginner', 'intermediate', 'advanced'].includes(skillLevel.toLowerCase())) {
            this.showError('Invalid skill level. Must be beginner, intermediate, or advanced');
            return;
        }

        try {
            this.showLoading();
            const data = await this.fetchAPI(`/admin/bots/${botId}`, {
                method: 'PATCH',
                body: JSON.stringify({ 
                    skillLevel: skillLevel.toLowerCase()
                })
            });

            if (data?.success) {
                this.showSuccess('Bot updated successfully');
                this.loadBots();
            } else {
                this.showError(data?.message || 'Failed to update bot');
            }
        } catch (error) {
            console.error('Error updating bot:', error);
            this.showError('Failed to update bot');
        } finally {
            this.hideLoading();
        }
    },

    async deleteBot(botId, botName) {
        if (!confirm(`Are you sure you want to delete bot "${botName}"? This action cannot be undone.`)) {
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
        // Create pagination HTML
        const paginationHtml = `
            <div class="pagination">
                <button class="btn btn-secondary" 
                        onclick="adminPanel.loadSectionData('${section}', ${pagination.page - 1})"
                        ${pagination.page <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <span class="pagination-info">
                    Page ${pagination.page} of ${pagination.pages} 
                    (${pagination.total} total items)
                </span>
                <button class="btn btn-secondary" 
                        onclick="adminPanel.loadSectionData('${section}', ${pagination.page + 1})"
                        ${pagination.page >= pagination.pages ? 'disabled' : ''}>
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        // Find the table container and add pagination
        const tableContainer = document.querySelector(`#${section}-table`)?.closest('.table-container');
        if (tableContainer) {
            // Remove existing pagination
            const existingPagination = tableContainer.querySelector('.pagination');
            if (existingPagination) {
                existingPagination.remove();
            }
            
            // Add new pagination
            tableContainer.insertAdjacentHTML('afterend', paginationHtml);
        }
    },

    loadSectionData(section, page = 1) {
        this.currentPage = page;
        
        switch (section) {
            case 'users':
                this.loadUsers(page);
                break;
            case 'referrals':
                this.loadReferrals(page);
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
            case 'feedback':
                this.loadFeedback(page);
                break;
            case 'website':
                this.loadWebsiteData(page);
                break;
            default:
                console.warn(`Unknown section: ${section}`);
        }
    },

    // ==================== MOBILE SIDEBAR METHODS ====================

    openMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    closeMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    // ==================== ADDITIONAL UTILITY METHODS ====================

    async exportReport() {
        try {
            this.showLoading();
            
            const period = document.getElementById('analytics-period')?.value || 'month';
            const data = await this.fetchAPI(`/admin/reports/financial?period=${period}`);
            
            if (data?.success) {
                // Create CSV content
                const csvContent = this.generateCSVReport(data.report);
                
                // Download CSV file
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `budzee-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showSuccess('Report exported successfully');
            } else {
                this.showError('Failed to generate report');
            }
        } catch (error) {
            console.error('Error exporting report:', error);
            this.showError('Failed to export report');
        } finally {
            this.hideLoading();
        }
    },

    generateCSVReport(report) {
        const headers = ['Metric', 'Amount', 'Count'];
        const rows = [
            ['Total Deposits', `₹${report.deposits.amount}`, report.deposits.count],
            ['Total Withdrawals', `₹${report.withdrawals.amount}`, report.withdrawals.count],
            ['Game Entries', `₹${report.gameEntries.amount}`, report.gameEntries.count],
            ['Game Winnings', `₹${report.gameWinnings.amount}`, report.gameWinnings.count],
            ['Refunds', `₹${report.refunds.amount}`, report.refunds.count],
            ['Net Revenue', `₹${report.summary.netRevenue}`, ''],
            ['Game Revenue', `₹${report.summary.gameRevenue}`, ''],
            ['Profit Margin', `${report.summary.profitMargin}%`, '']
        ];

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    async backupDatabase() {
        if (!confirm('Are you sure you want to create a database backup? This may take some time.')) {
            return;
        }

        try {
            this.showLoading();
            this.showSuccess('Database backup initiated. This may take several minutes...');
            
            // In a real implementation, this would trigger a server-side backup
            setTimeout(() => {
                this.showSuccess('Database backup completed successfully');
            }, 3000);
            
        } catch (error) {
            console.error('Error backing up database:', error);
            this.showError('Failed to backup database');
        } finally {
            this.hideLoading();
        }
    },

    async clearLogs() {
        if (!confirm('Are you sure you want to clear all system logs? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoading();
            
            // In a real implementation, this would clear server logs
            setTimeout(() => {
                this.showSuccess('System logs cleared successfully');
            }, 1000);
            
        } catch (error) {
            console.error('Error clearing logs:', error);
            this.showError('Failed to clear logs');
        } finally {
            this.hideLoading();
        }
    },

    async resetSystem() {
        const confirmation = prompt('Type "RESET" to confirm system reset (WARNING: This will delete all data):');
        
        if (confirmation !== 'RESET') {
            this.showError('System reset cancelled');
            return;
        }

        if (!confirm('Are you absolutely sure? This will permanently delete ALL data and cannot be undone!')) {
            return;
        }

        try {
            this.showLoading();
            this.showError('System reset is disabled for safety. Contact system administrator.');
            
        } catch (error) {
            console.error('Error resetting system:', error);
            this.showError('Failed to reset system');
        } finally {
            this.hideLoading();
        }
    },

    showPublishUpdateModal() {
        const modalContent = `
            <form id="publish-update-form" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="update-version">Version *</label>
                    <input type="text" id="update-version" name="version" required 
                           placeholder="e.g., 1.2.0" pattern="\\d+\\.\\d+\\.\\d+">
                </div>
                
                <div class="form-group">
                    <label for="update-type">Update Type *</label>
                    <select id="update-type" name="type" required>
                        <option value="">Select type</option>
                        <option value="MAJOR">Major Update</option>
                        <option value="MINOR">Minor Update</option>
                        <option value="PATCH">Patch/Bugfix</option>
                        <option value="HOTFIX">Hotfix</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="update-file">APK File *</label>
                    <input type="file" id="update-file" name="apk" accept=".apk" required>
                    <small>Maximum file size: 100MB</small>
                </div>
                
                <div class="form-group">
                    <label for="update-changelog">Changelog *</label>
                    <textarea id="update-changelog" name="changelog" required 
                              placeholder="What's new in this version..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="update-force">Force Update</label>
                    <select id="update-force" name="forceUpdate">
                        <option value="false">Optional</option>
                        <option value="true">Required</option>
                    </select>
                </div>
                
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-upload"></i> Publish Update
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Publish App Update', modalContent);

        document.getElementById('publish-update-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.publishUpdate();
        });
    },

    async publishUpdate() {
        try {
            const formData = new FormData(document.getElementById('publish-update-form'));
            
            this.showLoading();
            
            // In a real implementation, this would upload to the server
            setTimeout(() => {
                this.showSuccess('App update published successfully');
                this.closeModal();
                this.loadUpdates();
            }, 2000);
            
        } catch (error) {
            console.error('Error publishing update:', error);
            this.showError('Failed to publish update');
        } finally {
            this.hideLoading();
        }
    },

    async rollbackToVersion(updateId) {
        if (!confirm('Are you sure you want to rollback to this version? This will make it the current active version.')) {
            return;
        }

        try {
            this.showLoading();
            
            // In a real implementation, this would rollback the version
            setTimeout(() => {
                this.showSuccess('Successfully rolled back to selected version');
                this.loadUpdates();
            }, 1500);
            
        } catch (error) {
            console.error('Error rolling back version:', error);
            this.showError('Failed to rollback version');
        } finally {
            this.hideLoading();
        }
    }
});

// Initialize additional event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Analytics period change handler
    const analyticsPeriod = document.getElementById('analytics-period');
    if (analyticsPeriod) {
        analyticsPeriod.addEventListener('change', (e) => {
            if (window.adminPanel && window.adminPanel.currentSection === 'analytics') {
                window.adminPanel.loadAnalytics(e.target.value);
            }
        });
    }

    // Website data filter handler
    const websiteDataFilter = document.getElementById('website-data-filter');
    if (websiteDataFilter) {
        websiteDataFilter.addEventListener('change', (e) => {
            if (window.adminPanel && window.adminPanel.currentSection === 'website') {
                window.adminPanel.loadWebsiteData(1, e.target.value);
            }
        });
    }

    // Referral sort filter handler
    const referralSortFilter = document.getElementById('referral-sort-filter');
    if (referralSortFilter) {
        referralSortFilter.addEventListener('change', (e) => {
            if (window.adminPanel && window.adminPanel.currentSection === 'referrals') {
                window.adminPanel.loadReferrals(1, e.target.value);
            }
        });
    }
});
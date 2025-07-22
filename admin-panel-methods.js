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
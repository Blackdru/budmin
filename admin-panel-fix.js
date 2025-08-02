// Admin Panel Bug Fixes and Improvements
// This file contains critical bug fixes and performance improvements

// Critical bug fixes for the admin panel
(function() {
    'use strict';

    // ==================== AUTHENTICATION FIXES ====================

    // Fix token refresh and authentication issues
    function fixAuthenticationIssues() {
        if (!window.adminPanel) return;

        const originalFetchAPI = window.adminPanel.fetchAPI;
        
        window.adminPanel.fetchAPI = async function(endpoint, options = {}) {
            try {
                const response = await originalFetchAPI.call(this, endpoint, options);
                return response;
            } catch (error) {
                // Handle authentication errors
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    console.warn('Authentication error detected, redirecting to login...');
                    localStorage.removeItem('adminToken');
                    window.location.href = 'login.html';
                    return null;
                }
                throw error;
            }
        };
    }

    // ==================== MEMORY LEAK FIXES ====================

    // Fix memory leaks in event listeners
    function fixMemoryLeaks() {
        // Store references to event listeners for proper cleanup
        window.adminPanelEventListeners = window.adminPanelEventListeners || [];

        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            // Store reference for cleanup
            window.adminPanelEventListeners.push({
                target: this,
                type: type,
                listener: listener,
                options: options
            });
            
            return originalAddEventListener.call(this, type, listener, options);
        };

        // Cleanup function
        window.cleanupAdminPanelEventListeners = function() {
            window.adminPanelEventListeners.forEach(({ target, type, listener, options }) => {
                try {
                    target.removeEventListener(type, listener, options);
                } catch (e) {
                    // Ignore errors during cleanup
                }
            });
            window.adminPanelEventListeners = [];
        };

        // Auto-cleanup on page unload
        window.addEventListener('beforeunload', window.cleanupAdminPanelEventListeners);
    }

    // ==================== PERFORMANCE FIXES ====================

    // Debounce function for search and filter inputs
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Fix search performance issues
    function fixSearchPerformance() {
        const searchInputs = document.querySelectorAll('.search-box input, input[type="search"]');
        
        searchInputs.forEach(input => {
            // Remove existing listeners
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
            
            // Add debounced listener
            const debouncedSearch = debounce((value) => {
                if (window.adminPanel && typeof window.adminPanel.handleSearch === 'function') {
                    window.adminPanel.handleSearch(value);
                }
            }, 300);
            
            newInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        });
    }

    // ==================== UI FIXES ====================

    // Fix modal z-index and overlay issues
    function fixModalIssues() {
        const style = document.createElement('style');
        style.textContent = `
            .modal-overlay {
                z-index: 10000 !important;
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
            }
            
            .modal-content {
                z-index: 10001 !important;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .notification {
                z-index: 10002 !important;
            }
            
            .loading {
                z-index: 10003 !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Fix responsive design issues
    function fixResponsiveIssues() {
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .table-container {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                
                .stats-grid {
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }
                
                .action-buttons {
                    flex-direction: column;
                    gap: 0.25rem;
                }
                
                .action-buttons .btn {
                    width: 100%;
                    font-size: 0.8rem;
                    padding: 0.25rem 0.5rem;
                }
                
                .user-id-cell {
                    min-width: 100px;
                }
                
                .pagination {
                    flex-direction: column;
                    gap: 0.5rem;
                    text-align: center;
                }
                
                .pagination button {
                    width: 100%;
                }
            }
            
            @media (max-width: 480px) {
                .modal-content {
                    margin: 1rem;
                    max-width: calc(100vw - 2rem);
                }
                
                .form-group {
                    margin-bottom: 1rem;
                }
                
                .modal-actions {
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .modal-actions .btn {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ==================== DATA LOADING FIXES ====================

    // Fix infinite loading states
    function fixLoadingStates() {
        if (!window.adminPanel) return;

        // Add timeout to loading states
        const originalShowLoading = window.adminPanel.showLoading;
        const originalHideLoading = window.adminPanel.hideLoading;
        
        let loadingTimeout;
        
        window.adminPanel.showLoading = function() {
            originalShowLoading.call(this);
            
            // Auto-hide loading after 30 seconds
            loadingTimeout = setTimeout(() => {
                console.warn('Loading timeout reached, hiding loading indicator');
                this.hideLoading();
                this.showError('Request timed out. Please try again.');
            }, 30000);
        };
        
        window.adminPanel.hideLoading = function() {
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                loadingTimeout = null;
            }
            originalHideLoading.call(this);
        };
    }

    // Fix table rendering issues
    function fixTableRendering() {
        if (!window.adminPanel) return;

        // Add error handling to table rendering methods
        const tableRenderMethods = [
            'renderUsersTable',
            'renderGamesTable', 
            'renderTransactionsTable',
            'renderWithdrawalsTable',
            'renderBotsTable',
            'renderFeedbackTable',
            'renderReferralsTable'
        ];

        tableRenderMethods.forEach(methodName => {
            if (typeof window.adminPanel[methodName] === 'function') {
                const originalMethod = window.adminPanel[methodName];
                
                window.adminPanel[methodName] = function(data) {
                    try {
                        if (!Array.isArray(data)) {
                            console.warn(`${methodName}: Expected array, got:`, typeof data);
                            data = [];
                        }
                        return originalMethod.call(this, data);
                    } catch (error) {
                        console.error(`Error in ${methodName}:`, error);
                        this.showError(`Failed to render table data`);
                        
                        // Show empty state
                        const tableId = methodName.replace('render', '').replace('Table', '').toLowerCase();
                        const tbody = document.querySelector(`#${tableId}-table tbody`);
                        if (tbody) {
                            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">Error loading data</td></tr>';
                        }
                    }
                };
            }
        });
    }

    // ==================== NETWORK ERROR HANDLING ====================

    // Improve network error handling
    function improveNetworkErrorHandling() {
        if (!window.adminPanel) return;

        // Add retry mechanism
        window.adminPanel.retryRequest = async function(requestFn, maxRetries = 3, delay = 1000) {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    return await requestFn();
                } catch (error) {
                    console.warn(`Request attempt ${i + 1} failed:`, error.message);
                    
                    if (i === maxRetries - 1) {
                        throw error;
                    }
                    
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                }
            }
        };

        // Add network status detection
        window.adminPanel.checkNetworkStatus = function() {
            if (!navigator.onLine) {
                this.showError('No internet connection. Please check your network.');
                return false;
            }
            return true;
        };

        // Override fetchAPI to include network checks and retries
        const originalFetchAPI = window.adminPanel.fetchAPI;
        
        window.adminPanel.fetchAPI = async function(endpoint, options = {}) {
            if (!this.checkNetworkStatus()) {
                throw new Error('No network connection');
            }

            return this.retryRequest(async () => {
                return originalFetchAPI.call(this, endpoint, options);
            });
        };
    }

    // ==================== FORM VALIDATION FIXES ====================

    // Add comprehensive form validation
    function addFormValidation() {
        // Email validation
        window.validateEmail = function(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        };

        // Phone validation
        window.validatePhone = function(phone) {
            const re = /^[\+]?[1-9][\d]{0,15}$/;
            return re.test(phone.replace(/\s/g, ''));
        };

        // Password validation
        window.validatePassword = function(password) {
            return password && password.length >= 6;
        };

        // Add real-time validation to forms
        document.addEventListener('input', (e) => {
            const input = e.target;
            
            if (input.type === 'email') {
                const isValid = window.validateEmail(input.value);
                input.classList.toggle('invalid', !isValid && input.value.length > 0);
            }
            
            if (input.type === 'tel' || input.name === 'phone') {
                const isValid = window.validatePhone(input.value);
                input.classList.toggle('invalid', !isValid && input.value.length > 0);
            }
            
            if (input.type === 'password') {
                const isValid = window.validatePassword(input.value);
                input.classList.toggle('invalid', !isValid && input.value.length > 0);
            }
        });

        // Add validation styles
        const style = document.createElement('style');
        style.textContent = `
            .invalid {
                border-color: #dc3545 !important;
                box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
            }
            
            .valid {
                border-color: #28a745 !important;
                box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ==================== ACCESSIBILITY FIXES ====================

    // Improve accessibility
    function improveAccessibility() {
        // Add ARIA labels to buttons without text
        document.querySelectorAll('button:not([aria-label])').forEach(button => {
            const icon = button.querySelector('i');
            if (icon && !button.textContent.trim()) {
                const iconClass = icon.className;
                let label = 'Button';
                
                if (iconClass.includes('fa-eye')) label = 'View';
                else if (iconClass.includes('fa-edit')) label = 'Edit';
                else if (iconClass.includes('fa-trash')) label = 'Delete';
                else if (iconClass.includes('fa-copy')) label = 'Copy';
                else if (iconClass.includes('fa-check')) label = 'Approve';
                else if (iconClass.includes('fa-times')) label = 'Reject';
                
                button.setAttribute('aria-label', label);
            }
        });

        // Add keyboard navigation for tables
        document.querySelectorAll('table').forEach(table => {
            table.setAttribute('role', 'table');
            table.querySelectorAll('tr').forEach((row, index) => {
                row.setAttribute('role', 'row');
                row.setAttribute('tabindex', index === 0 ? '0' : '-1');
            });
        });

        // Add focus management for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay.active');
                if (modal && window.adminPanel) {
                    window.adminPanel.closeModal();
                }
            }
        });
    }

    // ==================== INITIALIZATION ====================

    // Initialize all fixes when DOM is ready
    function initializeFixes() {
        console.log('🔧 Initializing admin panel fixes...');
        
        try {
            fixAuthenticationIssues();
            fixMemoryLeaks();
            fixModalIssues();
            fixResponsiveIssues();
            fixLoadingStates();
            fixTableRendering();
            improveNetworkErrorHandling();
            addFormValidation();
            improveAccessibility();
            
            // Fix search performance after a delay to ensure elements exist
            setTimeout(fixSearchPerformance, 1000);
            
            console.log('✅ Admin panel fixes applied successfully');
        } catch (error) {
            console.error('❌ Error applying admin panel fixes:', error);
        }
    }

    // Apply fixes when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFixes);
    } else {
        initializeFixes();
    }

    // ==================== GLOBAL ERROR HANDLER ====================

    // Add global error handler for unhandled errors
    window.addEventListener('error', (e) => {
        console.error('Global error caught:', e.error);
        
        if (window.adminPanel && typeof window.adminPanel.showError === 'function') {
            window.adminPanel.showError('An unexpected error occurred. Please refresh the page.');
        }
    });

    // Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        
        if (window.adminPanel && typeof window.adminPanel.showError === 'function') {
            window.adminPanel.showError('A network error occurred. Please try again.');
        }
        
        // Prevent the default browser behavior
        e.preventDefault();
    });

})();
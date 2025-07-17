// Environment Configuration Loader for Admin Panel
class EnvironmentConfig {
    constructor() {
        this.config = {};
        this.loadEnvironmentVariables();
    }

    loadEnvironmentVariables() {
        // Default configuration
        const defaults = {
            // Environment
            NODE_ENV: 'development',
            APP_NAME: 'Budzee Admin Panel',
            APP_VERSION: '1.0.0',

            // Server Configuration
            API_BASE_URL: 'http://localhost:8080/api',
            SERVER_BASE_URL: 'http://localhost:8080',

            // API Endpoints
            API_AUTH_ENDPOINT: '/admin-auth',
            API_USERS_ENDPOINT: '/admin/users',
            API_GAMES_ENDPOINT: '/admin/games',
            API_TRANSACTIONS_ENDPOINT: '/admin/transactions',
            API_WITHDRAWALS_ENDPOINT: '/admin/withdrawals',
            API_BOTS_ENDPOINT: '/admin/bots',
            API_FEEDBACK_ENDPOINT: '/admin/feedback',
            API_ANALYTICS_ENDPOINT: '/admin/analytics',
            API_UPDATES_ENDPOINT: '/updates',
            API_HEALTH_ENDPOINT: '/health',

            // Admin Panel Settings
            ADMIN_SESSION_TIMEOUT: '3600000',
            ADMIN_MAX_LOGIN_ATTEMPTS: '5',
            ADMIN_LOCKOUT_DURATION: '900000',
            ADMIN_AUTO_REFRESH_INTERVAL: '30000',
            ADMIN_ITEMS_PER_PAGE: '20',
            ADMIN_MAX_SEARCH_RESULTS: '100',
            ADMIN_SIDEBAR_WIDTH: '280',
            ADMIN_MOBILE_BREAKPOINT: '768',
            ADMIN_ANIMATION_DURATION: '300',

            // Theme Configuration
            ADMIN_THEME: 'modern',
            ADMIN_PRIMARY_COLOR: '#6366F1',
            ADMIN_SECONDARY_COLOR: '#10B981',
            ADMIN_ACCENT_COLOR: '#F59E0B',
            ADMIN_SUCCESS_COLOR: '#10B981',
            ADMIN_WARNING_COLOR: '#F59E0B',
            ADMIN_DANGER_COLOR: '#EF4444',
            ADMIN_INFO_COLOR: '#3B82F6',

            // Game Configuration
            GAME_TYPES: 'MEMORY',
            GAME_MIN_ENTRY_FEE: '5',
            GAME_MAX_ENTRY_FEE: '1000',
            GAME_DEFAULT_ENTRY_FEES: '5,10,25,50,100,250,500,1000',

            // Bot Configuration
            BOT_MIN_COUNT: '10',
            BOT_MAX_COUNT: '100',
            BOT_DEFAULT_WIN_RATE: '50',
            BOT_WIN_RATE_MIN: '20',
            BOT_WIN_RATE_MAX: '80',

            // Transaction Configuration
            TRANSACTION_TYPES: 'DEPOSIT,WITHDRAWAL,GAME_ENTRY,GAME_WINNING,REFUND,REFERRAL_BONUS,REFERRAL_SIGNUP_BONUS',
            TRANSACTION_STATUSES: 'PENDING,COMPLETED,FAILED,CANCELLED',

            // Withdrawal Configuration
            WITHDRAWAL_METHODS: 'BANK,UPI',
            WITHDRAWAL_STATUSES: 'PENDING,APPROVED,PROCESSING,COMPLETED,REJECTED,CANCELLED',
            WITHDRAWAL_MIN_AMOUNT: '100',
            WITHDRAWAL_MAX_AMOUNT: '50000',

            // Feedback Configuration
            FEEDBACK_TYPES: 'GENERAL,BUG_REPORT,FEATURE_REQUEST,COMPLAINT,SUGGESTION',
            FEEDBACK_STATUSES: 'PENDING,REVIEWED,RESOLVED,CLOSED',

            // Update System Configuration
            UPDATE_MAX_FILE_SIZE: '104857600',
            UPDATE_ALLOWED_EXTENSIONS: '.apk',
            UPDATE_UPLOAD_TIMEOUT: '300000',
            UPDATE_PROGRESS_INTERVAL: '1000',

            // Security Configuration
            ENABLE_CSRF_PROTECTION: 'true',
            ENABLE_RATE_LIMITING: 'true',
            MAX_REQUEST_SIZE: '100mb',
            ALLOWED_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000',

            // Logging Configuration
            LOG_LEVEL: 'info',
            ENABLE_ACCESS_LOGS: 'true',
            ENABLE_ERROR_LOGS: 'true',
            LOG_FILE_PATH: './logs/admin.log',

            // Development Settings
            ENABLE_DEBUG_MODE: 'true',
            ENABLE_MOCK_DATA: 'false',
            ENABLE_API_LOGGING: 'true',
            ENABLE_PERFORMANCE_MONITORING: 'true',

            // Notification Settings
            NOTIFICATION_TIMEOUT: '5000',
            ENABLE_SOUND_NOTIFICATIONS: 'false',
            ENABLE_DESKTOP_NOTIFICATIONS: 'true',

            // Backup Configuration
            ENABLE_AUTO_BACKUP: 'true',
            BACKUP_INTERVAL: '86400000',
            BACKUP_RETENTION_DAYS: '30',
            BACKUP_LOCATION: './backups'
        };

        // Try to load from .env file if available (for development)
        this.loadFromEnvFile(defaults);

        // Process and convert values
        this.processConfiguration();
    }

    async loadFromEnvFile(defaults) {
        try {
            // In a real environment, you would load from .env file
            // For browser environment, we'll use defaults and allow override via localStorage
            
            // Check for environment overrides in localStorage
            const envOverrides = localStorage.getItem('admin_env_config');
            if (envOverrides) {
                const overrides = JSON.parse(envOverrides);
                Object.assign(defaults, overrides);
            }

            this.config = { ...defaults };
        } catch (error) {
            console.warn('Could not load environment configuration, using defaults:', error);
            this.config = { ...defaults };
        }
    }

    processConfiguration() {
        // Convert string values to appropriate types
        this.config.ADMIN_SESSION_TIMEOUT = parseInt(this.config.ADMIN_SESSION_TIMEOUT);
        this.config.ADMIN_MAX_LOGIN_ATTEMPTS = parseInt(this.config.ADMIN_MAX_LOGIN_ATTEMPTS);
        this.config.ADMIN_LOCKOUT_DURATION = parseInt(this.config.ADMIN_LOCKOUT_DURATION);
        this.config.ADMIN_AUTO_REFRESH_INTERVAL = parseInt(this.config.ADMIN_AUTO_REFRESH_INTERVAL);
        this.config.ADMIN_ITEMS_PER_PAGE = parseInt(this.config.ADMIN_ITEMS_PER_PAGE);
        this.config.ADMIN_MAX_SEARCH_RESULTS = parseInt(this.config.ADMIN_MAX_SEARCH_RESULTS);
        this.config.ADMIN_SIDEBAR_WIDTH = parseInt(this.config.ADMIN_SIDEBAR_WIDTH);
        this.config.ADMIN_MOBILE_BREAKPOINT = parseInt(this.config.ADMIN_MOBILE_BREAKPOINT);
        this.config.ADMIN_ANIMATION_DURATION = parseInt(this.config.ADMIN_ANIMATION_DURATION);

        // Convert arrays
        this.config.GAME_TYPES = this.config.GAME_TYPES.split(',').map(s => s.trim());
        this.config.GAME_DEFAULT_ENTRY_FEES = this.config.GAME_DEFAULT_ENTRY_FEES.split(',').map(s => parseInt(s.trim()));
        this.config.TRANSACTION_TYPES = this.config.TRANSACTION_TYPES.split(',').map(s => s.trim());
        this.config.TRANSACTION_STATUSES = this.config.TRANSACTION_STATUSES.split(',').map(s => s.trim());
        this.config.WITHDRAWAL_METHODS = this.config.WITHDRAWAL_METHODS.split(',').map(s => s.trim());
        this.config.WITHDRAWAL_STATUSES = this.config.WITHDRAWAL_STATUSES.split(',').map(s => s.trim());
        this.config.FEEDBACK_TYPES = this.config.FEEDBACK_TYPES.split(',').map(s => s.trim());
        this.config.FEEDBACK_STATUSES = this.config.FEEDBACK_STATUSES.split(',').map(s => s.trim());
        this.config.ALLOWED_ORIGINS = this.config.ALLOWED_ORIGINS.split(',').map(s => s.trim());

        // Convert numbers
        this.config.GAME_MIN_ENTRY_FEE = parseInt(this.config.GAME_MIN_ENTRY_FEE);
        this.config.GAME_MAX_ENTRY_FEE = parseInt(this.config.GAME_MAX_ENTRY_FEE);
        this.config.BOT_MIN_COUNT = parseInt(this.config.BOT_MIN_COUNT);
        this.config.BOT_MAX_COUNT = parseInt(this.config.BOT_MAX_COUNT);
        this.config.BOT_DEFAULT_WIN_RATE = parseInt(this.config.BOT_DEFAULT_WIN_RATE);
        this.config.BOT_WIN_RATE_MIN = parseInt(this.config.BOT_WIN_RATE_MIN);
        this.config.BOT_WIN_RATE_MAX = parseInt(this.config.BOT_WIN_RATE_MAX);
        this.config.WITHDRAWAL_MIN_AMOUNT = parseInt(this.config.WITHDRAWAL_MIN_AMOUNT);
        this.config.WITHDRAWAL_MAX_AMOUNT = parseInt(this.config.WITHDRAWAL_MAX_AMOUNT);
        this.config.UPDATE_MAX_FILE_SIZE = parseInt(this.config.UPDATE_MAX_FILE_SIZE);
        this.config.UPDATE_UPLOAD_TIMEOUT = parseInt(this.config.UPDATE_UPLOAD_TIMEOUT);
        this.config.UPDATE_PROGRESS_INTERVAL = parseInt(this.config.UPDATE_PROGRESS_INTERVAL);
        this.config.NOTIFICATION_TIMEOUT = parseInt(this.config.NOTIFICATION_TIMEOUT);
        this.config.BACKUP_INTERVAL = parseInt(this.config.BACKUP_INTERVAL);
        this.config.BACKUP_RETENTION_DAYS = parseInt(this.config.BACKUP_RETENTION_DAYS);

        // Convert booleans
        this.config.ENABLE_CSRF_PROTECTION = this.config.ENABLE_CSRF_PROTECTION === 'true';
        this.config.ENABLE_RATE_LIMITING = this.config.ENABLE_RATE_LIMITING === 'true';
        this.config.ENABLE_ACCESS_LOGS = this.config.ENABLE_ACCESS_LOGS === 'true';
        this.config.ENABLE_ERROR_LOGS = this.config.ENABLE_ERROR_LOGS === 'true';
        this.config.ENABLE_DEBUG_MODE = this.config.ENABLE_DEBUG_MODE === 'true';
        this.config.ENABLE_MOCK_DATA = this.config.ENABLE_MOCK_DATA === 'true';
        this.config.ENABLE_API_LOGGING = this.config.ENABLE_API_LOGGING === 'true';
        this.config.ENABLE_PERFORMANCE_MONITORING = this.config.ENABLE_PERFORMANCE_MONITORING === 'true';
        this.config.ENABLE_SOUND_NOTIFICATIONS = this.config.ENABLE_SOUND_NOTIFICATIONS === 'true';
        this.config.ENABLE_DESKTOP_NOTIFICATIONS = this.config.ENABLE_DESKTOP_NOTIFICATIONS === 'true';
        this.config.ENABLE_AUTO_BACKUP = this.config.ENABLE_AUTO_BACKUP === 'true';
    }

    // Getter methods for easy access
    get(key, defaultValue = null) {
        return this.config[key] !== undefined ? this.config[key] : defaultValue;
    }

    getApiUrl(endpoint = '') {
        return this.config.API_BASE_URL + endpoint;
    }

    getServerUrl(path = '') {
        return this.config.SERVER_BASE_URL + path;
    }

    getUpdateUrl(endpoint = '') {
        return this.config.SERVER_BASE_URL + this.config.API_UPDATES_ENDPOINT + endpoint;
    }

    // Environment-specific getters
    isDevelopment() {
        return this.config.NODE_ENV === 'development';
    }

    isProduction() {
        return this.config.NODE_ENV === 'production';
    }

    isDebugMode() {
        return this.config.ENABLE_DEBUG_MODE;
    }

    // Theme configuration
    getThemeConfig() {
        return {
            theme: this.config.ADMIN_THEME,
            colors: {
                primary: this.config.ADMIN_PRIMARY_COLOR,
                secondary: this.config.ADMIN_SECONDARY_COLOR,
                accent: this.config.ADMIN_ACCENT_COLOR,
                success: this.config.ADMIN_SUCCESS_COLOR,
                warning: this.config.ADMIN_WARNING_COLOR,
                danger: this.config.ADMIN_DANGER_COLOR,
                info: this.config.ADMIN_INFO_COLOR
            },
            ui: {
                sidebarWidth: this.config.ADMIN_SIDEBAR_WIDTH,
                mobileBreakpoint: this.config.ADMIN_MOBILE_BREAKPOINT,
                animationDuration: this.config.ADMIN_ANIMATION_DURATION
            }
        };
    }

    // Game configuration
    getGameConfig() {
        return {
            types: this.config.GAME_TYPES,
            minEntryFee: this.config.GAME_MIN_ENTRY_FEE,
            maxEntryFee: this.config.GAME_MAX_ENTRY_FEE,
            defaultEntryFees: this.config.GAME_DEFAULT_ENTRY_FEES
        };
    }

    // Bot configuration
    getBotConfig() {
        return {
            minCount: this.config.BOT_MIN_COUNT,
            maxCount: this.config.BOT_MAX_COUNT,
            defaultWinRate: this.config.BOT_DEFAULT_WIN_RATE,
            winRateRange: {
                min: this.config.BOT_WIN_RATE_MIN,
                max: this.config.BOT_WIN_RATE_MAX
            }
        };
    }

    // Update configuration for environment override
    updateConfig(key, value) {
        this.config[key] = value;
        
        // Save to localStorage for persistence
        try {
            const currentOverrides = JSON.parse(localStorage.getItem('admin_env_config') || '{}');
            currentOverrides[key] = value;
            localStorage.setItem('admin_env_config', JSON.stringify(currentOverrides));
        } catch (error) {
            console.warn('Could not save environment override:', error);
        }
    }

    // Get all configuration
    getAll() {
        return { ...this.config };
    }

    // Log configuration (for debugging)
    logConfiguration() {
        if (this.isDebugMode()) {
            console.group('🔧 Environment Configuration');
            console.log('Environment:', this.config.NODE_ENV);
            console.log('API Base URL:', this.config.API_BASE_URL);
            console.log('Server Base URL:', this.config.SERVER_BASE_URL);
            console.log('Theme:', this.getThemeConfig());
            console.log('Debug Mode:', this.isDebugMode());
            console.groupEnd();
        }
    }
}

// Create global instance
const ENV_CONFIG = new EnvironmentConfig();

// Log configuration on load
ENV_CONFIG.logConfiguration();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ENV_CONFIG;
} else {
    window.ENV_CONFIG = ENV_CONFIG;
}

// Also create a simplified CONFIG object for backward compatibility
const CONFIG = {
    API: {
        BASE_URL: ENV_CONFIG.getApiUrl(),
        ENDPOINTS: {
            AUTH: ENV_CONFIG.get('API_AUTH_ENDPOINT'),
            USERS: ENV_CONFIG.get('API_USERS_ENDPOINT'),
            GAMES: ENV_CONFIG.get('API_GAMES_ENDPOINT'),
            TRANSACTIONS: ENV_CONFIG.get('API_TRANSACTIONS_ENDPOINT'),
            WITHDRAWALS: ENV_CONFIG.get('API_WITHDRAWALS_ENDPOINT'),
            BOTS: ENV_CONFIG.get('API_BOTS_ENDPOINT'),
            FEEDBACK: ENV_CONFIG.get('API_FEEDBACK_ENDPOINT'),
            ANALYTICS: ENV_CONFIG.get('API_ANALYTICS_ENDPOINT'),
            UPDATES: ENV_CONFIG.get('API_UPDATES_ENDPOINT'),
            HEALTH: ENV_CONFIG.get('API_HEALTH_ENDPOINT')
        }
    },
    ADMIN: {
        AUTO_REFRESH_INTERVAL: ENV_CONFIG.get('ADMIN_AUTO_REFRESH_INTERVAL'),
        ITEMS_PER_PAGE: ENV_CONFIG.get('ADMIN_ITEMS_PER_PAGE'),
        MAX_SEARCH_RESULTS: ENV_CONFIG.get('ADMIN_MAX_SEARCH_RESULTS')
    },
    GAME: ENV_CONFIG.getGameConfig(),
    BOT: ENV_CONFIG.getBotConfig(),
    THEME: ENV_CONFIG.getThemeConfig()
};

if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
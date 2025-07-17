// Admin Panel Configuration
const CONFIG = {
    // Backend API Configuration
    API: {
        BASE_URL: 'http://localhost:8080/api',
        ENDPOINTS: {
            // Authentication
            AUTH: '/auth',
            
            // User Management
            USERS: '/users',
            USER_PROFILE: '/profile',
            
            // Game Management
            GAMES: '/game',
            MATCHMAKING: '/matchmaking',
            
            // Financial
            WALLET: '/wallet',
            TRANSACTIONS: '/payment',
            WITHDRAWALS: '/wallet/withdrawals',
            
            // Feedback
            FEEDBACK: '/feedback',
            
            // System
            HEALTH: '/health',
            DEBUG_QUEUE: '/debug/queue',
            DEBUG_SOCKETS: '/debug/sockets',
            DEBUG_BOTS: '/debug/bots',
            DEBUG_GAMES: '/debug/games'
        }
    },

    // Admin Panel Settings
    ADMIN: {
        AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
        ITEMS_PER_PAGE: 20,
        MAX_SEARCH_RESULTS: 100
    },

    // Game Settings
    GAME: {
        TYPES: ['MEMORY'],
        MIN_ENTRY_FEE: 5,
        MAX_ENTRY_FEE: 1000,
        DEFAULT_ENTRY_FEES: [5, 10, 25, 50, 100, 250, 500, 1000]
    },

    // Bot Settings
    BOT: {
        MIN_BOTS: 10,
        MAX_BOTS: 100,
        DEFAULT_WIN_RATE: 50,
        WIN_RATE_RANGE: { MIN: 20, MAX: 80 }
    },

    // Transaction Settings
    TRANSACTION: {
        TYPES: ['DEPOSIT', 'WITHDRAWAL', 'GAME_ENTRY', 'GAME_WINNING', 'REFUND', 'REFERRAL_BONUS', 'REFERRAL_SIGNUP_BONUS'],
        STATUSES: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']
    },

    // Withdrawal Settings
    WITHDRAWAL: {
        METHODS: ['BANK', 'UPI'],
        STATUSES: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'],
        MIN_AMOUNT: 100,
        MAX_AMOUNT: 50000
    },

    // Feedback Settings
    FEEDBACK: {
        TYPES: ['GENERAL', 'BUG_REPORT', 'FEATURE_REQUEST', 'COMPLAINT', 'SUGGESTION'],
        STATUSES: ['PENDING', 'REVIEWED', 'RESOLVED', 'CLOSED']
    },

    // UI Settings
    UI: {
        THEME: 'modern',
        SIDEBAR_WIDTH: 280,
        MOBILE_BREAKPOINT: 768,
        ANIMATION_DURATION: 300
    },

    // Security Settings
    SECURITY: {
        SESSION_TIMEOUT: 3600000, // 1 hour
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_DURATION: 900000 // 15 minutes
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
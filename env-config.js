// Environment Configuration for Admin Panel
class EnvironmentConfig {
    constructor() {
        this.config = {
            // Server Configuration - Default to localhost:8080
            SERVER_URL: 'http://localhost:8080',
            API_URL: 'http://localhost:8080/api',
            
            // Admin Panel Configuration
            ADMIN_ITEMS_PER_PAGE: 20,
            ADMIN_AUTO_REFRESH_INTERVAL: 30000,
            
            // Development/Production flags
            NODE_ENV: 'development',
            DEBUG: true
        };
        
        // Load environment-specific overrides
        this.loadEnvironmentOverrides();
    }
    
    loadEnvironmentOverrides() {
        const currentLocation = window.location;
        const isFileProtocol = currentLocation.protocol === 'file:';
        const isLocalhost = currentLocation.hostname === 'localhost' || 
                           currentLocation.hostname === '127.0.0.1' || 
                           currentLocation.hostname === '';
        
        console.log('Current location:', {
            protocol: currentLocation.protocol,
            hostname: currentLocation.hostname,
            port: currentLocation.port,
            isFileProtocol,
            isLocalhost
        });
        
        // Always use the live server URL for production
        this.config.SERVER_URL = 'https://test.fivlog.space';
        this.config.API_URL = 'https://test.fivlog.space/api';
        this.config.NODE_ENV = 'production';
        this.config.DEBUG = false;
        
        // Override for local development if needed
        if (isFileProtocol || isLocalhost) {
            // Check if we want to use local development
            const useLocal = localStorage.getItem('useLocalDevelopment');
            if (useLocal === 'true') {
                this.config.SERVER_URL = 'http://localhost:8080';
                this.config.API_URL = 'http://localhost:8080/api';
                this.config.NODE_ENV = 'development';
                this.config.DEBUG = true;
                console.log('🔧 Using local development server');
            } else {
                console.log('🌐 Using live production server: https://test.fivlog.space');
            }
        }
        
        console.log('Environment Config Loaded:', this.config);
    }
    
    get(key) {
        return this.config[key];
    }
    
    set(key, value) {
        this.config[key] = value;
    }
    
    getServerUrl() {
        return this.config.SERVER_URL;
    }
    
    getApiUrl() {
        return this.config.API_URL;
    }
    
    isProduction() {
        return this.config.NODE_ENV === 'production';
    }
    
    isDevelopment() {
        return this.config.NODE_ENV === 'development';
    }
    
    isDebugEnabled() {
        return this.config.DEBUG;
    }
}

// Create global instance
window.ENV_CONFIG = new EnvironmentConfig();

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnvironmentConfig;
}
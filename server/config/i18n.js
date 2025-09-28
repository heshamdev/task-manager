/**
 * Internationalization (i18n) configuration
 * Sets up multi-language support for the application
 * 
 * @description Configures i18next with file system backend for loading translations
 * @returns {Object} Configured i18next instance
 */

const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');

/**
 * Initialize i18next with configuration
 * Sets up language detection, fallback, and resource loading
 * 
 * @returns {Object} Configured i18next middleware
 */
const initI18n = () => {
    i18next
        .use(Backend)
        .init({
            // Language settings
            lng: 'en', // default language
            fallbackLng: 'en',
            
            // Namespace settings
            ns: ['common', 'auth', 'tasks', 'errors'],
            defaultNS: 'common',
            
            // Backend configuration
            backend: {
                loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
            },
            
            // Interpolation settings
            interpolation: {
                escapeValue: false, // not needed for server-side
            },
            
            // Debug settings
            //debug: process.env.NODE_ENV === 'development',
            
            // Detection settings
            detection: {
                order: ['header', 'querystring'],
                lookupHeader: 'accept-language',
                lookupQuerystring: 'lng',
                caches: false,
            }
        });

    return i18next;
};

/**
 * Express middleware for i18n
 * Adds translation function to request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 */
const i18nMiddleware = (req, res, next) => {
    // Detect language from request
    const language = req.headers['accept-language'] || req.query.lng || 'en';
    
    // Set language for this request
    req.language = language.split(',')[0].split('-')[0]; // Get primary language code
    
    // Add translation function to request
    req.t = (key, options = {}) => {
        return i18next.t(key, { ...options, lng: req.language });
    };
    
    next();
};

// Initialize i18n
const i18n = initI18n();

module.exports = {
    init: i18nMiddleware,
    i18n
};

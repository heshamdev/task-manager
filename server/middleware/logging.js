/**
 * Logging middleware for tracking user actions and views
 * Provides utilities to determine view context and enhance logging
 */

/**
 * Middleware to extract view context from request headers
 * Checks for custom headers that indicate the frontend page/view
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const extractViewContext = (req, res, next) => {
    // Extract view from custom header (set by frontend)
    req.currentView = req.headers['x-current-view'] || getViewFromUrl(req.originalUrl);
    next();
};

/**
 * Helper function to determine view from URL pattern
 * Maps API endpoints to logical view names
 *
 * @param {string} url - Request URL
 * @returns {string} View name
 */
const getViewFromUrl = (url) => {
    if (url.includes('/api/auth/login')) return 'login';
    if (url.includes('/api/auth/register')) return 'register';
    if (url.includes('/api/tasks')) return 'tasks';
    if (url.includes('/api/admin')) return 'admin';
    return 'unknown';
};

/**
 * Enhanced logging function that includes user email and view context
 * To be used in route handlers for comprehensive audit logging
 *
 * @param {Object} req - Express request object (should have userId and currentView)
 * @param {string} action - Action being performed
 * @param {Object} details - Additional details about the action
 * @returns {Promise} Promise that resolves when logging is complete
 */
const logRequestAction = async (req, action, details = {}) => {
    const logger = require('../utils/logger');

    if (!req.userId) {
        // For unauthenticated requests, use basic logging
        logger.info(`Unauthenticated Action: ${action}`, {
            action,
            view: req.currentView || 'unknown',
            details,
            ipAddress: req.ip,
            timestamp: new Date().toISOString(),
            type: 'UNAUTHENTICATED_ACTION'
        });
        return;
    }

    // Use enhanced logging for authenticated requests
    await logger.logUserActionWithEmail(
        req.userId,
        action,
        details,
        req.ip,
        req.currentView || 'unknown'
    );
};

module.exports = {
    extractViewContext,
    getViewFromUrl,
    logRequestAction
};
/**
 * Professional Activity Logging Middleware
 * Provides comprehensive activity logging with user context, view tracking, and action monitoring
 *
 * @description Enhanced middleware for tracking user activities across different views and actions
 */

/**
 * View context mapping for different endpoints
 * Maps API endpoints to user-facing view names
 */
const VIEW_MAPPING = {
    '/api/auth/login': 'login',
    '/api/auth/register': 'register',
    '/api/auth/logout': 'login',
    '/api/tasks': 'tasks',
    '/api/tasks/filter': 'tasks',
    '/api/tasks/stats': 'tasks',
    '/api/tasks/update-overdue': 'tasks',
    '/api/admin/logs': 'admin',
    '/api/admin/export': 'admin'
};

/**
 * Action mapping for different HTTP methods and endpoints
 * Maps API calls to user-friendly action names
 */
const ACTION_MAPPING = {
    'POST /api/auth/login': 'LOGIN',
    'POST /api/auth/register': 'REGISTER',
    'POST /api/auth/logout': 'LOGOUT',
    'GET /api/tasks': 'VIEW_TASKS',
    'POST /api/tasks': 'CREATE_TASK',
    'PUT /api/tasks/:id': 'UPDATE_TASK',
    'PATCH /api/tasks/:id/toggle': 'TOGGLE_TASK',
    'DELETE /api/tasks/:id': 'DELETE_TASK',
    'GET /api/tasks/filter': 'FILTER_TASKS',
    'GET /api/tasks/stats': 'VIEW_TASK_STATS',
    'POST /api/tasks/update-overdue': 'UPDATE_OVERDUE_TASKS',
    'GET /api/admin/logs': 'VIEW_LOGS',
    'POST /api/admin/export': 'EXPORT_LOGS'
};

/**
 * Extract view context from request
 * Determines the view context based on the request path and headers
 *
 * @param {Object} req - Express request object
 * @returns {string} View context name
 */
const extractViewContext = (req, res, next) => {
    req.currentView = getViewFromRequest(req);
    next();
};

/**
 * Enhanced view detection from request
 * Maps API endpoints to logical view names with better pattern matching
 *
 * @param {Object} req - Express request object
 * @returns {string} View name
 */
const getViewFromRequest = (req) => {
    // Check for explicit view header (can be set by frontend)
    if (req.headers['x-current-view']) {
        return req.headers['x-current-view'];
    }

    const path = req.path;

    // Direct mapping
    if (VIEW_MAPPING[path]) {
        return VIEW_MAPPING[path];
    }

    // Pattern matching for dynamic routes
    if (path.startsWith('/api/tasks/') && path !== '/api/tasks/filter' && path !== '/api/tasks/stats') {
        return 'tasks';
    }

    if (path.startsWith('/api/admin/')) {
        return 'admin';
    }

    if (path.startsWith('/api/auth/')) {
        return req.method === 'POST' && path.includes('register') ? 'register' : 'login';
    }

    return 'unknown';
};

/**
 * Helper function for backward compatibility
 * @deprecated Use getViewFromRequest instead
 */
const getViewFromUrl = (url) => {
    if (url.includes('/api/auth/login')) return 'login';
    if (url.includes('/api/auth/register')) return 'register';
    if (url.includes('/api/tasks')) return 'tasks';
    if (url.includes('/api/admin')) return 'admin';
    return 'unknown';
};

/**
 * Extract action from request
 * Maps HTTP method + path to action names
 *
 * @param {Object} req - Express request object
 * @returns {string} Action name
 */
const getActionFromRequest = (req) => {
    const method = req.method;
    const path = req.route ? req.route.path : req.path;
    const key = `${method} ${path}`;

    // Direct mapping
    if (ACTION_MAPPING[key]) {
        return ACTION_MAPPING[key];
    }

    // Pattern matching for dynamic routes
    if (method === 'PUT' && path.includes('/api/tasks/') && !path.includes('toggle')) {
        return 'UPDATE_TASK';
    }

    if (method === 'PATCH' && path.includes('/api/tasks/') && path.includes('toggle')) {
        return 'TOGGLE_TASK';
    }

    if (method === 'DELETE' && path.includes('/api/tasks/')) {
        return 'DELETE_TASK';
    }

    return `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
};

/**
 * Extract relevant details from request for logging
 * Captures important data for audit purposes
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object (optional)
 * @returns {Object} Details object for logging
 */
const extractRequestDetails = (req, res = null) => {
    const details = {
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        method: req.method,
        path: req.path,
        query: req.query
    };

    // Add relevant body data (excluding sensitive information)
    if (req.body && typeof req.body === 'object') {
        const bodyData = { ...req.body };

        // Remove sensitive fields
        delete bodyData.password;
        delete bodyData.confirmPassword;
        delete bodyData.token;

        // For task operations, include relevant task data
        if (req.path.includes('/api/tasks')) {
            details.taskData = {
                title: bodyData.title,
                status: bodyData.status,
                priority: bodyData.priority,
                dueDate: bodyData.dueDate
            };
        }

        // For auth operations, include non-sensitive data
        if (req.path.includes('/api/auth')) {
            details.authData = {
                email: bodyData.email,
                name: bodyData.name
            };
        }
    }

    // Add response status if available
    if (res && res.statusCode) {
        details.statusCode = res.statusCode;
    }

    return details;
};

/**
 * Enhanced logging function that includes user email and view context
 * To be used in route handlers for comprehensive audit logging
 *
 * @param {Object} req - Express request object (should have userId and currentView)
 * @param {string} action - Action being performed (optional - will be auto-detected)
 * @param {Object} customDetails - Additional custom details about the action
 * @param {Object} res - Express response object (optional)
 * @returns {Promise} Promise that resolves when logging is complete
 */
const logRequestAction = async (req, action = null, customDetails = {}, res = null) => {
    const logger = require('../utils/logger');

    // Auto-detect action if not provided
    const finalAction = action || getActionFromRequest(req);

    // Extract standard request details
    const requestDetails = extractRequestDetails(req, res);

    // Merge with custom details
    const details = { ...requestDetails, ...customDetails };

    if (!req.userId) {
        // For unauthenticated requests, use basic logging
        logger.info(`Unauthenticated Action: ${finalAction}`, {
            action: finalAction,
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
        finalAction,
        details,
        req.ip,
        req.currentView || 'unknown'
    );
};

/**
 * Express middleware for automatic request logging
 * Logs all requests with user context and action detection
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const autoLogRequests = (req, res, next) => {
    // Store original res.end to capture response
    const originalEnd = res.end;

    res.end = function(chunk, encoding) {
        // Log the request after response is ready
        setImmediate(async () => {
            try {
                await logRequestAction(req, null, {}, res);
            } catch (error) {
                console.error('Auto-logging error:', error);
            }
        });

        // Call original end
        originalEnd.call(res, chunk, encoding);
    };

    next();
};

module.exports = {
    extractViewContext,
    getViewFromUrl,
    getActionFromRequest,
    extractRequestDetails,
    logRequestAction,
    autoLogRequests
};
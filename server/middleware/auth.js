/**
 * Authentication middleware for JWT token verification
 * Protects routes that require user authentication
 * 
 * @description Verifies JWT tokens and adds user information to request object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT token and authenticate user
 * Extracts token from Authorization header and verifies it
 * Adds authenticated user to request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Calls next() on success, sends error response on failure
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: req.t('auth.tokenRequired') || 'Access token is required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user by ID from token
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: req.t('auth.userNotFound') || 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: req.t('auth.accountDeactivated') || 'Account has been deactivated'
            });
        }

        // Add user to request object
        req.user = user;
        req.userId = user._id.toString();
        
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: req.t('auth.invalidToken') || 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: req.t('auth.tokenExpired') || 'Token has expired'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: req.t('errors.serverError') || 'Internal server error'
        });
    }
};

/**
 * Require admin middleware
 * Ensures the authenticated user has admin privileges
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: req.t('errors.unauthorized') || 'Unauthorized access'
            });
        }
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: req.t('errors.forbidden') || 'Access forbidden'
            });
        }
        next();
    } catch (error) {
        logger.error('Admin check error:', error);
        return res.status(500).json({
            success: false,
            message: req.t('errors.serverError') || 'Internal server error'
        });
    }
};

/**
 * Optional authentication middleware
 * Similar to authenticateToken but doesn't require token
 * Adds user info if token is present and valid
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Always calls next(), adds user if token is valid
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : null;

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            
            if (user && user.isActive) {
                req.user = user;
                req.userId = user._id.toString();
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        logger.warn('Optional auth failed:', error.message);
        next();
    }
};

/**
 * Generate JWT token for user
 * Creates a signed JWT token with user ID and expiration
 * 
 * @param {string} userId - User ID to include in token
 * @param {string} expiresIn - Token expiration time (default from env)
 * @returns {string} Signed JWT token
 */
const generateToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn }
    );
};

/**
 * Verify JWT token without middleware
 * Utility function to verify token and return decoded payload
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} Token verification error
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
    authenticateToken,
    requireAdmin,
    optionalAuth,
    generateToken,
    verifyToken
};

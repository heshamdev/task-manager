/**
 * Validation middleware using express-validator
 * Provides validation rules and error handling for API endpoints
 * 
 * @description Contains validation rules for user registration, login, and task operations
 */

const { body, validationResult } = require('express-validator');

/**
 * Handle validation errors
 * Middleware to check for validation errors and return formatted response
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Sends error response or calls next()
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: req.t('validation.validationFailed') || 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Validation rules for user registration
 * Validates email, password, and name fields
 * 
 * @returns {Array} Array of validation middleware
 */
const validateRegistration = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .toLowerCase(),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s\-'\.]+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
    
    handleValidationErrors
];

/**
 * Validation rules for user login
 * Validates email and password fields
 * 
 * @returns {Array} Array of validation middleware
 */
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .toLowerCase(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

/**
 * Validation rules for task creation
 * Validates title, description, priority, and due date
 * 
 * @returns {Array} Array of validation middleware
 */
const validateTaskCreation = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Task title must be between 1 and 100 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Task description cannot exceed 500 characters'),
    
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date')
        .custom((value) => {
            if (value && new Date(value) <= new Date()) {
                throw new Error('Due date must be in the future');
            }
            return true;
        }),
    
    handleValidationErrors
];

/**
 * Validation rules for task updates
 * Validates title, description, status, priority, and due date
 * 
 * @returns {Array} Array of validation middleware
 */
const validateTaskUpdate = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Task title must be between 1 and 100 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Task description cannot exceed 500 characters'),
    
    body('status')
        .optional()
        .isIn(['pending', 'completed'])
        .withMessage('Status must be pending or completed'),
    
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    
    body('dueDate')
        .optional()
        .custom((value) => {
            if (value === null || value === '') {
                return true; // Allow null/empty to clear due date
            }
            if (!Date.parse(value)) {
                throw new Error('Due date must be a valid date');
            }
            if (new Date(value) <= new Date()) {
                throw new Error('Due date must be in the future');
            }
            return true;
        }),
    
    handleValidationErrors
];

/**
 * Validation rules for password change
 * Validates current password and new password
 * 
 * @returns {Array} Array of validation middleware
 */
const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match new password');
            }
            return true;
        }),
    
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateTaskCreation,
    validateTaskUpdate,
    validatePasswordChange,
    handleValidationErrors
};

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
        // Format errors for better user experience
        const formattedErrors = errors.array().map(error => {
            // Extract field name from path (e.g., 'title' from 'body.title')
            const fieldName = error.path || error.param || 'field';

            // Create user-friendly field display name
            const fieldDisplayName = getFieldDisplayName(fieldName, req);

            return {
                field: fieldName,
                message: error.msg,
                value: error.value,
                location: error.location,
                // Add a user-friendly field name for frontend display
                fieldDisplayName: fieldDisplayName
            };
        });

        // Create a more descriptive main message
        const mainMessage = formattedErrors.length === 1
            ? req.t('validation.singleFieldError') || 'Please correct the highlighted field'
            : req.t('validation.multipleFieldsError', { count: formattedErrors.length }) || `Please correct the ${formattedErrors.length} highlighted fields`;

        return res.status(400).json({
            success: false,
            message: mainMessage,
            errors: formattedErrors,
            validationFailed: true
        });
    }
    next();
};

/**
 * Get user-friendly display name for form fields
 * @param {string} fieldName - The technical field name
 * @param {Object} req - Express request object for translations
 * @returns {string} User-friendly field name
 */
const getFieldDisplayName = (fieldName, req) => {
    const fieldNames = {
        'email': req.t('auth.email') || 'Email',
        'password': req.t('auth.password') || 'Password',
        'name': req.t('auth.name') || 'Name',
        'title': req.t('tasks.title') || 'Title',
        'description': req.t('tasks.description') || 'Description',
        'priority': req.t('common.priority') || 'Priority',
        'dueDate': req.t('tasks.dueDate') || 'Due Date',
        'status': req.t('common.status') || 'Status'
    };

    return fieldNames[fieldName] || fieldName;
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
        .withMessage((value, { req }) => req.t('validation.email.invalid') || 'Please enter a valid email address (e.g., user@example.com)')
        .normalizeEmail()
        .toLowerCase(),

    body('password')
        .isLength({ min: 6 })
        .withMessage((value, { req }) => req.t('validation.password.minLength') || 'Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage((value, { req }) => req.t('validation.password.complexity') || 'Password must include: uppercase letter, lowercase letter, and number'),

    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage((value, { req }) => req.t('validation.name.length') || 'Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s\-'\.]+$/)
        .withMessage((value, { req }) => req.t('validation.name.format') || 'Name can only contain letters, spaces, hyphens, and apostrophes'),

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
        .withMessage((value, { req }) => req.t('validation.email.invalid') || 'Please enter a valid email address')
        .normalizeEmail()
        .toLowerCase(),

    body('password')
        .notEmpty()
        .withMessage((value, { req }) => req.t('validation.password.required') || 'Please enter your password'),

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
        .withMessage((value, { req }) => req.t('validation.task.title.length') || 'Please enter a task title (1-100 characters)'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage((value, { req }) => req.t('validation.task.description.maxLength') || 'Description is too long. Please use 500 characters or less'),

    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage((value, { req }) => req.t('validation.task.priority.invalid') || 'Please select Low, Medium, or High priority'),

    body('dueDate')
        .optional()
        .custom((value, { req }) => {
            if (value === null || value === '' || value === undefined) {
                return true; // Allow null/empty to clear due date
            }

            // Check if it's a valid date
            const parsedDate = Date.parse(value);
            if (!parsedDate || isNaN(parsedDate)) {
                throw new Error(req.t('validation.task.dueDate.invalid') || 'Please enter a valid date');
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
        .withMessage((value, { req }) => req.t('validation.task.title.length') || 'Please enter a task title (1-100 characters)'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage((value, { req }) => req.t('validation.task.description.maxLength') || 'Description is too long. Please use 500 characters or less'),

    body('status')
        .optional()
        .isIn(['active', 'completed', 'overdue'])
        .withMessage((value, { req }) => req.t('validation.task.status.invalid') || 'Please select Active, Completed, or Overdue status'),

    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage((value, { req }) => req.t('validation.task.priority.invalid') || 'Please select Low, Medium, or High priority'),

    body('dueDate')
        .optional()
        .custom((value, { req }) => {
            if (value === null || value === '' || value === undefined) {
                return true; // Allow null/empty to clear due date
            }

            // Check if it's a valid date
            const parsedDate = Date.parse(value);
            if (!parsedDate || isNaN(parsedDate)) {
                throw new Error(req.t('validation.task.dueDate.invalid') || 'Please enter a valid date');
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
        .withMessage((value, { req }) => req.t('validation.password.currentRequired') || 'Please enter your current password'),

    body('newPassword')
        .isLength({ min: 6 })
        .withMessage((value, { req }) => req.t('validation.password.minLength') || 'New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage((value, { req }) => req.t('validation.password.complexity') || 'New password must include: uppercase letter, lowercase letter, and number'),

    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error(req.t('validation.password.confirmMismatch') || 'Password confirmation does not match');
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

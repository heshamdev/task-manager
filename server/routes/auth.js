/**
 * Authentication routes for user registration, login, and profile management
 * Handles JWT-based authentication with proper validation and logging
 * 
 * @description Provides endpoints for user authentication and profile operations
 */

const express = require('express');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin, validatePasswordChange } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Register a new user
 * Creates new user account with email, password, and name
 * 
 * @route POST /api/auth/register
 * @param {string} email - User email address
 * @param {string} password - User password
 * @param {string} name - User full name
 * @returns {Object} Success response with user data and JWT token
 */
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: req.t('auth.emailExists') || 'Email address is already registered'
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            name
        });

        await user.save();

        // Generate JWT token
        const token = generateToken(user._id, user.isAdmin);

        // Log user registration
        logger.logUserAction(
            user._id.toString(),
            'REGISTER',
            { email: user.email, name: user.name },
            req.ip
        );

        res.status(201).json({
            success: true,
            message: req.t('auth.registrationSuccess') || 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    createdAt: user.createdAt
                },
                token
            }
        });

    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error'),
            ...(process.env.NODE_ENV === 'development' && error ? { stack: error.stack } : {})
        });
    }
});

/**
 * Login user
 * Authenticates user with email and password
 * 
 * @route POST /api/auth/login
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Object} Success response with user data and JWT token
 */
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email (including password field)
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: req.t('auth.invalidCredentials') || 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: req.t('auth.accountDeactivated') || 'Account has been deactivated'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: req.t('auth.invalidCredentials') || 'Invalid email or password'
            });
        }

        // Update last login timestamp
        await user.updateLastLogin();

        // Generate JWT token
        const token = generateToken(user._id, user.isAdmin);

        // Log user login
        logger.logUserAction(
            user._id.toString(),
            'LOGIN',
            { email: user.email },
            req.ip
        );

        res.json({
            success: true,
            message: req.t('auth.loginSuccess') || 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                },
                token
            }
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error'),
            ...(process.env.NODE_ENV === 'development' && error ? { stack: error.stack } : {})
        });
    }
});

/**
 * Get current user profile
 * Returns authenticated user's profile information
 * 
 * @route GET /api/auth/profile
 * @returns {Object} User profile data
 */
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('taskCount');

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt,
                    taskCount: user.taskCount || 0
                }
            }
        });

    } catch (error) {
        logger.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error'),
            ...(process.env.NODE_ENV === 'development' && error ? { stack: error.stack } : {})
        });
    }
});

/**
 * Update user profile
 * Updates user's name and email
 * 
 * @route PUT /api/auth/profile
 * @param {string} name - Updated user name
 * @param {string} email - Updated email address
 * @returns {Object} Updated user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, email } = req.body;
        const userId = req.userId;

        // Check if email is already taken by another user
        if (email && email !== req.user.email) {
            const existingUser = await User.findOne({ 
                email, 
                _id: { $ne: userId } 
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: req.t('auth.emailExists') || 'Email address is already in use'
                });
            }
        }

        // Update user
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.toLowerCase().trim();

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        // Log profile update
        logger.logUserAction(
            userId,
            'PROFILE_UPDATE',
            { updatedFields: Object.keys(updateData) },
            req.ip
        );

        res.json({
            success: true,
            message: req.t('auth.profileUpdated') || 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                }
            }
        });

    } catch (error) {
        logger.error('Profile update error:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: req.t('validation.validationFailed') || 'Validation failed',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: req.t('errors.serverError') || 'Internal server error'
        });
    }
});

/**
 * Change user password
 * Updates user's password after verifying current password
 * 
 * @route PUT /api/auth/change-password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Object} Success response
 */
router.put('/change-password', authenticateToken, validatePasswordChange, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;

        // Get user with password
        const user = await User.findById(userId).select('+password');

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: req.t('auth.invalidCurrentPassword') || 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Log password change
        logger.logUserAction(
            userId,
            'PASSWORD_CHANGE',
            {},
            req.ip
        );

        res.json({
            success: true,
            message: req.t('auth.passwordChanged') || 'Password changed successfully'
        });

    } catch (error) {
        logger.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error'),
            ...(process.env.NODE_ENV === 'development' && error ? { stack: error.stack } : {})
        });
    }
});

/**
 * Logout user
 * Logs the logout action (token invalidation handled client-side)
 * 
 * @route POST /api/auth/logout
 * @returns {Object} Success response
 */
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // Log user logout
        logger.logUserAction(
            req.userId,
            'LOGOUT',
            {},
            req.ip
        );

        res.json({
            success: true,
            message: req.t('auth.logoutSuccess') || 'Logged out successfully'
        });

    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error'),
            ...(process.env.NODE_ENV === 'development' && error ? { stack: error.stack } : {})
        });
    }
});

module.exports = router;

/**
 * Main server entry point for the Task Manager application
 * Sets up Express server, middleware, routes, and database connection
 * 
 * @author Task Manager Developer
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const i18n = require('./config/i18n');

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const adminRoutes = require('./routes/admin');

/**
 * Initialize and configure the Express application
 * Sets up middleware, routes, and error handling
 * 
 * @returns {Object} Express application instance
 */
function createApp() {
    const app = express();
     // CORS configuration - Allow development and production ports
    app.use(cors({
      origin: [
        process.env.CLIENT_URL,        // http://localhost:8080
        'http://localhost:8080',       // Primary development frontend
      ].filter(Boolean),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    }));
    app.options('*', cors());
    // Security middleware
    app.use(helmet());
    
    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    });
    app.use(limiter);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // i18n middleware
    app.use(i18n.init);

    // Fallback for translation function to avoid runtime errors if i18n fails
    app.use((req, res, next) => {
        if (typeof req.t !== 'function') {
            req.t = (key) => key;
        }
        next();
    });

    // Logging middleware
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path} - ${req.ip}`);
        next();
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV 
        });
    });

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/tasks', taskRoutes);
    app.use('/api/admin', adminRoutes);

    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({ 
            success: false, 
            message: req.t('errors.notFound') || 'Route not found' 
        });
    });

    // Global error handler
    app.use((err, req, res, next) => {
        console.error(`Error: ${err.message}`, { 
            stack: err.stack, 
            url: req.url, 
            method: req.method 
        });
        
        res.status(err.status || 500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' 
                ? req.t('errors.serverError') || 'Internal server error'
                : err.message
        });
    });

    return app;
}

/**
 * Start the server and connect to database
 * Handles graceful shutdown on process termination
 * 
 * @param {number} port - Port number to listen on
 */
async function startServer(port = process.env.PORT || 3000) {
    try {
        // Connect to database
        await connectDB();
        
        // Create and start the app
        const app = createApp();
        
        const server = app.listen(port, () => {
            console.log(`Server running on port ${port} in ${process.env.NODE_ENV} mode`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${port} is already in use`);
                process.exit(1);
            } else {
                console.error('Server error:', err);
                process.exit(1);
            }
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('Process terminated');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received, shutting down gracefully');
            server.close(() => {
                console.log('Process terminated');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start server if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = { createApp, startServer };

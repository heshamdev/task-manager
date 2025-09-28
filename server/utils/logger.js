/**
 * Logging utility using Winston
 * Provides structured logging with different levels and file output
 * 
 * @description Creates logger instance with console and file transports
 * @returns {Object} Winston logger instance
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * Ensure logs directory exists
 * Creates logs directory if it doesn't exist
 * 
 * @param {string} logPath - Path to log file
 */
const ensureLogDirectory = (logPath) => {
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
};

/**
 * Create and configure Winston logger
 * Sets up console and file transports with appropriate formatting
 * 
 * @returns {Object} Configured Winston logger instance
 */
const createLogger = () => {
    const logFilePath = process.env.LOG_FILE_PATH || './logs/app.log';
    const logLevel = process.env.LOG_LEVEL || 'info';
    
    // Ensure log directory exists
    ensureLogDirectory(logFilePath);
    
    // Define log format
    const logFormat = winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            let log = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(meta).length > 0) {
                log += ` ${JSON.stringify(meta)}`;
            }
            return log;
        })
    );

    // Create transports
    const transports = [
        // File transport for all logs
        new winston.transports.File({
            filename: logFilePath,
            level: logLevel,
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        
        // Separate file for errors
        new winston.transports.File({
            filename: path.join(path.dirname(logFilePath), 'error.log'),
            level: 'error',
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    ];

    // Add console transport for development
    if (process.env.NODE_ENV !== 'production') {
        transports.push(
            new winston.transports.Console({
                level: logLevel,
                format: consoleFormat
            })
        );
    }

    return winston.createLogger({
        level: logLevel,
        format: logFormat,
        transports,
        // Handle exceptions and rejections
        exceptionHandlers: [
            new winston.transports.File({ 
                filename: path.join(path.dirname(logFilePath), 'exceptions.log') 
            })
        ],
        rejectionHandlers: [
            new winston.transports.File({ 
                filename: path.join(path.dirname(logFilePath), 'rejections.log') 
            })
        ]
    });
};

/**
 * Log user action for audit purposes
 * Logs user actions with structured data for audit trail
 * 
 * @param {string} userId - User ID performing the action
 * @param {string} action - Action being performed
 * @param {Object} details - Additional details about the action
 * @param {string} ipAddress - IP address of the user
 */
const logUserAction = (userId, action, details = {}, ipAddress = 'unknown') => {
    logger.info('User Action', {
        userId,
        action,
        details,
        ipAddress,
        timestamp: new Date().toISOString(),
        type: 'USER_ACTION'
    });
};

// Create logger instance
const logger = createLogger();

// Export logger and utility functions
logger.logUserAction = logUserAction;
module.exports = logger;

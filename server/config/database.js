/**
 * Database configuration and connection setup for MongoDB
 * Uses Mongoose ODM for database operations
 * 
 * @description Establishes connection to MongoDB using connection string from environment variables
 * @returns {Promise} Promise that resolves when database connection is established
 * @throws {Error} Throws error if database connection fails
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB database
 * Configures mongoose settings and establishes connection
 * 
 * @returns {Promise<void>} Promise that resolves when connected
 * @throws {Error} Database connection error
 */
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            // No MongoDB URI provided, skipping database connection
            return;
        }

        // Mongoose connection options
        const options = {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        };

        // Connecting to MongoDB
        const conn = await mongoose.connect(mongoURI, options);

        // MongoDB Connected successfully
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            // MongoDB reconnected
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            // MongoDB connection closed through app termination
            process.exit(0);
        });

    } catch (error) {
        console.error('Database connection failed:', error.message);
        throw error;
    }
};

module.exports = connectDB;

/**
 * Task scheduler for automatic expired task updates
 * Provides background jobs for maintaining task state consistency
 *
 * @description Handles periodic tasks like marking overdue tasks as expired
 */

const Task = require('../models/Task');
const logger = require('./logger');

/**
 * Update all expired tasks across all users
 * This function runs periodically to mark overdue tasks as expired
 *
 * @returns {Promise<Object>} Result of the update operation
 */
async function updateAllExpiredTasks() {
    try {
        const result = await Task.updateExpiredTasks();

        if (result.modifiedCount > 0) {
            logger.info(`Updated ${result.modifiedCount} expired tasks`, {
                modifiedCount: result.modifiedCount,
                expiredTaskIds: result.expiredTaskIds
            });
        }

        return result;
    } catch (error) {
        logger.error('Error updating expired tasks:', error);
        throw error;
    }
}

/**
 * Start the scheduler with configurable intervals
 * Sets up periodic execution of expired task updates
 *
 * @param {number} intervalMinutes - Interval in minutes between updates (default: 60)
 */
function startScheduler(intervalMinutes = 60) {
    const intervalMs = intervalMinutes * 60 * 1000;

    logger.info(`Starting expired task scheduler with ${intervalMinutes} minute intervals`);

    // Run immediately on startup
    updateAllExpiredTasks().catch(error => {
        logger.error('Initial expired task update failed:', error);
    });

    // Schedule periodic updates
    const intervalId = setInterval(() => {
        updateAllExpiredTasks().catch(error => {
            logger.error('Scheduled expired task update failed:', error);
        });
    }, intervalMs);

    // Return cleanup function
    return () => {
        clearInterval(intervalId);
        logger.info('Expired task scheduler stopped');
    };
}

/**
 * Stop all scheduled tasks
 * Cleans up running intervals
 */
function stopScheduler() {
    // This will be implemented when we have multiple schedulers
    logger.info('Scheduler stopped');
}

module.exports = {
    updateAllExpiredTasks,
    startScheduler,
    stopScheduler
};
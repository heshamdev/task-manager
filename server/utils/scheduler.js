/**
 * Task scheduler for automatic expired task updates
 * Provides background jobs for maintaining task state consistency
 *
 * @description Handles periodic tasks like marking overdue tasks as expired
 */

const Task = require('../models/Task');
const logger = require('./logger');

/**
 * Update all overdue tasks across all users
 * This function runs periodically to mark overdue tasks as overdue
 *
 * @returns {Promise<Object>} Result of the update operation
 */
async function updateAllOverdueTasks() {
    try {
        const result = await Task.updateOverdueTasks();

        if (result.modifiedCount > 0) {
            logger.info(`Updated ${result.modifiedCount} overdue tasks`, {
                modifiedCount: result.modifiedCount,
                overdueTaskIds: result.overdueTaskIds
            });
        }

        return result;
    } catch (error) {
        logger.error('Error updating overdue tasks:', error);
        throw error;
    }
}

/**
 * Start the scheduler with configurable intervals
 * Sets up periodic execution of overdue task updates
 *
 * @param {number} intervalMinutes - Interval in minutes between updates (default: 60)
 */
function startScheduler(intervalMinutes = 60) {
    const intervalMs = intervalMinutes * 60 * 1000;

    logger.info(`Starting overdue task scheduler with ${intervalMinutes} minute intervals`);

    // Run immediately on startup
    updateAllOverdueTasks().catch(error => {
        logger.error('Initial overdue task update failed:', error);
    });

    // Schedule periodic updates
    const intervalId = setInterval(() => {
        updateAllOverdueTasks().catch(error => {
            logger.error('Scheduled overdue task update failed:', error);
        });
    }, intervalMs);

    // Return cleanup function
    return () => {
        clearInterval(intervalId);
        logger.info('Overdue task scheduler stopped');
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
    updateAllOverdueTasks,
    startScheduler,
    stopScheduler
};
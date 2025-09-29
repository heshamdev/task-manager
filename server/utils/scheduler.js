/**
 * Enhanced Task scheduler for automatic overdue task updates
 * Provides intelligent background jobs for maintaining task state consistency
 *
 * @description Handles periodic tasks like marking overdue tasks with smart frequency adjustment
 */

const Task = require('../models/Task');
const logger = require('./logger');

// Scheduler state
let schedulerIntervals = {
    main: null,
    frequent: null
};

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
 * Get the next due date from all active tasks
 * Used to determine optimal scheduling frequency
 *
 * @returns {Promise<Date|null>} Next due date or null if no tasks with due dates
 */
async function getNextDueDate() {
    try {
        const nextTask = await Task.findOne({
            status: 'active',
            dueDate: { $ne: null, $gte: new Date() }
        }).sort({ dueDate: 1 }).select('dueDate');

        return nextTask ? nextTask.dueDate : null;
    } catch (error) {
        logger.error('Error getting next due date:', error);
        return null;
    }
}

/**
 * Calculate optimal check frequency based on upcoming due dates
 * Returns check interval in milliseconds
 *
 * @param {Date} nextDueDate - Next due date
 * @returns {number} Interval in milliseconds
 */
function calculateOptimalInterval(nextDueDate) {
    if (!nextDueDate) {
        return 60 * 60 * 1000; // 1 hour if no due dates
    }

    const now = new Date();
    const timeUntilDue = nextDueDate.getTime() - now.getTime();
    const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);

    if (hoursUntilDue <= 1) {
        return 5 * 60 * 1000; // 5 minutes if due within an hour
    } else if (hoursUntilDue <= 6) {
        return 15 * 60 * 1000; // 15 minutes if due within 6 hours
    } else if (hoursUntilDue <= 24) {
        return 30 * 60 * 1000; // 30 minutes if due within a day
    } else {
        return 60 * 60 * 1000; // 1 hour for everything else
    }
}

/**
 * Start the enhanced scheduler with intelligent intervals
 * Sets up dynamic scheduling based on upcoming due dates
 *
 * @param {number} baseIntervalMinutes - Base interval in minutes (default: 30)
 */
async function startScheduler(baseIntervalMinutes = 30) {
    logger.info(`Starting enhanced overdue task scheduler with ${baseIntervalMinutes} minute base intervals`);

    // Run immediately on startup
    await updateAllOverdueTasks().catch(error => {
        logger.error('Initial overdue task update failed:', error);
    });

    // Start the adaptive scheduler
    await scheduleNextCheck();

    // Also maintain a regular check every base interval as fallback
    const baseIntervalMs = baseIntervalMinutes * 60 * 1000;
    schedulerIntervals.main = setInterval(async () => {
        await updateAllOverdueTasks().catch(error => {
            logger.error('Scheduled overdue task update failed:', error);
        });
        // Reschedule based on new task states
        await scheduleNextCheck();
    }, baseIntervalMs);

    logger.info('Enhanced scheduler started with adaptive intervals');

    // Return cleanup function
    return () => {
        stopScheduler();
    };
}

/**
 * Schedule the next check based on upcoming due dates
 * Uses intelligent timing to check more frequently when tasks are due soon
 */
async function scheduleNextCheck() {
    try {
        // Clear any existing frequent scheduler
        if (schedulerIntervals.frequent) {
            clearTimeout(schedulerIntervals.frequent);
            schedulerIntervals.frequent = null;
        }

        const nextDueDate = await getNextDueDate();
        const interval = calculateOptimalInterval(nextDueDate);

        if (nextDueDate) {
            const now = new Date();
            const timeUntilDue = nextDueDate.getTime() - now.getTime();
            const hoursUntilDue = Math.round(timeUntilDue / (1000 * 60 * 60) * 10) / 10;

            logger.info(`Next task due in ${hoursUntilDue} hours, scheduling check in ${interval / (1000 * 60)} minutes`);
        }

        schedulerIntervals.frequent = setTimeout(async () => {
            await updateAllOverdueTasks().catch(error => {
                logger.error('Adaptive scheduled update failed:', error);
            });
            // Schedule the next adaptive check
            await scheduleNextCheck();
        }, interval);
    } catch (error) {
        logger.error('Error scheduling next check:', error);
    }
}

/**
 * Trigger an immediate check for overdue tasks
 * Useful when new tasks are created or due dates are updated
 *
 * @returns {Promise<Object>} Result of the update operation
 */
async function triggerImmediateCheck() {
    logger.info('Triggering immediate overdue task check');
    const result = await updateAllOverdueTasks();
    // Reschedule next check based on updated task states
    await scheduleNextCheck();
    return result;
}

/**
 * Stop all scheduled tasks
 * Cleans up running intervals and timeouts
 */
function stopScheduler() {
    if (schedulerIntervals.main) {
        clearInterval(schedulerIntervals.main);
        schedulerIntervals.main = null;
    }
    if (schedulerIntervals.frequent) {
        clearTimeout(schedulerIntervals.frequent);
        schedulerIntervals.frequent = null;
    }
    logger.info('Enhanced scheduler stopped - all intervals cleared');
}

module.exports = {
    updateAllOverdueTasks,
    startScheduler,
    stopScheduler,
    triggerImmediateCheck,
    getNextDueDate,
    calculateOptimalInterval
};
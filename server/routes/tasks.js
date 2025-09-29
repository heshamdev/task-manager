/**
 * Task routes for CRUD operations on user tasks
 * Handles task creation, reading, updating, and deletion with proper authentication
 * 
 * @description Provides endpoints for task management with filtering and statistics
 */

const express = require('express');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/auth');
const { validateTaskCreation, validateTaskUpdate } = require('../middleware/validation');
const logger = require('../utils/logger');
const { logRequestAction } = require('../middleware/logging');
const { triggerImmediateCheck } = require('../utils/scheduler');

const router = express.Router();

// Apply authentication to all task routes
router.use(authenticateToken);

/**
 * Get all tasks for authenticated user
 * Retrieves tasks with optional filtering by status and priority
 * 
 * @route GET /api/tasks
 * @query {string} status - Filter by task status (pending, completed)
 * @query {string} priority - Filter by task priority (low, medium, high)
 * @query {number} page - Page number for pagination (default: 1)
 * @query {number} limit - Number of tasks per page (default: 10)
 * @returns {Object} Paginated list of tasks with metadata
 */
router.get('/', async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 5 } = req.query;
        const userId = req.userId;

        // Build filter object
        const query = { userId };
        if (status && ['active', 'completed', 'overdue'].includes(status)) {
            query.status = status;
        }
        if (priority && ['low', 'medium', 'high'].includes(priority)) {
            query.priority = priority;
        }

        // Calculate pagination
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 5;
        const skip = (pageNum - 1) * limitNum;

        // Get tasks with filters and pagination
        const tasks = await Task.find(query)
            .sort({ dueDate: 1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .exec();

        // Get total count for pagination
        const totalTasks = await Task.countDocuments(query);
        const totalPages = Math.ceil(totalTasks / limitNum);

        // Log view tasks action
        await logRequestAction(req, 'VIEW_TASKS', {
            filtersApplied: { status, priority },
            pagination: { page: pageNum, limit: limitNum },
            resultsCount: tasks.length
        }, res);

        res.json({
            success: true,
            data: {
                tasks,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalTasks,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            }
        });

    } catch (error) {
        logger.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error'),
            ...(process.env.NODE_ENV === 'development' && error ? { stack: error.stack } : {})
        });
    }
});

/**
 * Update overdue tasks for authenticated user
 * Finds tasks that are overdue and marks them as overdue
 *
 * @route POST /api/tasks/update-overdue
 * @returns {Object} Result of overdue tasks update operation
 */
router.post('/update-overdue', async (req, res) => {
    try {
        const userId = req.userId;
        const result = await Task.updateOverdueTasks(userId);

        // Log the action with enhanced logging
        await logRequestAction(req, 'UPDATE_OVERDUE_TASKS', {
            modifiedCount: result.modifiedCount,
            overdueTaskIds: result.overdueTaskIds
        });

        res.json({
            success: true,
            message: req.t('tasks.overdueTasksUpdated') || 'Overdue tasks updated successfully',
            data: {
                modifiedCount: result.modifiedCount,
                overdueTaskIds: result.overdueTaskIds
            }
        });

    } catch (error) {
        logger.error('Update overdue tasks error:', error);
        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error')
        });
    }
});

/**
 * Get filtered tasks with advanced filtering options
 * Professional filtering system with priority, date logic, and multiple criteria
 *
 * @route GET /api/tasks/filter
 * @query {string} status - Filter by status (active, completed, overdue)
 * @query {string} priority - Filter by priority (low, medium, high)
 * @query {string} dateFilter - Filter by date (today, tomorrow, thisWeek, overdue, upcoming)
 * @query {string} search - Search in title and description
 * @query {string} sortBy - Sort by field (dueDate, priority, createdAt, updatedAt)
 * @query {string} sortOrder - Sort order (asc, desc)
 * @returns {Object} Filtered and sorted tasks
 */
router.get('/filter', async (req, res) => {
    try {
        const {
            status,
            priority,
            dateFilter,
            search,
            sortBy = 'dueDate',
            sortOrder = 'asc',
            page = 1,
            limit = 5
        } = req.query;
        const userId = req.userId;

        // Build base query
        const query = { userId };

        // Status filter
        if (status && ['active', 'completed', 'overdue'].includes(status)) {
            query.status = status;
        }

        // Priority filter
        if (priority && ['low', 'medium', 'high'].includes(priority)) {
            query.priority = priority;
        }

        // Date-based filters
        if (dateFilter) {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
            const startOfTomorrow = endOfToday;
            const endOfTomorrow = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000);
            const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 24 * 60 * 60 * 1000);
            const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

            switch (dateFilter) {
                case 'today':
                    query.dueDate = {
                        $gte: startOfToday,
                        $lt: endOfToday
                    };
                    break;
                case 'tomorrow':
                    query.dueDate = {
                        $gte: startOfTomorrow,
                        $lt: endOfTomorrow
                    };
                    break;
                case 'thisWeek':
                    query.dueDate = {
                        $gte: startOfWeek,
                        $lt: endOfWeek
                    };
                    break;
                case 'overdue':
                    query.dueDate = { $lt: now };
                    query.status = { $ne: 'completed' };
                    break;
                case 'upcoming':
                    query.dueDate = { $gte: now };
                    break;
                case 'noDueDate':
                    query.dueDate = null;
                    break;
            }
        }

        // Search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sortOptions = {};
        if (sortBy === 'priority') {
            // Custom priority sorting: high > medium > low
            sortOptions.priority = sortOrder === 'asc' ? 1 : -1;
        } else {
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }

        // Add secondary sort by createdAt for consistent ordering
        if (sortBy !== 'createdAt') {
            sortOptions.createdAt = -1;
        }

        // Calculate pagination
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 5;
        const skip = (pageNum - 1) * limitNum;

        // Execute query with pagination
        const tasks = await Task.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .exec();

        // Get total count for pagination
        const totalTasks = await Task.countDocuments(query);
        const totalPages = Math.ceil(totalTasks / limitNum);

        // Log filter tasks action
        await logRequestAction(req, 'FILTER_TASKS', {
            filtersApplied: { status, priority, dateFilter, search },
            sorting: { sortBy, sortOrder },
            pagination: { page: pageNum, limit: limitNum },
            resultsCount: tasks.length,
            totalMatching: totalTasks
        }, res);

        res.json({
            success: true,
            data: {
                tasks,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalTasks,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                },
                filters: {
                    status,
                    priority,
                    dateFilter,
                    search,
                    sortBy,
                    sortOrder
                }
            }
        });

    } catch (error) {
        logger.error('Get filtered tasks error:', error);
        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error')
        });
    }
});

/**
 * Get task statistics for authenticated user
 * Returns count of tasks by status and other metrics
 *
 * @route GET /api/tasks/stats
 * @returns {Object} Task statistics including counts by status
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await Task.getTaskStats(userId);

        // Log view task stats action
        await logRequestAction(req, 'VIEW_TASK_STATS', {
            statsReturned: Object.keys(stats)
        }, res);

        res.json({
            success: true,
            data: { stats }
        });

    } catch (error) {
        logger.error('Get task stats error:', error);
        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error')
        });
    }
});

/**
 * Get single task by ID
 * Retrieves specific task for authenticated user
 * 
 * @route GET /api/tasks/:id
 * @param {string} id - Task ID
 * @returns {Object} Task data
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const task = await Task.findOne({ _id: id, userId });
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: req.t('tasks.taskNotFound') || 'Task not found'
            });
        }

        // Log view single task action
        await logRequestAction(req, 'VIEW_TASK', {
            taskId: task._id.toString(),
            title: task.title
        }, res);

        res.json({
            success: true,
            data: { task }
        });

    } catch (error) {
        logger.error('Get task error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: req.t('tasks.invalidTaskId') || 'Invalid task ID'
            });
        }

        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error')
        });
    }
});

/**
 * Create new task
 * Creates a new task for authenticated user
 * 
 * @route POST /api/tasks
 * @param {string} title - Task title
 * @param {string} description - Task description (optional)
 * @param {string} priority - Task priority (low, medium, high)
 * @param {string} dueDate - Task due date (optional)
 * @returns {Object} Created task data
 */
router.post('/', validateTaskCreation, async (req, res) => {
    try {
        const { title, description, priority, dueDate } = req.body;
        const userId = req.userId;

        const task = new Task({
            title,
            description,
            priority: priority || 'medium',
            dueDate: dueDate || null,
            userId
        });

        await task.save();

        // Trigger immediate due date check if task has a due date
        if (task.dueDate) {
            try {
                await triggerImmediateCheck();
                logger.info(`Triggered immediate due date check after creating task: ${task.title}`);
            } catch (error) {
                logger.error('Failed to trigger immediate due date check after task creation:', error);
            }
        }

        // Log task creation with enhanced logging
        await logRequestAction(req, 'CREATE_TASK', {
            taskId: task._id.toString(),
            title: task.title,
            hasDueDate: !!task.dueDate
        });

        res.status(201).json({
            success: true,
            message: req.t('tasks.taskCreated') || 'Task created successfully',
            data: { task }
        });

    } catch (error) {
        logger.error('Create task error:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: req.t('validation.validationFailed') || 'Validation failed',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error')
        });
    }
});

/**
 * Update task
 * Updates existing task for authenticated user
 * 
 * @route PUT /api/tasks/:id
 * @param {string} id - Task ID
 * @param {string} title - Updated task title
 * @param {string} description - Updated task description
 * @param {string} status - Updated task status (pending, completed)
 * @param {string} priority - Updated task priority
 * @param {string} dueDate - Updated due date
 * @returns {Object} Updated task data
 */
router.put('/:id', validateTaskUpdate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const updateData = req.body;

        // Find the existing task first
        const existingTask = await Task.findOne({ _id: id, userId });

        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: req.t('tasks.taskNotFound') || 'Task not found'
            });
        }

        // Check if due date is being updated and handle overdue status
        if (updateData.dueDate !== undefined) {
            const now = new Date();
            const newDueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;

            // If task is currently overdue and new due date is in the future, mark as active
            if (existingTask.status === 'overdue' && newDueDate && newDueDate > now) {
                updateData.status = 'active';
            }
            // If task is active and new due date is in the past, mark as overdue
            else if (existingTask.status === 'active' && newDueDate && newDueDate < now) {
                updateData.status = 'overdue';
            }
        }

        // Find and update task
        const task = await Task.findOneAndUpdate(
            { _id: id, userId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: req.t('tasks.taskNotFound') || 'Task not found'
            });
        }

        // Trigger immediate due date check if due date was updated
        if (updateData.dueDate !== undefined) {
            try {
                await triggerImmediateCheck();
                logger.info(`Triggered immediate due date check after updating task: ${task.title}`);
            } catch (error) {
                logger.error('Failed to trigger immediate due date check after task update:', error);
            }
        }

        // Log task update with enhanced logging
        await logRequestAction(req, 'UPDATE_TASK', {
            taskId: task._id.toString(),
            title: task.title,
            updatedFields: Object.keys(updateData),
            dueDateUpdated: updateData.dueDate !== undefined
        });

        res.json({
            success: true,
            message: req.t('tasks.taskUpdated') || 'Task updated successfully',
            data: { task }
        });

    } catch (error) {
        logger.error('Update task error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: req.t('tasks.invalidTaskId') || 'Invalid task ID'
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: req.t('validation.validationFailed') || 'Validation failed',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error')
        });
    }
});

/**
 * Toggle task status
 * Toggles task between pending and completed status
 * 
 * @route PATCH /api/tasks/:id/toggle
 * @param {string} id - Task ID
 * @returns {Object} Updated task data
 */
router.patch('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const task = await Task.findOne({ _id: id, userId });
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: req.t('tasks.taskNotFound') || 'Task not found'
            });
        }

        // Toggle status
        const updatedTask = task.status === 'completed'
            ? await task.markActive()
            : await task.markCompleted();

        // Log task status toggle with enhanced logging
        await logRequestAction(req, 'TOGGLE_TASK_STATUS', {
            taskId: task._id.toString(),
            title: task.title,
            newStatus: updatedTask.status
        });

        res.json({
            success: true,
            message: req.t('tasks.taskStatusToggled') || 'Task status updated successfully',
            data: { task: updatedTask }
        });

    } catch (error) {
        logger.error('Toggle task status error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: req.t('tasks.invalidTaskId') || 'Invalid task ID'
            });
        }

        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error')
        });
    }
});

/**
 * Delete task
 * Deletes task for authenticated user
 * 
 * @route DELETE /api/tasks/:id
 * @param {string} id - Task ID
 * @returns {Object} Success response
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const task = await Task.findOneAndDelete({ _id: id, userId });
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: req.t('tasks.taskNotFound') || 'Task not found'
            });
        }

        // Log task deletion with enhanced logging
        await logRequestAction(req, 'DELETE_TASK', {
            taskId: id,
            title: task.title
        });

        res.json({
            success: true,
            message: req.t('tasks.taskDeleted') || 'Task deleted successfully'
        });

    } catch (error) {
        logger.error('Delete task error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: req.t('tasks.invalidTaskId') || 'Invalid task ID'
            });
        }

        res.status(500).json({
            success: false,
            message: (process.env.NODE_ENV === 'development' && error && error.message) ? error.message : (req.t('errors.serverError') || 'Internal server error')
        });
    }
});

module.exports = router;

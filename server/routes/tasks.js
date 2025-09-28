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
        const { status, priority, page = 1, limit = 10 } = req.query;
        const userId = req.userId;

        // Build filter object
        const query = { userId };
        if (status && ['pending', 'completed'].includes(status)) {
            query.status = status;
        }
        if (priority && ['low', 'medium', 'high'].includes(priority)) {
            query.priority = priority;
        }

        // Calculate pagination
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        // Get tasks with filters and pagination
        const tasks = await Task.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .exec();

        // Get total count for pagination
        const totalTasks = await Task.countDocuments(query);
        const totalPages = Math.ceil(totalTasks / limitNum);

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

        // Log task creation
        logger.logUserAction(
            userId,
            'CREATE_TASK',
            { taskId: task._id.toString(), title: task.title },
            req.ip
        );

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

        // Log task update
        logger.logUserAction(
            userId,
            'UPDATE_TASK',
            { 
                taskId: task._id.toString(), 
                title: task.title,
                updatedFields: Object.keys(updateData)
            },
            req.ip
        );

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
            ? await task.markPending()
            : await task.markCompleted();

        // Log task status toggle
        logger.logUserAction(
            userId,
            'TOGGLE_TASK_STATUS',
            { 
                taskId: task._id.toString(), 
                title: task.title,
                newStatus: updatedTask.status
            },
            req.ip
        );

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

        // Log task deletion
        logger.logUserAction(
            userId,
            'DELETE_TASK',
            { taskId: id, title: task.title },
            req.ip
        );

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

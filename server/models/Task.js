/**
 * Task model for MongoDB using Mongoose
 * Defines task schema with CRUD operations and user association
 * 
 * @description Task model with title, description, status, priority, and user relationship
 * @returns {Object} Mongoose Task model
 */

const mongoose = require('mongoose');

/**
 * Task schema definition
 * Defines structure and validation for task documents
 */
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [100, 'Task title cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Task description cannot exceed 500 characters'],
        default: ''
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'completed', 'expired'],
            message: 'Status must be pending, completed, or expired'
        },
        default: 'pending'
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high'],
            message: 'Priority must be low, medium, or high'
        },
        default: 'medium'
    },
    dueDate: {
        type: Date,
        default: null,
        validate: {
            validator: function(value) {
                // Due date should be in the future or null
                return !value || value > new Date();
            },
            message: 'Due date must be in the future'
        }
    },
    completedAt: {
        type: Date,
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

/**
 * Pre-save middleware to set completedAt timestamp
 * Automatically sets completedAt when task status changes to completed
 */
taskSchema.pre('save', function(next) {
    // Set completedAt when task is marked as completed
    if (this.isModified('status')) {
        if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        } else if (this.status === 'pending') {
            this.completedAt = null;
        }
    }
    next();
});

/**
 * Instance method to mark task as completed
 * Updates task status to completed and sets completion timestamp
 * 
 * @returns {Promise<Object>} Updated task document
 */
taskSchema.methods.markCompleted = async function() {
    this.status = 'completed';
    this.completedAt = new Date();
    return await this.save();
};

/**
 * Instance method to mark task as pending
 * Updates task status to pending and clears completion timestamp
 *
 * @returns {Promise<Object>} Updated task document
 */
taskSchema.methods.markPending = async function() {
    this.status = 'pending';
    this.completedAt = null;
    return await this.save();
};

/**
 * Instance method to mark task as expired
 * Updates task status to expired (for overdue tasks)
 *
 * @returns {Promise<Object>} Updated task document
 */
taskSchema.methods.markExpired = async function() {
    this.status = 'expired';
    return await this.save();
};

/**
 * Static method to find tasks by user ID
 * Retrieves all tasks for a specific user with optional filtering
 * 
 * @param {string} userId - User ID to filter tasks
 * @param {Object} filters - Optional filters (status, priority)
 * @returns {Promise<Array>} Array of task documents
 */
taskSchema.statics.findByUserId = function(userId, filters = {}) {
    const query = { userId };
    
    // Add status filter if provided
    if (filters.status) {
        query.status = filters.status;
    }
    
    // Add priority filter if provided
    if (filters.priority) {
        query.priority = filters.priority;
    }
    
    return this.find(query).sort({ createdAt: -1 });
};

/**
 * Static method to get task statistics for a user
 * Returns count of tasks by status for a specific user
 *
 * @param {string} userId - User ID to get statistics for
 * @returns {Promise<Object>} Object with task counts by status
 */
taskSchema.statics.getTaskStats = async function(userId) {
    let objectId
    try {
        objectId = new mongoose.Types.ObjectId(userId)
    } catch (e) {
        return { total: 0, pending: 0, completed: 0, expired: 0 }
    }
    const stats = await this.aggregate([
        { $match: { userId: objectId } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // Format the results
    const result = {
        total: 0,
        pending: 0,
        completed: 0,
        expired: 0
    };

    stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
    });

    return result;
};

/**
 * Static method to find and update expired tasks
 * Finds tasks that are overdue and marks them as expired
 *
 * @param {string} userId - User ID to update expired tasks for (optional)
 * @returns {Promise<Object>} Object with count of updated tasks and updated task IDs
 */
taskSchema.statics.updateExpiredTasks = async function(userId = null) {
    const now = new Date();
    const query = {
        status: 'pending',
        dueDate: { $ne: null, $lt: now }
    };

    // If userId is provided, filter by user
    if (userId) {
        query.userId = new mongoose.Types.ObjectId(userId);
    }

    // Find expired tasks
    const expiredTasks = await this.find(query);

    // Update tasks to expired status
    const updateResult = await this.updateMany(query, { status: 'expired' });

    return {
        modifiedCount: updateResult.modifiedCount,
        expiredTaskIds: expiredTasks.map(task => task._id.toString()),
        expiredTasks: expiredTasks
    };
};

/**
 * Virtual field for overdue status
 * Determines if task is overdue based on due date and completion status
 */
taskSchema.virtual('isOverdue').get(function() {
    if (!this.dueDate || this.status === 'completed') {
        return false;
    }
    return new Date() > this.dueDate;
});

/**
 * Virtual field for days until due
 * Calculates number of days until task is due
 */
taskSchema.virtual('daysUntilDue').get(function() {
    if (!this.dueDate || this.status === 'completed') {
        return null;
    }
    const today = new Date();
    const diffTime = this.dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, priority: 1 });

module.exports = mongoose.model('Task', taskSchema);

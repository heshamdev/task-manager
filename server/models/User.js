/**
 * User model for MongoDB using Mongoose
 * Defines user schema with authentication fields and methods
 * 
 * @description User model with email/password authentication, timestamps, and password hashing
 * @returns {Object} Mongoose User model
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User schema definition
 * Defines structure and validation for user documents
 */
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't include password in queries by default
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    isAdmin: {
        type: Boolean,
        default: false,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

/**
 * Pre-save middleware to hash password
 * Automatically hashes password before saving to database
 * Only runs when password is modified
 */
userSchema.pre('save', async function(next) {
    // Only hash password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Hash password with configurable cost (default 12)
        const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
        const salt = await bcrypt.genSalt(rounds);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Instance method to compare password
 * Compares provided password with hashed password in database
 * 
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

/**
 * Instance method to update last login timestamp
 * Updates the lastLogin field with current timestamp
 * 
 * @returns {Promise<Object>} Updated user document
 */
userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    return await this.save();
};

/**
 * Static method to find user by email
 * Finds user by email address including password field
 * 
 * @param {string} email - Email address to search for
 * @returns {Promise<Object|null>} User document or null if not found
 */
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email }).select('+password');
};

/**
 * Virtual field for task count
 * Provides count of tasks associated with this user
 */
userSchema.virtual('taskCount', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'userId',
    count: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);

/**
 * Test setup file for Jest
 * Configures test environment and global test utilities
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.close();
  
  // Stop the in-memory MongoDB instance
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clean up database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test utilities
global.testUtils = {
  /**
   * Create a test user
   * @param {Object} userData - User data to create
   * @returns {Promise<Object>} Created user
   */
  async createTestUser(userData = {}) {
    const User = require('../server/models/User');
    const defaultUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      ...userData
    };
    
    const user = new User(defaultUser);
    await user.save();
    return user;
  },

  /**
   * Create a test task
   * @param {Object} taskData - Task data to create
   * @param {string} userId - User ID to associate with task
   * @returns {Promise<Object>} Created task
   */
  async createTestTask(taskData = {}, userId) {
    const Task = require('../server/models/Task');
    const defaultTask = {
      title: 'Test Task',
      description: 'Test task description',
      status: 'pending',
      priority: 'medium',
      userId: userId,
      ...taskData
    };
    
    const task = new Task(defaultTask);
    await task.save();
    return task;
  },

  /**
   * Generate a valid JWT token for testing
   * @param {string} userId - User ID to generate token for
   * @returns {string} JWT token
   */
  generateTestToken(userId = '507f1f77bcf86cd799439011') {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h'
    });
  }
};

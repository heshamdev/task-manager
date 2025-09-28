/**
 * Task Model Tests
 * Tests task model functionality including validation, methods, and middleware
 */

const Task = require('../../server/models/Task');
const User = require('../../server/models/User');

describe('Task Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await global.testUtils.createTestUser();
  });

  describe('Schema Validation', () => {
    test('should create a valid task with all required fields', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        status: 'pending',
        priority: 'medium',
        userId: testUser._id
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask._id).toBeDefined();
      expect(savedTask.title).toBe(taskData.title);
      expect(savedTask.description).toBe(taskData.description);
      expect(savedTask.status).toBe(taskData.status);
      expect(savedTask.priority).toBe(taskData.priority);
      expect(savedTask.userId.toString()).toBe(testUser._id.toString());
      expect(savedTask.createdAt).toBeDefined();
      expect(savedTask.updatedAt).toBeDefined();
    });

    test('should require title field', async () => {
      const task = new Task({
        description: 'Test description',
        userId: testUser._id
      });

      await expect(task.save()).rejects.toThrow('Task title is required');
    });

    test('should require userId field', async () => {
      const task = new Task({
        title: 'Test Task',
        description: 'Test description'
      });

      await expect(task.save()).rejects.toThrow('User ID is required');
    });

    test('should enforce title maximum length', async () => {
      const task = new Task({
        title: 'A'.repeat(101),
        userId: testUser._id
      });

      await expect(task.save()).rejects.toThrow('Task title cannot exceed 100 characters');
    });

    test('should enforce description maximum length', async () => {
      const task = new Task({
        title: 'Test Task',
        description: 'A'.repeat(501),
        userId: testUser._id
      });

      await expect(task.save()).rejects.toThrow('Task description cannot exceed 500 characters');
    });

    test('should validate status enum values', async () => {
      const task = new Task({
        title: 'Test Task',
        status: 'invalid-status',
        userId: testUser._id
      });

      await expect(task.save()).rejects.toThrow('Status must be either pending or completed');
    });

    test('should validate priority enum values', async () => {
      const task = new Task({
        title: 'Test Task',
        priority: 'invalid-priority',
        userId: testUser._id
      });

      await expect(task.save()).rejects.toThrow('Priority must be low, medium, or high');
    });

    test('should set default values correctly', async () => {
      const task = new Task({
        title: 'Test Task',
        userId: testUser._id
      });

      const savedTask = await task.save();

      expect(savedTask.status).toBe('pending');
      expect(savedTask.priority).toBe('medium');
      expect(savedTask.description).toBe('');
      expect(savedTask.dueDate).toBeNull();
      expect(savedTask.completedAt).toBeNull();
    });

    test('should validate due date is in the future', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const task = new Task({
        title: 'Test Task',
        dueDate: pastDate,
        userId: testUser._id
      });

      await expect(task.save()).rejects.toThrow('Due date must be in the future');
    });

    test('should allow null due date', async () => {
      const task = new Task({
        title: 'Test Task',
        dueDate: null,
        userId: testUser._id
      });

      const savedTask = await task.save();
      expect(savedTask.dueDate).toBeNull();
    });

    test('should allow future due date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const task = new Task({
        title: 'Test Task',
        dueDate: futureDate,
        userId: testUser._id
      });

      const savedTask = await task.save();
      expect(savedTask.dueDate).toEqual(futureDate);
    });
  });

  describe('Pre-save Middleware', () => {
    test('should set completedAt when status changes to completed', async () => {
      const task = new Task({
        title: 'Test Task',
        status: 'pending',
        userId: testUser._id
      });

      await task.save();
      expect(task.completedAt).toBeNull();

      task.status = 'completed';
      await task.save();

      expect(task.completedAt).toBeDefined();
      expect(task.completedAt).toBeInstanceOf(Date);
    });

    test('should clear completedAt when status changes to pending', async () => {
      const task = new Task({
        title: 'Test Task',
        status: 'completed',
        userId: testUser._id
      });

      await task.save();
      expect(task.completedAt).toBeDefined();

      task.status = 'pending';
      await task.save();

      expect(task.completedAt).toBeNull();
    });

    test('should not modify completedAt if status is not changed', async () => {
      const task = new Task({
        title: 'Test Task',
        status: 'completed',
        userId: testUser._id
      });

      await task.save();
      const originalCompletedAt = task.completedAt;

      task.title = 'Updated Task';
      await task.save();

      expect(task.completedAt).toEqual(originalCompletedAt);
    });
  });

  describe('Instance Methods', () => {
    let task;

    beforeEach(async () => {
      task = await global.testUtils.createTestTask({}, testUser._id);
    });

    test('markCompleted should set status to completed and set completedAt', async () => {
      expect(task.status).toBe('pending');
      expect(task.completedAt).toBeNull();

      const updatedTask = await task.markCompleted();

      expect(updatedTask.status).toBe('completed');
      expect(updatedTask.completedAt).toBeDefined();
      expect(updatedTask.completedAt).toBeInstanceOf(Date);
    });

    test('markPending should set status to pending and clear completedAt', async () => {
      task.status = 'completed';
      task.completedAt = new Date();
      await task.save();

      const updatedTask = await task.markPending();

      expect(updatedTask.status).toBe('pending');
      expect(updatedTask.completedAt).toBeNull();
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create multiple tasks for testing
      await global.testUtils.createTestTask({ title: 'Task 1', status: 'pending', priority: 'high' }, testUser._id);
      await global.testUtils.createTestTask({ title: 'Task 2', status: 'completed', priority: 'medium' }, testUser._id);
      await global.testUtils.createTestTask({ title: 'Task 3', status: 'pending', priority: 'low' }, testUser._id);
    });

    test('findByUserId should return all tasks for a user', async () => {
      const tasks = await Task.findByUserId(testUser._id);

      expect(tasks).toHaveLength(3);
      expect(tasks.every(task => task.userId.toString() === testUser._id.toString())).toBe(true);
    });

    test('findByUserId should filter by status', async () => {
      const pendingTasks = await Task.findByUserId(testUser._id, { status: 'pending' });
      const completedTasks = await Task.findByUserId(testUser._id, { status: 'completed' });

      expect(pendingTasks).toHaveLength(2);
      expect(completedTasks).toHaveLength(1);
      expect(pendingTasks.every(task => task.status === 'pending')).toBe(true);
      expect(completedTasks.every(task => task.status === 'completed')).toBe(true);
    });

    test('findByUserId should filter by priority', async () => {
      const highPriorityTasks = await Task.findByUserId(testUser._id, { priority: 'high' });
      const mediumPriorityTasks = await Task.findByUserId(testUser._id, { priority: 'medium' });

      expect(highPriorityTasks).toHaveLength(1);
      expect(mediumPriorityTasks).toHaveLength(1);
      expect(highPriorityTasks.every(task => task.priority === 'high')).toBe(true);
      expect(mediumPriorityTasks.every(task => task.priority === 'medium')).toBe(true);
    });

    test('findByUserId should filter by both status and priority', async () => {
      const tasks = await Task.findByUserId(testUser._id, { status: 'pending', priority: 'high' });

      expect(tasks).toHaveLength(1);
      expect(tasks[0].status).toBe('pending');
      expect(tasks[0].priority).toBe('high');
    });

    test('findByUserId should return empty array for non-existent user', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';
      const tasks = await Task.findByUserId(nonExistentUserId);

      expect(tasks).toHaveLength(0);
    });

    test('getTaskStats should return correct statistics', async () => {
      const stats = await Task.getTaskStats(testUser._id);

      expect(stats).toHaveProperty('total', 3);
      expect(stats).toHaveProperty('pending', 2);
      expect(stats).toHaveProperty('completed', 1);
    });

    test('getTaskStats should return zero stats for non-existent user', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';
      const stats = await Task.getTaskStats(nonExistentUserId);

      expect(stats).toHaveProperty('total', 0);
      expect(stats).toHaveProperty('pending', 0);
      expect(stats).toHaveProperty('completed', 0);
    });

    test('getTaskStats should handle invalid ObjectId', async () => {
      const stats = await Task.getTaskStats('invalid-id');

      expect(stats).toHaveProperty('total', 0);
      expect(stats).toHaveProperty('pending', 0);
      expect(stats).toHaveProperty('completed', 0);
    });
  });

  describe('Virtual Fields', () => {
    test('isOverdue should return false for completed tasks', async () => {
      const task = await global.testUtils.createTestTask({
        status: 'completed',
        dueDate: new Date(Date.now() - 86400000) // Yesterday
      }, testUser._id);

      expect(task.isOverdue).toBe(false);
    });

    test('isOverdue should return false for tasks without due date', async () => {
      const task = await global.testUtils.createTestTask({
        dueDate: null
      }, testUser._id);

      expect(task.isOverdue).toBe(false);
    });

    test('isOverdue should return true for overdue pending tasks', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const task = await global.testUtils.createTestTask({
        status: 'pending',
        dueDate: pastDate
      }, testUser._id);

      expect(task.isOverdue).toBe(true);
    });

    test('isOverdue should return false for future due date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const task = await global.testUtils.createTestTask({
        status: 'pending',
        dueDate: futureDate
      }, testUser._id);

      expect(task.isOverdue).toBe(false);
    });

    test('daysUntilDue should return null for completed tasks', async () => {
      const task = await global.testUtils.createTestTask({
        status: 'completed',
        dueDate: new Date(Date.now() + 86400000) // Tomorrow
      }, testUser._id);

      expect(task.daysUntilDue).toBeNull();
    });

    test('daysUntilDue should return null for tasks without due date', async () => {
      const task = await global.testUtils.createTestTask({
        dueDate: null
      }, testUser._id);

      expect(task.daysUntilDue).toBeNull();
    });

    test('daysUntilDue should return correct number of days', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const task = await global.testUtils.createTestTask({
        status: 'pending',
        dueDate: futureDate
      }, testUser._id);

      expect(task.daysUntilDue).toBe(5);
    });
  });

  describe('JSON Transformation', () => {
    test('toJSON should exclude __v field', async () => {
      const task = await global.testUtils.createTestTask({}, testUser._id);
      const taskJSON = task.toJSON();

      expect(taskJSON.__v).toBeUndefined();
      expect(taskJSON._id).toBeDefined();
      expect(taskJSON.title).toBeDefined();
    });
  });

  describe('Indexes', () => {
    test('should have required indexes', async () => {
      const indexes = await Task.collection.getIndexes();
      
      expect(indexes).toHaveProperty('userId_1_status_1');
      expect(indexes).toHaveProperty('userId_1_createdAt_-1');
      expect(indexes).toHaveProperty('userId_1_dueDate_1');
      expect(indexes).toHaveProperty('userId_1_priority_1');
    });
  });
});

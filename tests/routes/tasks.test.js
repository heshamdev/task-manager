/**
 * Tasks Routes Tests
 * Tests task management endpoints including CRUD operations and statistics
 */

const request = require('supertest');
const express = require('express');
const tasksRoutes = require('../../server/routes/tasks');
const Task = require('../../server/models/Task');
const User = require('../../server/models/User');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/tasks', tasksRoutes);

describe('Tasks Routes', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    testUser = await global.testUtils.createTestUser();
    authToken = global.testUtils.generateTestToken(testUser._id);
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await global.testUtils.createTestTask({ title: 'Task 1', status: 'pending' }, testUser._id);
      await global.testUtils.createTestTask({ title: 'Task 2', status: 'completed' }, testUser._id);
      await global.testUtils.createTestTask({ title: 'Task 3', status: 'pending' }, testUser._id);
    });

    test('should get all tasks for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tasks');
      expect(response.body.data.tasks).toHaveLength(3);
      expect(response.body.data.tasks.every(task => task.userId === testUser._id.toString())).toBe(true);
    });

    test('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(2);
      expect(response.body.data.tasks.every(task => task.status === 'pending')).toBe(true);
    });

    test('should filter tasks by priority', async () => {
      // Create tasks with different priorities
      await global.testUtils.createTestTask({ title: 'High Priority', priority: 'high' }, testUser._id);
      await global.testUtils.createTestTask({ title: 'Low Priority', priority: 'low' }, testUser._id);

      const response = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks.every(task => task.priority === 'high')).toBe(true);
    });

    test('should return error without authentication', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    test('should return empty array for user with no tasks', async () => {
      const newUser = await global.testUtils.createTestUser({
        email: 'newuser@example.com'
      });
      const newUserToken = global.testUtils.generateTestToken(newUser._id);

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(0);
    });
  });

  describe('POST /api/tasks', () => {
    test('should create a new task with valid data', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('task');
      expect(response.body.data.task.title).toBe(taskData.title);
      expect(response.body.data.task.description).toBe(taskData.description);
      expect(response.body.data.task.priority).toBe(taskData.priority);
      expect(response.body.data.task.userId).toBe(testUser._id.toString());
      expect(response.body.data.task.status).toBe('pending');

      // Verify task was created in database
      const task = await Task.findById(response.body.data.task._id);
      expect(task).toBeDefined();
      expect(task.title).toBe(taskData.title);
    });

    test('should create task with minimal required data', async () => {
      const taskData = {
        title: 'Minimal Task'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe(taskData.title);
      expect(response.body.data.task.status).toBe('pending');
      expect(response.body.data.task.priority).toBe('medium');
      expect(response.body.data.task.description).toBe('');
    });

    test('should return validation error for missing title', async () => {
      const taskData = {
        description: 'Task without title'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should return validation error for long title', async () => {
      const taskData = {
        title: 'A'.repeat(101)
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should return validation error for invalid priority', async () => {
      const taskData = {
        title: 'Test Task',
        priority: 'invalid-priority'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should return validation error for past due date', async () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      const taskData = {
        title: 'Test Task',
        dueDate: pastDate.toISOString()
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should return error without authentication', async () => {
      const taskData = {
        title: 'Test Task'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      testTask = await global.testUtils.createTestTask({}, testUser._id);
    });

    test('should get task by ID for authenticated user', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task._id).toBe(testTask._id.toString());
      expect(response.body.data.task.title).toBe(testTask.title);
    });

    test('should return error for non-existent task', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });

    test('should return error for task belonging to another user', async () => {
      const otherUser = await global.testUtils.createTestUser({
        email: 'other@example.com'
      });
      const otherUserTask = await global.testUtils.createTestTask({}, otherUser._id);

      const response = await request(app)
        .get(`/api/tasks/${otherUserTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });

    test('should return error without authentication', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      testTask = await global.testUtils.createTestTask({}, testUser._id);
    });

    test('should update task with valid data', async () => {
      const updateData = {
        title: 'Updated Task',
        description: 'Updated description',
        priority: 'high',
        status: 'completed'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe(updateData.title);
      expect(response.body.data.task.description).toBe(updateData.description);
      expect(response.body.data.task.priority).toBe(updateData.priority);
      expect(response.body.data.task.status).toBe(updateData.status);

      // Verify update in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.title).toBe(updateData.title);
      expect(updatedTask.completedAt).toBeDefined();
    });

    test('should return error for non-existent task', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const updateData = {
        title: 'Updated Task'
      };

      const response = await request(app)
        .put(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });

    test('should return error for task belonging to another user', async () => {
      const otherUser = await global.testUtils.createTestUser({
        email: 'other@example.com'
      });
      const otherUserTask = await global.testUtils.createTestTask({}, otherUser._id);

      const updateData = {
        title: 'Updated Task'
      };

      const response = await request(app)
        .put(`/api/tasks/${otherUserTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });

    test('should return validation error for invalid data', async () => {
      const updateData = {
        title: 'A'.repeat(101)
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should return error without authentication', async () => {
      const updateData = {
        title: 'Updated Task'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PATCH /api/tasks/:id/toggle', () => {
    let testTask;

    beforeEach(async () => {
      testTask = await global.testUtils.createTestTask({ status: 'pending' }, testUser._id);
    });

    test('should toggle task status from pending to completed', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${testTask._id}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.status).toBe('completed');
      expect(response.body.data.task.completedAt).toBeDefined();

      // Verify update in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.status).toBe('completed');
      expect(updatedTask.completedAt).toBeDefined();
    });

    test('should toggle task status from completed to pending', async () => {
      // First mark as completed
      testTask.status = 'completed';
      await testTask.save();

      const response = await request(app)
        .patch(`/api/tasks/${testTask._id}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.status).toBe('pending');
      expect(response.body.data.task.completedAt).toBeNull();

      // Verify update in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.status).toBe('pending');
      expect(updatedTask.completedAt).toBeNull();
    });

    test('should return error for non-existent task', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .patch(`/api/tasks/${nonExistentId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });

    test('should return error for task belonging to another user', async () => {
      const otherUser = await global.testUtils.createTestUser({
        email: 'other@example.com'
      });
      const otherUserTask = await global.testUtils.createTestTask({}, otherUser._id);

      const response = await request(app)
        .patch(`/api/tasks/${otherUserTask._id}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });

    test('should return error without authentication', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${testTask._id}/toggle`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      testTask = await global.testUtils.createTestTask({}, testUser._id);
    });

    test('should delete task for authenticated user', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Task deleted successfully');

      // Verify task was deleted from database
      const deletedTask = await Task.findById(testTask._id);
      expect(deletedTask).toBeNull();
    });

    test('should return error for non-existent task', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });

    test('should return error for task belonging to another user', async () => {
      const otherUser = await global.testUtils.createTestUser({
        email: 'other@example.com'
      });
      const otherUserTask = await global.testUtils.createTestTask({}, otherUser._id);

      const response = await request(app)
        .delete(`/api/tasks/${otherUserTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });

    test('should return error without authentication', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTask._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/tasks/stats', () => {
    beforeEach(async () => {
      // Create tasks with different statuses
      await global.testUtils.createTestTask({ title: 'Task 1', status: 'pending' }, testUser._id);
      await global.testUtils.createTestTask({ title: 'Task 2', status: 'completed' }, testUser._id);
      await global.testUtils.createTestTask({ title: 'Task 3', status: 'pending' }, testUser._id);
      await global.testUtils.createTestTask({ title: 'Task 4', status: 'completed' }, testUser._id);
    });

    test('should get task statistics for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats.total).toBe(4);
      expect(response.body.data.stats.pending).toBe(2);
      expect(response.body.data.stats.completed).toBe(2);
    });

    test('should return zero stats for user with no tasks', async () => {
      const newUser = await global.testUtils.createTestUser({
        email: 'newuser@example.com'
      });
      const newUserToken = global.testUtils.generateTestToken(newUser._id);

      const response = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.total).toBe(0);
      expect(response.body.data.stats.pending).toBe(0);
      expect(response.body.data.stats.completed).toBe(0);
    });

    test('should return error without authentication', async () => {
      const response = await request(app)
        .get('/api/tasks/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });
});

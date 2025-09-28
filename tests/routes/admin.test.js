/**
 * Admin Routes Tests
 * Tests admin-only endpoints including log access and authentication
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const adminRoutes = require('../../server/routes/admin');
const User = require('../../server/models/User');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Routes', () => {
  let adminUser, regularUser, adminToken, regularToken;

  beforeEach(async () => {
    // Create admin user
    adminUser = await global.testUtils.createTestUser({
      email: 'admin@example.com',
      isAdmin: true
    });

    // Create regular user
    regularUser = await global.testUtils.createTestUser({
      email: 'user@example.com',
      isAdmin: false
    });

    // Generate tokens
    adminToken = jwt.sign(
      { id: adminUser._id, isAdmin: true },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    regularToken = jwt.sign(
      { id: regularUser._id, isAdmin: false },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/admin/logs', () => {
    test('should allow admin to access logs', async () => {
      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('logs');
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    test('should deny access to regular users', async () => {
      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('admin');
    });

    test('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/logs')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle missing log file gracefully', async () => {
      // Temporarily rename log file if it exists
      const logPath = process.env.LOG_FILE_PATH || './logs/app.log';
      const backupPath = logPath + '.backup';

      let fileRenamed = false;
      if (fs.existsSync(logPath)) {
        fs.renameSync(logPath, backupPath);
        fileRenamed = true;
      }

      try {
        const response = await request(app)
          .get('/api/admin/logs')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.logs).toEqual([]);
      } finally {
        // Restore log file if it was renamed
        if (fileRenamed && fs.existsSync(backupPath)) {
          fs.renameSync(backupPath, logPath);
        }
      }
    });

    test('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/logs?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('logs');
    });
  });

  describe('Admin Authentication', () => {
    test('should verify admin token correctly', async () => {
      // This tests the middleware functionality
      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid tokens', async () => {
      const invalidToken = 'invalid.token.here';

      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject expired tokens', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: adminUser._id, isAdmin: true },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
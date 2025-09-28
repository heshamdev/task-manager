/**
 * User Model Tests
 * Tests user model functionality including validation, methods, and middleware
 */

const User = require('../../server/models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  describe('Schema Validation', () => {
    test('should create a valid user with all required fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.isAdmin).toBe(false);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    test('should require email field', async () => {
      const user = new User({
        name: 'John Doe',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Email is required');
    });

    test('should require name field', async () => {
      const user = new User({
        email: 'john@example.com',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Name is required');
    });

    test('should require password field', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com'
      });

      await expect(user.save()).rejects.toThrow('Password is required');
    });

    test('should validate email format', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Please provide a valid email address');
    });

    test('should enforce unique email constraint', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData);
      await expect(user2.save()).rejects.toThrow('duplicate key error');
    });

    test('should enforce password minimum length', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      });

      await expect(user.save()).rejects.toThrow('Password must be at least 6 characters long');
    });

    test('should enforce name maximum length', async () => {
      const user = new User({
        name: 'A'.repeat(51),
        email: 'john@example.com',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow('Name cannot exceed 50 characters');
    });

    test('should convert email to lowercase', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'JOHN@EXAMPLE.COM',
        password: 'password123'
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe('john@example.com');
    });

    test('should trim whitespace from name and email', async () => {
      const user = new User({
        name: '  John Doe  ',
        email: '  john@example.com  ',
        password: 'password123'
      });

      const savedUser = await user.save();
      expect(savedUser.name).toBe('John Doe');
      expect(savedUser.email).toBe('john@example.com');
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hash length
    });

    test('should not hash password if not modified', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();
      const originalPassword = user.password;

      // Update non-password field
      user.name = 'Jane Doe';
      await user.save();

      expect(user.password).toBe(originalPassword);
    });

    test('should hash password when password is modified', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();
      const originalPassword = user.password;

      // Update password
      user.password = 'newpassword123';
      await user.save();

      expect(user.password).not.toBe(originalPassword);
      expect(user.password).not.toBe('newpassword123');
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = await global.testUtils.createTestUser();
    });

    test('comparePassword should return true for correct password', async () => {
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
    });

    test('comparePassword should return false for incorrect password', async () => {
      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    test('comparePassword should throw error for invalid input', async () => {
      await expect(user.comparePassword(null)).rejects.toThrow('Password comparison failed');
    });

    test('updateLastLogin should update lastLogin timestamp', async () => {
      const beforeUpdate = user.lastLogin;
      
      await user.updateLastLogin();
      
      expect(user.lastLogin).toBeDefined();
      expect(user.lastLogin).not.toBe(beforeUpdate);
      expect(user.lastLogin).toBeInstanceOf(Date);
    });
  });

  describe('Static Methods', () => {
    test('findByEmail should find user by email including password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findByEmail('john@example.com');
      
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('john@example.com');
      expect(foundUser.password).toBeDefined(); // Should include password field
    });

    test('findByEmail should return null for non-existent email', async () => {
      const foundUser = await User.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });

  describe('JSON Transformation', () => {
    test('toJSON should exclude password and __v fields', async () => {
      const user = await global.testUtils.createTestUser();
      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.__v).toBeUndefined();
      expect(userJSON._id).toBeDefined();
      expect(userJSON.email).toBeDefined();
    });
  });

  describe('Virtual Fields', () => {
    test('taskCount virtual should be defined', async () => {
      const user = await global.testUtils.createTestUser();
      expect(user.taskCount).toBeDefined();
    });
  });

  describe('Indexes', () => {
    test('should have email index', async () => {
      const indexes = await User.collection.getIndexes();
      expect(indexes).toHaveProperty('email_1');
    });

    test('should have createdAt index', async () => {
      const indexes = await User.collection.getIndexes();
      expect(indexes).toHaveProperty('createdAt_-1');
    });
  });
});

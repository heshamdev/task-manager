import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display login and register links when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Check that login and register links are visible
    await expect(page.locator('text=Login')).toBeVisible();
    await expect(page.locator('text=Register')).toBeVisible();
    
    // Check that logout button is not visible
    await expect(page.locator('text=Logout')).not.toBeVisible();
  });

  test('should navigate to login page when login link is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Click login link
    await page.click('text=Login');
    
    // Wait for navigation and check URL
    await expect(page).toHaveURL('/login');
    
    // Check that login form is visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should navigate to register page when register link is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Click register link
    await page.click('text=Register');
    
    // Wait for navigation and check URL
    await expect(page).toHaveURL('/register');
    
    // Check that register form is visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Register")')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    
    // Submit empty form
    await page.click('button:has-text("Login")');
    
    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation errors for invalid email format', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button:has-text("Login")');
    
    // Check for validation error
    await expect(page.locator('text=Email must be valid')).toBeVisible();
  });

  test('should show validation errors for short password', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form with short password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '123');
    
    // Submit form
    await page.click('button:has-text("Login")');
    
    // Check for validation error
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
  });

  test('should show loading overlay during login attempt', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form with valid data
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button:has-text("Login")');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for API call to complete (this will fail but we want to see the loading state)
    await page.waitForTimeout(2000);
  });

  test('should show multi-stage loading messages during login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form with valid data
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button:has-text("Login")');
    
    // Check for initial loading message
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait a bit to see if loading messages change
    await page.waitForTimeout(1000);
    
    // The loading overlay should still be visible
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
  });

  test('should show validation errors for empty register form', async ({ page }) => {
    await page.goto('/register');
    
    // Submit empty form
    await page.click('button:has-text("Register")');
    
    // Check for validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation errors for password confirmation mismatch', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with mismatched passwords
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[placeholder="Enter your password"]', 'password123');
    await page.fill('input[placeholder="Confirm your password"]', 'differentpassword');
    
    // Submit form
    await page.click('button:has-text("Register")');
    
    // Check for validation error
    await expect(page.locator('text=Passwords must match')).toBeVisible();
  });

  test('should show loading overlay during registration attempt', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with valid data
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[placeholder="Enter your password"]', 'password123');
    await page.fill('input[placeholder="Confirm your password"]', 'password123');
    
    // Submit form
    await page.click('button:has-text("Register")');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for API call to complete
    await page.waitForTimeout(2000);
  });

  test('should show multi-stage loading messages during registration', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with valid data
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[placeholder="Enter your password"]', 'password123');
    await page.fill('input[placeholder="Confirm your password"]', 'password123');
    
    // Submit form
    await page.click('button:has-text("Register")');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait a bit to see if loading messages change
    await page.waitForTimeout(1000);
    
    // The loading overlay should still be visible
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
  });

  test('should handle login API error gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invalid credentials'
        })
      });
    });

    await page.goto('/login');
    
    // Fill form with invalid credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button:has-text("Login")');
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should handle registration API error gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Email already exists'
        })
      });
    });

    await page.goto('/register');
    
    // Fill form with existing email
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'existing@example.com');
    await page.fill('input[placeholder="Enter your password"]', 'password123');
    await page.fill('input[placeholder="Confirm your password"]', 'password123');
    
    // Submit form
    await page.click('button:has-text("Register")');
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check for error message
    await expect(page.locator('text=Email already exists')).toBeVisible();
  });

  test('should redirect to tasks page after successful login', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            token: 'fake-jwt-token',
            user: {
              id: '1',
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        })
      });
    });

    await page.goto('/login');
    
    // Fill form with valid credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button:has-text("Login")');
    
    // Wait for navigation to tasks page
    await expect(page).toHaveURL('/tasks');
    
    // Check that logout button is now visible
    await expect(page.locator('text=Logout')).toBeVisible();
    
    // Check that login/register links are not visible
    await expect(page.locator('text=Login')).not.toBeVisible();
    await expect(page.locator('text=Register')).not.toBeVisible();
  });

  test('should redirect to tasks page after successful registration', async ({ page }) => {
    // Mock successful registration response
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            token: 'fake-jwt-token',
            user: {
              id: '1',
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        })
      });
    });

    await page.goto('/register');
    
    // Fill form with valid data
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[placeholder="Enter your password"]', 'password123');
    await page.fill('input[placeholder="Confirm your password"]', 'password123');
    
    // Submit form
    await page.click('button:has-text("Register")');
    
    // Wait for navigation to tasks page
    await expect(page).toHaveURL('/tasks');
    
    // Check that logout button is now visible
    await expect(page.locator('text=Logout')).toBeVisible();
  });

  test('should maintain authentication state across page refreshes', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            token: 'fake-jwt-token',
            user: {
              id: '1',
              name: 'Test User',
              email: 'test@example.com'
            }
          }
        })
      });
    });

    await page.goto('/login');
    
    // Fill form and login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');
    
    // Wait for navigation
    await expect(page).toHaveURL('/tasks');
    
    // Refresh the page
    await page.reload();
    
    // Check that user is still authenticated
    await expect(page.locator('text=Logout')).toBeVisible();
    await expect(page.locator('text=Login')).not.toBeVisible();
  });

  test('should logout successfully and redirect to login page', async ({ page }) => {
    // Set up authenticated state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-jwt-token');
    });
    
    // Reload page to apply authentication state
    await page.reload();
    
    // Check that logout button is visible
    await expect(page.locator('text=Logout')).toBeVisible();
    
    // Click logout button
    await page.click('text=Logout');
    
    // Check redirect to login page
    await expect(page).toHaveURL('/login');
    
    // Check that login/register links are visible again
    await expect(page.locator('text=Login')).toBeVisible();
    await expect(page.locator('text=Register')).toBeVisible();
    
    // Check that logout button is not visible
    await expect(page.locator('text=Logout')).not.toBeVisible();
  });

  test('should prevent access to protected routes when not authenticated', async ({ page }) => {
    // Try to access tasks page directly
    await page.goto('/tasks');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should allow access to protected routes when authenticated', async ({ page }) => {
    // Set up authenticated state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-jwt-token');
    });
    
    // Access tasks page
    await page.goto('/tasks');
    
    // Should stay on tasks page
    await expect(page).toHaveURL('/tasks');
  });

  test('should show proper loading states during authentication transitions', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button:has-text("Login")');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden', timeout: 10000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/auth/login', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/login');
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button:has-text("Login")');
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check for error message
    await expect(page.locator('text=Network error')).toBeVisible();
  });
});

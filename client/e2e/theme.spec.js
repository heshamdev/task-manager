import { test, expect } from '@playwright/test';

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-jwt-token');
    });
    
    // Mock API responses for tasks page
    await page.route('**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              tasks: [
                {
                  _id: '1',
                  title: 'Test Task 1',
                  description: 'Description for test task 1',
                  priority: 'high',
                  status: 'pending',
                  dueDate: '2024-12-31',
                  createdAt: '2024-01-01T00:00:00.000Z',
                  updatedAt: '2024-01-01T00:00:00.000Z'
                }
              ],
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalTasks: 1,
                hasNextPage: false,
                hasPrevPage: false,
                limit: 3
              }
            }
          })
        });
      }
    });

    await page.route('**/api/tasks/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            stats: {
              total: 1,
              pending: 1,
              completed: 0
            }
          }
        })
      });
    });

    // Navigate to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
  });

  test('should display theme switcher component', async ({ page }) => {
    // Check that theme switcher is visible
    await expect(page.locator('.theme-switcher')).toBeVisible();
    
    // Check that it contains theme options
    await expect(page.locator('.theme-switcher button')).toHaveCount(2); // light and dark
  });

  test('should start with light theme by default', async ({ page }) => {
    // Check that body has light theme class
    await expect(page.locator('body')).not.toHaveClass(/dark/);
    
    // Check that theme switcher shows light theme as active
    const lightButton = page.locator('.theme-switcher button').first();
    await expect(lightButton).toHaveClass(/active/);
  });

  test('should switch to dark theme when clicking dark theme button', async ({ page }) => {
    // Click dark theme button
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Check that body has dark theme class
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // Check that dark theme button is now active
    await expect(darkButton).toHaveClass(/active/);
    
    // Check that light theme button is not active
    const lightButton = page.locator('.theme-switcher button').first();
    await expect(lightButton).not.toHaveClass(/active/);
  });

  test('should switch back to light theme when clicking light theme button', async ({ page }) => {
    // First switch to dark theme
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Then switch back to light theme
    const lightButton = page.locator('.theme-switcher button').first();
    await lightButton.click();
    
    // Check that body no longer has dark theme class
    await expect(page.locator('body')).not.toHaveClass(/dark/);
    
    // Check that light theme button is active
    await expect(lightButton).toHaveClass(/active/);
    
    // Check that dark theme button is not active
    await expect(darkButton).not.toHaveClass(/active/);
  });

  test('should persist theme preference in localStorage', async ({ page }) => {
    // Switch to dark theme
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Check localStorage
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
    
    // Switch to light theme
    const lightButton = page.locator('.theme-switcher button').first();
    await lightButton.click();
    
    // Check localStorage again
    const newTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(newTheme).toBe('light');
  });

  test('should load saved theme preference on page refresh', async ({ page }) => {
    // Switch to dark theme
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that dark theme is still active
    await expect(page.locator('body')).toHaveClass(/dark/);
    await expect(darkButton).toHaveClass(/active/);
    
    // Check that light theme button is not active
    const lightButton = page.locator('.theme-switcher button').first();
    await expect(lightButton).not.toHaveClass(/active/);
  });

  test('should apply theme to all UI components', async ({ page }) => {
    // Check light theme appearance
    await expect(page.locator('.tasks-page')).toBeVisible();
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('.card')).toBeVisible();
    await expect(page.locator('.task-card')).toBeVisible();
    
    // Switch to dark theme
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Check that components are still visible in dark theme
    await expect(page.locator('.tasks-page')).toBeVisible();
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('.card')).toBeVisible();
    await expect(page.locator('.task-card')).toBeVisible();
  });

  test('should maintain theme across different pages', async ({ page }) => {
    // Switch to dark theme
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Navigate to a different page (if available)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that dark theme is still active
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // Navigate back to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    
    // Check that dark theme is still active
    await expect(page.locator('body')).toHaveClass(/dark/);
  });

  test('should detect system theme preference', async ({ page }) => {
    // Mock system preference for dark theme
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => {},
        }),
      });
    });
    
    // Clear localStorage to test system preference
    await page.evaluate(() => localStorage.removeItem('theme'));
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that dark theme is applied based on system preference
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // Check that dark theme button is active
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await expect(darkButton).toHaveClass(/active/);
  });

  test('should override system preference when user manually selects theme', async ({ page }) => {
    // Mock system preference for dark theme
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => {},
        }),
      });
    });
    
    // Clear localStorage
    await page.evaluate(() => localStorage.removeItem('theme'));
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that dark theme is applied (system preference)
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // Manually switch to light theme
    const lightButton = page.locator('.theme-switcher button').first();
    await lightButton.click();
    
    // Check that light theme is applied (overriding system preference)
    await expect(page.locator('body')).not.toHaveClass(/dark/);
    
    // Check that localStorage is updated
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('light');
  });

  test('should handle theme switching during loading states', async ({ page }) => {
    // Start a task creation to trigger loading state
    await page.fill('input[placeholder="Enter task title"]', 'Theme Test Task');
    await page.click('button:has-text("Create")');
    
    // Wait for loading overlay to appear
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Try to switch theme during loading
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Check that theme switches even during loading
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that theme remains applied
    await expect(page.locator('body')).toHaveClass(/dark/);
  });

  test('should show theme switcher on all pages', async ({ page }) => {
    // Check theme switcher on tasks page
    await expect(page.locator('.theme-switcher')).toBeVisible();
    
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check theme switcher on home page
    await expect(page.locator('.theme-switcher')).toBeVisible();
    
    // Navigate back to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    
    // Check theme switcher is still visible
    await expect(page.locator('.theme-switcher')).toBeVisible();
  });

  test('should maintain theme when logging out and back in', async ({ page }) => {
    // Switch to dark theme
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Logout (simulate by removing token)
    await page.evaluate(() => localStorage.removeItem('token'));
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check that theme is still applied
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // Login again (simulate by adding token)
    await page.evaluate(() => localStorage.setItem('token', 'fake-jwt-token'));
    
    // Navigate to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    
    // Check that theme is still applied
    await expect(page.locator('body')).toHaveClass(/dark/);
  });

  test('should handle theme switching errors gracefully', async ({ page }) => {
    // Mock localStorage error
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        if (key === 'theme') {
          throw new Error('localStorage error');
        }
        return originalSetItem.call(this, key, value);
      };
    });
    
    // Try to switch theme
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Check that theme still switches visually
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // Check that theme switcher updates its state
    await expect(darkButton).toHaveClass(/active/);
  });

  test('should show proper theme icons', async ({ page }) => {
    // Check light theme icon
    const lightButton = page.locator('.theme-switcher button').first();
    const lightIcon = lightButton.locator('svg');
    await expect(lightIcon).toBeVisible();
    
    // Check dark theme icon
    const darkButton = page.locator('.theme-switcher button').nth(1);
    const darkIcon = darkButton.locator('svg');
    await expect(darkIcon).toBeVisible();
    
    // Switch to dark theme
    await darkButton.click();
    
    // Check that icons are still visible
    await expect(lightIcon).toBeVisible();
    await expect(darkIcon).toBeVisible();
  });

  test('should work with keyboard navigation', async ({ page }) => {
    // Focus on theme switcher
    await page.locator('.theme-switcher').focus();
    
    // Tab to light theme button
    await page.keyboard.press('Tab');
    
    // Check that light theme button is focused
    const lightButton = page.locator('.theme-switcher button').first();
    await expect(lightButton).toBeFocused();
    
    // Activate with Enter key
    await page.keyboard.press('Enter');
    
    // Check that light theme is active
    await expect(page.locator('body')).not.toHaveClass(/dark/);
    await expect(lightButton).toHaveClass(/active/);
    
    // Tab to dark theme button
    await page.keyboard.press('Tab');
    
    // Check that dark theme button is focused
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await expect(darkButton).toBeFocused();
    
    // Activate with Enter key
    await page.keyboard.press('Enter');
    
    // Check that dark theme is active
    await expect(page.locator('body')).toHaveClass(/dark/);
    await expect(darkButton).toHaveClass(/active/);
  });

  test('should maintain theme when browser is closed and reopened', async ({ page }) => {
    // Switch to dark theme
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Get the current localStorage state
    const themeBefore = await page.evaluate(() => localStorage.getItem('theme'));
    expect(themeBefore).toBe('dark');
    
    // Simulate browser reopening by creating a new context
    const context = page.context();
    const newPage = await context.newPage();
    
    // Navigate to tasks page
    await newPage.goto('/tasks');
    await newPage.waitForLoadState('networkidle');
    
    // Check that theme is still dark
    await expect(newPage.locator('body')).toHaveClass(/dark/);
    
    // Close the new page
    await newPage.close();
  });

  test('should work with different screen sizes', async ({ page }) => {
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check theme switcher visibility
    await expect(page.locator('.theme-switcher')).toBeVisible();
    
    // Switch theme
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Check that theme switches
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // Test on desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Check theme switcher visibility
    await expect(page.locator('.theme-switcher')).toBeVisible();
    
    // Switch theme back
    const lightButton = page.locator('.theme-switcher button').first();
    await lightButton.click();
    
    // Check that theme switches
    await expect(page.locator('body')).not.toHaveClass(/dark/);
  });

  test('should handle rapid theme switching', async ({ page }) => {
    // Rapidly switch between themes
    const lightButton = page.locator('.theme-switcher button').first();
    const darkButton = page.locator('.theme-switcher button').nth(1);
    
    // Switch multiple times quickly
    await darkButton.click();
    await lightButton.click();
    await darkButton.click();
    await lightButton.click();
    await darkButton.click();
    
    // Check that final theme is applied correctly
    await expect(page.locator('body')).toHaveClass(/dark/);
    await expect(darkButton).toHaveClass(/active/);
    
    // Check that localStorage has the correct value
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
  });
});

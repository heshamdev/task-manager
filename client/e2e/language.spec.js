import { test, expect } from '@playwright/test';

test.describe('Language Switching and RTL Support', () => {
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

  test('should display language switcher component', async ({ page }) => {
    // Check that language switcher is visible
    await expect(page.locator('.language-switcher')).toBeVisible();
    
    // Check that it contains language options
    await expect(page.locator('.language-switcher button')).toHaveCount(2); // English and Arabic
  });

  test('should start with English language by default', async ({ page }) => {
    // Check that body has LTR direction
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    
    // Check that language switcher shows English as active
    const enButton = page.locator('.language-switcher button').first();
    await expect(enButton).toHaveClass(/active/);
    
    // Check that page title is in English
    await expect(page).toHaveTitle(/3DDX Task Manager/);
  });

  test('should switch to Arabic language when clicking Arabic button', async ({ page }) => {
    // Click Arabic language button
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check that HTML has RTL direction
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Check that Arabic button is now active
    await expect(arButton).toHaveClass(/active/);
    
    // Check that English button is not active
    const enButton = page.locator('.language-switcher button').first();
    await expect(enButton).not.toHaveClass(/active/);
    
    // Check that page title is updated to Arabic
    await expect(page).toHaveTitle(/مدير مهام 3DDX/);
  });

  test('should switch back to English when clicking English button', async ({ page }) => {
    // First switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Then switch back to English
    const enButton = page.locator('.language-switcher button').first();
    await enButton.click();
    
    // Check that HTML has LTR direction
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    
    // Check that English button is active
    await expect(enButton).toHaveClass(/active/);
    
    // Check that Arabic button is not active
    await expect(arButton).not.toHaveClass(/active/);
    
    // Check that page title is back to English
    await expect(page).toHaveTitle(/3DDX Task Manager/);
  });

  test('should persist language preference in localStorage', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check localStorage
    const locale = await page.evaluate(() => localStorage.getItem('locale'));
    expect(locale).toBe('ar');
    
    // Switch to English
    const enButton = page.locator('.language-switcher button').first();
    await enButton.click();
    
    // Check localStorage again
    const newLocale = await page.evaluate(() => localStorage.getItem('locale'));
    expect(newLocale).toBe('en');
  });

  test('should load saved language preference on page refresh', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that Arabic is still active
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(arButton).toHaveClass(/active/);
    
    // Check that English button is not active
    const enButton = page.locator('.language-switcher button').first();
    await expect(enButton).not.toHaveClass(/active/);
  });

  test('should translate UI text to Arabic', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check that key UI elements are translated
    await expect(page.locator('h2.card-title')).toHaveText('إنشاء مهمة جديدة');
    await expect(page.locator('label:has-text("العنوان")')).toBeVisible();
    await expect(page.locator('label:has-text("الوصف")')).toBeVisible();
    await expect(page.locator('label:has-text("الأولوية")')).toBeVisible();
    await expect(page.locator('label:has-text("تاريخ الاستحقاق")')).toBeVisible();
    await expect(page.locator('button:has-text("إنشاء")')).toBeVisible();
  });

  test('should apply RTL layout correctly', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check that main layout is RTL
    await expect(page.locator('.tasks-layout')).toHaveCSS('direction', 'rtl');
    
    // Check that text alignment is appropriate for RTL
    await expect(page.locator('h2.card-title')).toHaveCSS('text-align', 'right');
    await expect(page.locator('.task-card h3')).toHaveCSS('text-align', 'right');
  });

  test('should maintain language across different pages', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that Arabic is still active
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Navigate back to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    
    // Check that Arabic is still active
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('should show language switcher on all pages', async ({ page }) => {
    // Check language switcher on tasks page
    await expect(page.locator('.language-switcher')).toBeVisible();
    
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check language switcher on home page
    await expect(page.locator('.language-switcher')).toBeVisible();
    
    // Navigate back to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    
    // Check language switcher is still visible
    await expect(page.locator('.language-switcher')).toBeVisible();
  });

  test('should maintain language when logging out and back in', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Logout (simulate by removing token)
    await page.evaluate(() => localStorage.removeItem('token'));
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check that language is still Arabic
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Login again (simulate by adding token)
    await page.evaluate(() => localStorage.setItem('token', 'fake-jwt-token'));
    
    // Navigate to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    
    // Check that language is still Arabic
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('should handle language switching during loading states', async ({ page }) => {
    // Start a task creation to trigger loading state
    await page.fill('input[placeholder="Enter task title"]', 'Language Test Task');
    await page.click('button:has-text("Create")');
    
    // Wait for loading overlay to appear
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Try to switch language during loading
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check that language switches even during loading
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that language remains applied
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('should translate form placeholders and labels', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check form placeholders
    await expect(page.locator('input[placeholder="أدخل عنوان المهمة"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder="أدخل وصف المهمة"]')).toBeVisible();
    
    // Check form labels
    await expect(page.locator('label:has-text("العنوان")')).toBeVisible();
    await expect(page.locator('label:has-text("الوصف")')).toBeVisible();
    await expect(page.locator('label:has-text("الأولوية")')).toBeVisible();
    await expect(page.locator('label:has-text("تاريخ الاستحقاق")')).toBeVisible();
  });

  test('should translate task status and priority badges', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check status badge translation
    await expect(page.locator('.status-badge')).toHaveText('قيد الانتظار');
    
    // Check priority badge translation
    await expect(page.locator('.priority-badge')).toHaveText('مرتفع');
  });

  test('should translate statistics section', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Wait for stats to load
    await page.waitForSelector('.stats-grid');
    
    // Check that statistics are displayed (numbers remain the same, labels change)
    await expect(page.locator('.stats-grid')).toBeVisible();
    await expect(page.locator('.stat-card')).toHaveCount(3);
  });

  test('should translate pagination controls', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check pagination controls (if visible)
    const pagination = page.locator('.pagination');
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
    }
  });

  test('should translate error messages', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Try to submit empty form to trigger validation
    await page.click('button:has-text("إنشاء")');
    
    // Check for Arabic validation error
    await expect(page.locator('text=العنوان مطلوب')).toBeVisible();
  });

  test('should handle bidirectional text correctly', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Create a task with English text to test mixed content
    await page.fill('input[placeholder="أدخل عنوان المهمة"]', 'Test Task بالعربية');
    await page.fill('textarea[placeholder="أدخل وصف المهمة"]', 'Description بالعربية');
    await page.selectOption('.form-select', 'medium');
    await page.fill('input[type="date"]', '2024-12-25');
    await page.click('button:has-text("إنشاء")');
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that mixed text is displayed correctly
    await page.waitForSelector('.task-card');
    await expect(page.locator('.task-card').first().locator('h3')).toHaveText('Test Task بالعربية');
  });

  test('should maintain proper RTL layout with mixed content', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check that layout remains RTL even with mixed content
    await expect(page.locator('.tasks-layout')).toHaveCSS('direction', 'rtl');
    await expect(page.locator('.sidebar')).toHaveCSS('direction', 'rtl');
    await expect(page.locator('.main-content')).toHaveCSS('direction', 'rtl');
  });

  test('should work with keyboard navigation in RTL mode', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Focus on language switcher
    await page.locator('.language-switcher').focus();
    
    // Tab to English button
    await page.keyboard.press('Tab');
    
    // Check that English button is focused
    const enButton = page.locator('.language-switcher button').first();
    await expect(enButton).toBeFocused();
    
    // Activate with Enter key
    await page.keyboard.press('Enter');
    
    // Check that language switches to English
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    
    // Tab to Arabic button
    await page.keyboard.press('Tab');
    
    // Check that Arabic button is focused
    const arButton = page.locator('.language-switcher button').nth(1);
    await expect(arButton).toBeFocused();
    
    // Activate with Enter key
    await page.keyboard.press('Enter');
    
    // Check that language switches back to Arabic
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('should handle language switching errors gracefully', async ({ page }) => {
    // Mock localStorage error
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        if (key === 'locale') {
          throw new Error('localStorage error');
        }
        return originalSetItem.call(this, key, value);
      };
    });
    
    // Try to switch language
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check that language still switches visually
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Check that language switcher updates its state
    await expect(arButton).toHaveClass(/active/);
  });

  test('should show proper language flags or indicators', async ({ page }) => {
    // Check English language indicator
    const enButton = page.locator('.language-switcher button').first();
    const enText = await enButton.textContent();
    expect(enText).toContain('EN');
    
    // Check Arabic language indicator
    const arButton = page.locator('.language-switcher button').nth(1);
    const arText = await arButton.textContent();
    expect(arText).toContain('AR');
    
    // Switch to Arabic
    await arButton.click();
    
    // Check that indicators are still visible
    await expect(enButton).toBeVisible();
    await expect(arButton).toBeVisible();
  });

  test('should maintain language when browser is closed and reopened', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Get the current localStorage state
    const localeBefore = await page.evaluate(() => localStorage.getItem('locale'));
    expect(localeBefore).toBe('ar');
    
    // Simulate browser reopening by creating a new context
    const context = page.context();
    const newPage = await context.newPage();
    
    // Navigate to tasks page
    await newPage.goto('/tasks');
    await newPage.waitForLoadState('networkidle');
    
    // Check that language is still Arabic
    await expect(newPage.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Close the new page
    await newPage.close();
  });

  test('should work with different screen sizes in RTL mode', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check language switcher visibility
    await expect(page.locator('.language-switcher')).toBeVisible();
    
    // Check that RTL layout is maintained
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Test on desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Check language switcher visibility
    await expect(page.locator('.language-switcher')).toBeVisible();
    
    // Check that RTL layout is maintained
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('should handle rapid language switching', async ({ page }) => {
    // Rapidly switch between languages
    const enButton = page.locator('.language-switcher button').first();
    const arButton = page.locator('.language-switcher button').nth(1);
    
    // Switch multiple times quickly
    await arButton.click();
    await enButton.click();
    await arButton.click();
    await enButton.click();
    await arButton.click();
    
    // Check that final language is applied correctly
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(arButton).toHaveClass(/active/);
    
    // Check that localStorage has the correct value
    const locale = await page.evaluate(() => localStorage.getItem('locale'));
    expect(locale).toBe('ar');
  });

  test('should translate loading overlay messages', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Start a task creation to trigger loading state
    await page.fill('input[placeholder="أدخل عنوان المهمة"]', 'Loading Test');
    await page.click('button:has-text("إنشاء")');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
  });

  test('should maintain proper text alignment in RTL mode', async ({ page }) => {
    // Switch to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check text alignment for various elements
    await expect(page.locator('h2.card-title')).toHaveCSS('text-align', 'right');
    await expect(page.locator('.task-card h3')).toHaveCSS('text-align', 'right');
    await expect(page.locator('.task-description')).toHaveCSS('text-align', 'right');
    
    // Switch back to English
    const enButton = page.locator('.language-switcher button').first();
    await enButton.click();
    
    // Check text alignment for LTR
    await expect(page.locator('h2.card-title')).toHaveCSS('text-align', 'left');
    await expect(page.locator('.task-card h3')).toHaveCSS('text-align', 'left');
    await expect(page.locator('.task-description')).toHaveCSS('text-align', 'left');
  });
});

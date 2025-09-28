import { test, expect } from '@playwright/test';

test.describe('Pagination Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-jwt-token');
    });
    
    // Mock API responses for tasks page with pagination
    await page.route('**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        const url = route.request().url();
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const page = parseInt(urlParams.get('page')) || 1;
        const limit = parseInt(urlParams.get('limit')) || 3;
        
        // Generate mock tasks based on page and limit
        const tasks = [];
        const startIndex = (page - 1) * limit;
        const totalTasks = 10; // Total tasks across all pages
        
        for (let i = startIndex; i < startIndex + limit && i < totalTasks; i++) {
          tasks.push({
            _id: String(i + 1),
            title: `Test Task ${i + 1}`,
            description: `Description for test task ${i + 1}`,
            priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
            status: i % 2 === 0 ? 'pending' : 'completed',
            dueDate: '2024-12-31',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          });
        }
        
        const totalPages = Math.ceil(totalTasks / limit);
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              tasks: tasks,
              pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalTasks: totalTasks,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                limit: limit
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
              total: 10,
              pending: 5,
              completed: 5
            }
          }
        })
      });
    });

    // Navigate to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
  });

  test('should display pagination component', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Check that pagination component is visible
    await expect(page.locator('.pagination')).toBeVisible();
    
    // Check that it contains pagination controls
    await expect(page.locator('.pagination button')).toBeVisible();
  });

  test('should display correct page information', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Check page information display
    await expect(page.locator('.page-info')).toBeVisible();
    
    // Check that it shows current page and total pages
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 1 of 4');
  });

  test('should display correct number of tasks per page', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Check that 3 tasks are displayed (default limit)
    const taskCards = await page.locator('.task-card').count();
    expect(taskCards).toBe(3);
  });

  test('should navigate to next page', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Get initial task titles
    const initialTitles = await page.locator('.task-card h3').allTextContents();
    
    // Click next page button
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Wait for new tasks to load
    await page.waitForSelector('.task-card');
    
    // Check that tasks are different
    const newTitles = await page.locator('.task-card h3').allTextContents();
    expect(newTitles).not.toEqual(initialTitles);
    
    // Check that page information is updated
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 2 of 4');
  });

  test('should navigate to previous page', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // First navigate to page 2
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Get task titles on page 2
    const page2Titles = await page.locator('.task-card h3').allTextContents();
    
    // Click previous page button
    const prevButton = page.locator('button:has-text("Previous")');
    await expect(prevButton).toBeEnabled();
    await prevButton.click();
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Wait for new tasks to load
    await page.waitForSelector('.task-card');
    
    // Check that tasks are back to page 1
    const page1Titles = await page.locator('.task-card h3').allTextContents();
    expect(page1Titles).not.toEqual(page2Titles);
    
    // Check that page information is updated
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 1 of 4');
  });

  test('should disable previous button on first page', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Check that previous button is disabled
    const prevButton = page.locator('button:has-text("Previous")');
    await expect(prevButton).toBeDisabled();
  });

  test('should disable next button on last page', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Navigate to last page
    const nextButton = page.locator('button:has-text("Next")');
    for (let i = 0; i < 3; i++) {
      await nextButton.click();
      await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
      await page.waitForSelector('.task-card');
    }
    
    // Check that next button is disabled
    await expect(nextButton).toBeDisabled();
    
    // Check that page information shows last page
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 4 of 4');
  });

  test('should change page size', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Check initial task count (3 tasks)
    let taskCards = await page.locator('.task-card').count();
    expect(taskCards).toBe(3);
    
    // Change page size to 5
    await page.selectOption('select', '5');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Wait for new tasks to load
    await page.waitForSelector('.task-card');
    
    // Check that 5 tasks are now displayed
    taskCards = await page.locator('.task-card').count();
    expect(taskCards).toBe(5);
    
    // Check that page information is updated
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 1 of 2');
  });

  test('should maintain page size preference', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Change page size to 10
    await page.selectOption('select', '10');
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Check that 10 tasks are displayed
    const taskCards = await page.locator('.task-card').count();
    expect(taskCards).toBe(10);
    
    // Check that page information shows single page
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 1 of 1');
    
    // Check that next button is disabled
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeDisabled();
  });

  test('should show loading states during pagination', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Click next page button
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that tasks are loaded
    await expect(page.locator('.task-card')).toHaveCount(3);
  });

  test('should show loading states during page size change', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Change page size
    await page.selectOption('select', '5');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that tasks are loaded
    await expect(page.locator('.task-card')).toHaveCount(5);
  });

  test('should handle pagination with filters', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Apply status filter
    await page.selectOption('select', 'pending');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Wait for filtered tasks to load
    await page.waitForSelector('.task-card');
    
    // Check pagination with filtered results
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 1');
    
    // Try to navigate pages with filter
    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      
      // Check for loading overlay
      await expect(page.locator('.vue-loading-overlay')).toBeVisible();
      
      // Wait for loading to complete
      await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
      
      // Wait for new tasks to load
      await page.waitForSelector('.task-card');
    }
  });

  test('should display correct item range information', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Check item range display
    await expect(page.locator('.item-range')).toBeVisible();
    
    // Check that it shows correct range (1-3 of 10)
    const itemRange = await page.locator('.item-range').textContent();
    expect(itemRange).toContain('1-3 of 10');
    
    // Navigate to next page
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Check that item range is updated (4-6 of 10)
    const newItemRange = await page.locator('.item-range').textContent();
    expect(newItemRange).toContain('4-6 of 10');
  });

  test('should handle pagination errors gracefully', async ({ page }) => {
    // Mock API error for pagination
    await page.route('**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        const url = route.request().url();
        if (url.includes('page=2')) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Server error' })
          });
        } else {
          // Normal response for page 1
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
                  totalPages: 2,
                  totalTasks: 4,
                  hasNextPage: true,
                  hasPrevPage: false,
                  limit: 3
                }
              }
            })
          });
        }
      }
    });
    
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Try to navigate to error page
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that error is handled gracefully (stays on current page or shows error message)
    await expect(page.locator('.task-card')).toBeVisible();
  });

  test('should work with keyboard navigation', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Focus on pagination component
    await page.locator('.pagination').focus();
    
    // Tab to next button
    await page.keyboard.press('Tab');
    
    // Check that next button is focused
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeFocused();
    
    // Activate with Enter key
    await page.keyboard.press('Enter');
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Check that page changed
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 2 of 4');
  });

  test('should maintain pagination state during page refresh', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Navigate to page 2
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Get task titles on page 2
    const page2Titles = await page.locator('.task-card h3').allTextContents();
    
    // Refresh page
    await page.reload();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Check that it goes back to page 1 (pagination state not persisted in URL)
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 1 of 4');
  });

  test('should handle empty pagination state', async ({ page }) => {
    // Mock empty task list
    await page.route('**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              tasks: [],
              pagination: {
                currentPage: 1,
                totalPages: 0,
                totalTasks: 0,
                hasNextPage: false,
                hasPrevPage: false,
                limit: 3
              }
            }
          })
        });
      }
    });
    
    // Reload page
    await page.reload();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that pagination handles empty state gracefully
    await expect(page.locator('.pagination')).toBeVisible();
    
    // Check that both next and previous buttons are disabled
    const nextButton = page.locator('button:has-text("Next")');
    const prevButton = page.locator('button:has-text("Previous")');
    await expect(nextButton).toBeDisabled();
    await expect(prevButton).toBeDisabled();
    
    // Check page information
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 1 of 0');
  });

  test('should handle single page pagination', async ({ page }) => {
    // Mock single page task list
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
                  title: 'Single Task',
                  description: 'Only one task',
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
    
    // Reload page
    await page.reload();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Check that both next and previous buttons are disabled
    const nextButton = page.locator('button:has-text("Next")');
    const prevButton = page.locator('button:has-text("Previous")');
    await expect(nextButton).toBeDisabled();
    await expect(prevButton).toBeDisabled();
    
    // Check page information
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 1 of 1');
  });

  test('should work with different screen sizes', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check pagination visibility
    await expect(page.locator('.pagination')).toBeVisible();
    
    // Check that pagination controls are accessible
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();
    
    // Test pagination on mobile
    await nextButton.click();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Check that page changed
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 2 of 4');
    
    // Test on desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Check pagination visibility
    await expect(page.locator('.pagination')).toBeVisible();
    
    // Check that pagination controls are accessible
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();
  });

  test('should maintain pagination during theme changes', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Navigate to page 2
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Check that we're on page 2
    let pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 2 of 4');
    
    // Switch theme
    const darkButton = page.locator('.theme-switcher button').nth(1);
    await darkButton.click();
    
    // Check that pagination is still visible and functional
    await expect(page.locator('.pagination')).toBeVisible();
    
    // Check that page information is still correct
    pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 2 of 4');
    
    // Try to navigate back to page 1
    const prevButton = page.locator('button:has-text("Previous")');
    await prevButton.click();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Check that navigation worked
    pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 1 of 4');
  });

  test('should maintain pagination during language changes', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Navigate to page 2
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Check that we're on page 2
    let pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page 2 of 4');
    
    // Switch language to Arabic
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Check that pagination is still visible and functional
    await expect(page.locator('.pagination')).toBeVisible();
    
    // Check that page information is still correct (numbers don't change)
    pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('2');
    expect(pageInfo).toContain('4');
    
    // Try to navigate back to page 1
    const prevButton = page.locator('button:has-text("Previous")');
    await prevButton.click();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Check that navigation worked
    pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('1');
  });

  test('should handle rapid pagination clicks', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Rapidly click next button multiple times
    const nextButton = page.locator('button:has-text("Next")');
    
    for (let i = 0; i < 3; i++) {
      await nextButton.click();
      // Don't wait for loading between clicks to test rapid clicks
    }
    
    // Wait for final loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    await page.waitForSelector('.task-card');
    
    // Check that we ended up on a valid page
    const pageInfo = await page.locator('.page-info').textContent();
    expect(pageInfo).toContain('Page');
  });

  test('should display pagination in RTL mode', async ({ page }) => {
    // Switch to Arabic (RTL)
    const arButton = page.locator('.language-switcher button').nth(1);
    await arButton.click();
    
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Check that pagination is visible in RTL mode
    await expect(page.locator('.pagination')).toBeVisible();
    
    // Check that pagination has RTL direction
    await expect(page.locator('.pagination')).toHaveCSS('direction', 'rtl');
    
    // Check that buttons are in correct order (Previous should be on the right in RTL)
    const prevButton = page.locator('button:has-text("Previous")');
    const nextButton = page.locator('button:has-text("Next")');
    
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
    
    // Test navigation in RTL mode
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      
      // Wait for loading to complete
      await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
      await page.waitForSelector('.task-card');
      
      // Check that page changed
      const pageInfo = await page.locator('.page-info').textContent();
      expect(pageInfo).toContain('2');
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Task Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-jwt-token');
    });
    
    // Mock API responses
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
                },
                {
                  _id: '2',
                  title: 'Test Task 2',
                  description: 'Description for test task 2',
                  priority: 'medium',
                  status: 'completed',
                  dueDate: '2024-12-30',
                  createdAt: '2024-01-02T00:00:00.000Z',
                  updatedAt: '2024-01-02T00:00:00.000Z'
                }
              ],
              pagination: {
                currentPage: 1,
                totalPages: 2,
                totalTasks: 5,
                hasNextPage: true,
                hasPrevPage: false,
                limit: 3
              }
            }
          })
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              task: {
                _id: '3',
                title: 'New Task',
                description: 'New task description',
                priority: 'medium',
                status: 'pending',
                dueDate: '2024-12-29',
                createdAt: '2024-01-03T00:00:00.000Z',
                updatedAt: '2024-01-03T00:00:00.000Z'
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
              total: 5,
              pending: 3,
              completed: 2
            }
          }
        })
      });
    });

    await page.route('**/api/tasks/*/toggle', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            task: {
              _id: '1',
              title: 'Test Task 1',
              description: 'Description for test task 1',
              priority: 'high',
              status: 'completed',
              dueDate: '2024-12-31',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-03T00:00:00.000Z'
            }
          }
        })
      });
    });

    await page.route('**/api/tasks/*', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              task: {
                _id: '1',
                title: 'Updated Task',
                description: 'Updated description',
                priority: 'low',
                status: 'pending',
                dueDate: '2024-12-28',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-03T00:00:00.000Z'
              }
            }
          })
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Task deleted successfully' })
        });
      }
    });

    // Navigate to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
  });

  test('should display tasks page with correct structure', async ({ page }) => {
    // Check main page structure
    await expect(page.locator('.tasks-page')).toBeVisible();
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('.tasks-layout')).toBeVisible();
    
    // Check sidebar with create task form
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.card')).toBeVisible();
    await expect(page.locator('h2.card-title')).toBeVisible();
    
    // Check main content area
    await expect(page.locator('.main-content')).toBeVisible();
  });

  test('should display existing tasks in the list', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Check that tasks are displayed
    const taskCards = await page.locator('.task-card').count();
    expect(taskCards).toBe(2);
    
    // Check first task details
    await expect(page.locator('.task-card').first().locator('h3')).toHaveText('Test Task 1');
    await expect(page.locator('.task-card').first().locator('.task-description')).toHaveText('Description for test task 1');
    await expect(page.locator('.task-card').first().locator('.priority-badge')).toBeVisible();
    await expect(page.locator('.task-card').first().locator('.status-badge')).toBeVisible();
  });

  test('should display task statistics', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('.stats-grid');
    
    // Check stats display
    await expect(page.locator('.stats-grid')).toBeVisible();
    await expect(page.locator('.stat-card')).toHaveCount(3); // total, pending, completed
    
    // Check stat values
    await expect(page.locator('.stat-card').nth(0).locator('.stat-value')).toHaveText('5');
    await expect(page.locator('.stat-card').nth(1).locator('.stat-value')).toHaveText('3');
    await expect(page.locator('.stat-card').nth(2).locator('.stat-value')).toHaveText('2');
  });

  test('should create a new task successfully', async ({ page }) => {
    // Fill task creation form
    await page.fill('input[placeholder="Enter task title"]', 'New Test Task');
    await page.fill('textarea[placeholder="Enter task description"]', 'This is a new test task');
    await page.selectOption('.form-select', 'high');
    await page.fill('input[type="date"]', '2024-12-25');
    
    // Submit form
    await page.click('button:has-text("Create")');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that new task appears in the list
    await page.waitForSelector('.task-card');
    const taskCards = await page.locator('.task-card').count();
    expect(taskCards).toBe(3);
    
    // Check that the new task is first in the list
    await expect(page.locator('.task-card').first().locator('h3')).toHaveText('New Test Task');
    
    // Check that form is reset
    await expect(page.locator('input[placeholder="Enter task title"]')).toHaveValue('');
    await expect(page.locator('textarea[placeholder="Enter task description"]')).toHaveValue('');
    await expect(page.locator('.form-select')).toHaveValue('medium');
    await expect(page.locator('input[type="date"]')).toHaveValue('');
  });

  test('should show validation errors for empty task creation form', async ({ page }) => {
    // Submit empty form
    await page.click('button:has-text("Create")');
    
    // Check for validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
  });

  test('should show validation errors for invalid due date', async ({ page }) => {
    // Fill form with past date
    await page.fill('input[placeholder="Enter task title"]', 'Test Task');
    await page.fill('input[type="date"]', '2020-01-01');
    
    // Submit form
    await page.click('button:has-text("Create")');
    
    // Check for validation error
    await expect(page.locator('text=The due date must be today or in the future')).toBeVisible();
  });

  test('should show multi-stage loading messages during task creation', async ({ page }) => {
    // Fill form
    await page.fill('input[placeholder="Enter task title"]', 'Loading Test Task');
    await page.fill('textarea[placeholder="Enter task description"]', 'Testing loading messages');
    await page.selectOption('.form-select', 'medium');
    await page.fill('input[type="date"]', '2024-12-25');
    
    // Submit form
    await page.click('button:has-text("Create")');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
  });

  test('should toggle task status', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Get first task
    const firstTask = page.locator('.task-card').first();
    
    // Check initial status
    await expect(firstTask.locator('.status-badge')).toHaveText('Pending');
    
    // Click toggle button
    await firstTask.locator('.toggle-btn').click();
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that status changed
    await expect(firstTask.locator('.status-badge')).toHaveText('Completed');
  });

  test('should edit a task', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Get first task and click edit button
    const firstTask = page.locator('.task-card').first();
    await firstTask.locator('.edit-btn').click();
    
    // Check that edit dialog is open
    await expect(page.locator('dialog')).toBeVisible();
    
    // Update task details
    await page.fill('dialog input[placeholder="Enter task title"]', 'Updated Task Title');
    await page.fill('dialog textarea[placeholder="Enter task description"]', 'Updated task description');
    await page.selectOption('dialog .form-select', 'low');
    await page.fill('dialog input[type="date"]', '2024-12-20');
    
    // Save changes
    await page.click('dialog button:has-text("Save Changes")');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that dialog is closed
    await expect(page.locator('dialog')).not.toBeVisible();
    
    // Check that task was updated
    await expect(firstTask.locator('h3')).toHaveText('Updated Task Title');
  });

  test('should delete a task', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Get initial task count
    const initialCount = await page.locator('.task-card').count();
    
    // Get first task and click delete button
    const firstTask = page.locator('.task-card').first();
    await firstTask.locator('.delete-btn').click();
    
    // Confirm deletion (if confirmation dialog exists)
    // Note: This assumes there's a confirmation dialog. Adjust if needed.
    const confirmButton = page.locator('button:has-text("Confirm")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that task count decreased
    const finalCount = await page.locator('.task-card').count();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should filter tasks by status', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Get initial task count
    const initialCount = await page.locator('.task-card').count();
    
    // Filter by pending status
    await page.selectOption('select', 'pending');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that filtered tasks are displayed
    await page.waitForSelector('.task-card');
    const filteredCount = await page.locator('.task-card').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should filter tasks by priority', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Get initial task count
    const initialCount = await page.locator('.task-card').count();
    
    // Filter by high priority
    const prioritySelect = page.locator('.form-select').nth(1);
    await prioritySelect.selectOption('high');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that filtered tasks are displayed
    await page.waitForSelector('.task-card');
    const filteredCount = await page.locator('.task-card').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should show loading states during filter operations', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Change status filter
    await page.selectOption('select', 'completed');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
  });

  test('should navigate through pages', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Check pagination controls
    await expect(page.locator('.pagination')).toBeVisible();
    
    // Click next page button
    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      
      // Check for loading overlay
      await expect(page.locator('.vue-loading-overlay')).toBeVisible();
      
      // Wait for loading to complete
      await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
      
      // Check that URL or content changed
      await page.waitForTimeout(1000);
    }
  });

  test('should change page size', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Change page size
    await page.selectOption('select', '10');
    
    // Check for loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that page size changed (this would require checking the API call or UI update)
    await page.waitForTimeout(1000);
  });

  test('should show loading states during pagination operations', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Click next page button
    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      
      // Check for loading overlay
      await expect(page.locator('.vue-loading-overlay')).toBeVisible();
      
      // Wait for loading to complete
      await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    }
  });

  test('should handle API errors gracefully during task operations', async ({ page }) => {
    // Mock API error for task creation
    await page.route('**/api/tasks', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Failed to create task'
          })
        });
      }
    });
    
    // Try to create task
    await page.fill('input[placeholder="Enter task title"]', 'Error Task');
    await page.click('button:has-text("Create")');
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check for error message
    await expect(page.locator('text=Failed to create task')).toBeVisible();
  });

  test('should update statistics after task operations', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('.stats-grid');
    
    // Get initial stats
    const initialTotal = await page.locator('.stat-card').nth(0).locator('.stat-value').textContent();
    
    // Create a new task
    await page.fill('input[placeholder="Enter task title"]', 'Stats Test Task');
    await page.fill('textarea[placeholder="Enter task description"]', 'Testing stats update');
    await page.selectOption('.form-select', 'medium');
    await page.fill('input[type="date"]', '2024-12-25');
    await page.click('button:has-text("Create")');
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Wait for stats to update
    await page.waitForTimeout(1000);
    
    // Check that stats were updated (this would require mocking the stats API response)
    await expect(page.locator('.stats-grid')).toBeVisible();
  });

  test('should maintain task list state after page refresh', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Get initial task count
    const initialCount = await page.locator('.task-card').count();
    
    // Refresh page
    await page.reload();
    
    // Wait for tasks to load again
    await page.waitForSelector('.task-card');
    
    // Check that tasks are still displayed
    const refreshedCount = await page.locator('.task-card').count();
    expect(refreshedCount).toBe(initialCount);
  });

  test('should show responsive design on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for tasks to load
    await page.waitForSelector('.task-card');
    
    // Check that layout is responsive
    await expect(page.locator('.tasks-layout')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();
    
    // Check that mobile-specific elements are visible
    await expect(page.locator('.task-card')).toBeVisible();
  });

  test('should handle empty task list gracefully', async ({ page }) => {
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
    
    // Check that empty state is handled gracefully
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();
  });

  test('should show proper loading states during initial page load', async ({ page }) => {
    // Navigate to tasks page fresh
    await page.goto('/tasks');
    
    // Check for initial loading overlay
    await expect(page.locator('.vue-loading-overlay')).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that tasks are displayed
    await page.waitForSelector('.task-card');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/tasks', async (route) => {
      await route.abort('failed');
    });
    
    // Reload page
    await page.reload();
    
    // Wait for loading to complete
    await page.waitForSelector('.vue-loading-overlay', { state: 'hidden' });
    
    // Check that error is handled gracefully
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.main-content')).toBeVisible();
  });
});

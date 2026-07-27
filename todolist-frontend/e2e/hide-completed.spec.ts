import { test, expect, type Page } from '@playwright/test'

/**
 * Verify that completed tasks (status=1) are hidden from all calendar views.
 * Mocks /api/tasks to return a mix of pending + completed tasks, then checks
 * that no completed task title appears in month/week/daybar/bar views.
 */

function todayISO(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

const mockTasks = [
  { id: 101, title: 'Pending-Task-A', status: 0, priority: 2, dueDate: todayISO(0), startDate: todayISO(0), parentId: null, listId: 1 },
  { id: 102, title: 'Pending-Task-B', status: 0, priority: 1, dueDate: todayISO(1), startDate: todayISO(1), parentId: null, listId: 1 },
  { id: 103, title: 'Completed-Task-X', status: 1, priority: 2, dueDate: todayISO(0), startDate: todayISO(0), parentId: null, listId: 1 },
  { id: 104, title: 'Completed-Task-Y', status: 1, priority: 3, dueDate: todayISO(2), startDate: todayISO(2), parentId: null, listId: 1 },
]

async function setupApiMocks(page: Page) {
  await page.route('http://localhost:18080/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const method = route.request().method()
    const ok = (data: any) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data }),
      })

    if (path === '/api/tasks' && method === 'GET') {
      return ok({ content: mockTasks, totalElements: mockTasks.length, totalPages: 1, size: 1000, number: 0 })
    }
    if (path === '/api/tasks/range' && method === 'GET') {
      return ok(mockTasks)
    }
    if (path === '/api/lists' && method === 'GET') return ok([{ id: 1, name: '默认清单' }])
    return ok(null)
  })
}

test.describe('Hide completed tasks from calendar', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.getByTitle('日历').click()
    await page.waitForTimeout(500)
  })

  test('month view: completed tasks not visible', async ({ page }) => {
    // Pending tasks should be visible
    await expect(page.getByText('Pending-Task-A')).toBeVisible()
    await expect(page.getByText('Pending-Task-B')).toBeVisible()
    // Completed tasks should NOT be visible anywhere
    await expect(page.getByText('Completed-Task-X')).toHaveCount(0)
    await expect(page.getByText('Completed-Task-Y')).toHaveCount(0)
  })

  test('week view: completed tasks not visible', async ({ page }) => {
    await page.getByRole('radio', { name: '周' }).click({ force: true })
    await page.waitForTimeout(300)
    await expect(page.getByText('Pending-Task-A')).toBeVisible()
    await expect(page.getByText('Completed-Task-X')).toHaveCount(0)
    await expect(page.getByText('Completed-Task-Y')).toHaveCount(0)
  })

  test('daybar view: completed tasks not visible', async ({ page }) => {
    await page.getByRole('radio', { name: '日' }).click({ force: true })
    await page.waitForTimeout(300)
    await expect(page.getByText('Pending-Task-A')).toBeVisible()
    await expect(page.getByText('Completed-Task-X')).toHaveCount(0)
    await expect(page.getByText('Completed-Task-Y')).toHaveCount(0)
  })

  test('bar view: completed tasks not visible', async ({ page }) => {
    await page.getByRole('radio', { name: '条形' }).click({ force: true })
    await page.waitForTimeout(300)
    await expect(page.getByText('Pending-Task-A')).toBeVisible()
    await expect(page.getByText('Completed-Task-X')).toHaveCount(0)
    await expect(page.getByText('Completed-Task-Y')).toHaveCount(0)
  })
})

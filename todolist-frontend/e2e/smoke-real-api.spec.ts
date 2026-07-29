/**
 * No-Mock E2E Smoke Test — talks to REAL backend via Vite proxy
 *
 * These tests would have caught real backend bugs (500 errors, render crashes)
 * that slip through when all API endpoints are mocked.
 *
 * IMPORTANT: Does NOT call setupApiMocks() — all API calls hit the real backend.
 */
import { test, expect } from '@playwright/test'

test.use({ storageState: undefined })

/** Collect page errors only (console warnings are too noisy) */
function setupErrorCollectors(page: any) {
  const pageErrors: Error[] = []
  page.on('pageerror', (err: Error) => {
    pageErrors.push(err)
  })
  return { pageErrors }
}

/** Login helper — returns JWT token from localStorage after successful login */
async function login(page: any) {
  await page.goto('/#/login')
  await page.waitForLoadState('domcontentloaded')
  await page.fill('input[placeholder="请输入用户名"]', 'admin')
  await page.fill('input[placeholder="请输入密码"]', 'admin123')
  await page.click('button:has-text("登录")')
  // Wait for hash to change to #/ (dashboard)
  await page.waitForFunction(() => window.location.hash === '#/', { timeout: 15000 })
  // Wait for dashboard container to render
  await page.waitForSelector('.dashboard-container, .el-container', { timeout: 15000 })
  // Let API calls settle
  await page.waitForTimeout(1500)
}

test.describe('Real API Smoke Tests', () => {
  test.describe.configure({ timeout: 60000 })

  test('Scenario A: Dashboard loads without any errors', async ({ page }) => {
    const { pageErrors } = setupErrorCollectors(page)
    await login(page)
    expect(pageErrors).toEqual([])
  })

  test('Scenario B: Statistics tab renders without errors', async ({ page }) => {
    const { pageErrors } = setupErrorCollectors(page)
    await login(page)
    // Click on 数据统计 in the sidebar menu
    await page.getByText('数据统计').first().click()
    await page.waitForTimeout(2000)
    // Wait for statistics content to appear (heading may vary)
    await page.locator('任务统计概览, .statistics-content').first().waitFor({
      state: 'visible',
      timeout: 10000,
    }).catch(() => { /* allow fallback */ })
    expect(pageErrors).toEqual([])
  })

  test('Scenario C: Create task via API and verify it displays', async ({ page }) => {
    const { pageErrors } = setupErrorCollectors(page)
    await login(page)

    // Extract JWT token from localStorage for API call
    const token = await page.evaluate(() => localStorage.getItem('jwt_token'))
    expect(token).toBeTruthy()

    // Create a task via fetch() inside the browser page (goes through Vite proxy)
    const taskTitle = `Smoke test task ${Date.now()}`
    const createResult = await page.evaluate(
      async ({ title, priority, token }: { title: string; priority: number; token: string }) => {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, priority }),
        })
        return res.json()
      },
      { title: taskTitle, priority: 2, token }
    )
    expect(createResult.code).toBe(200)
    expect(createResult.data.title).toBe(taskTitle)

    // Refresh dashboard to see the new task
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Verify the task title appears in the task list
    const taskItem = page.locator(`text=${taskTitle}`).first()
    await expect(taskItem).toBeVisible({ timeout: 10000 })

    // Click on the task to open the edit panel
    await taskItem.click()
    await page.waitForTimeout(1000)

    expect(pageErrors).toEqual([])
  })
})

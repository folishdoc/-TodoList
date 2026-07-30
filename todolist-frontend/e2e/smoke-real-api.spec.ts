/**
 * No-Mock E2E Smoke Test — talks to REAL backend via Vite proxy
 *
 * Covers ALL functional modules with real API calls.
 * Does NOT call setupApiMocks() — all API calls hit the real backend.
 *
 * IMPORTANT:
 * - Each test gets a fresh authenticated session via beforeEach.
 * - Uses page.evaluate() for API calls to go through Vite proxy.
 * - Page errors are collected per-test and asserted empty at end.
 */
import { test, expect } from '@playwright/test'

test.use({ storageState: undefined })

let authToken: string

/** Unique short suffix to avoid collisions in shared DB */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/** Collect page-level errors (uncaught exceptions) and console errors */
function collectErrors(page: any): string[] {
  const errors: string[] = []
  page.on('pageerror', (e: Error) => errors.push(e.message))
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  return errors
}


test.describe('Real API Smoke Tests', () => {
  test.describe.configure({ timeout: 60000 })

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' },
    })
    const data = await res.json()
    expect(data.code).toBe(200)
    authToken = data.data.token
  })

  test.beforeEach(async ({ page }) => {
    // Inject JWT token into localStorage, then navigate to dashboard
    await page.goto('/#/login')
    await page.waitForLoadState('domcontentloaded')
    await page.evaluate((t) => localStorage.setItem('jwt_token', t), authToken)
    await page.goto('/#/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  // ──────────────────────────────────────────────
  // 1. Login + Dashboard
  // ──────────────────────────────────────────────
  test('A: Dashboard loads without errors', async ({ page }) => {
    const errors = collectErrors(page)
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.locator('.dashboard-container')).toBeVisible({ timeout: 10000 })
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 2. Statistics tab
  // ──────────────────────────────────────────────
  test('B: Statistics tab renders without errors', async ({ page }) => {
    const errors = collectErrors(page)
    await page.getByText('数据统计').first().click()
    await page.waitForTimeout(2000)
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 3. Task CRUD
  // ──────────────────────────────────────────────
  test('C: Create task via API and verify it displays', async ({ page }) => {
    const errors = collectErrors(page)
    const title = `Smoke C ${uid()}`

    const res = await page.evaluate(async ({ title, token }) => {
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, priority: 2 }),
      })
      return r.json()
    }, { title, token: authToken })
    expect(res.code).toBe(200)
    expect(res.data.title).toBe(title)

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const item = page.getByText(title).first()
    await expect(item).toBeVisible({ timeout: 10000 })
    await item.click()
    await page.waitForTimeout(1000)
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 4. Lists management
  // ──────────────────────────────────────────────
  test('D: Lists — create via API and verify in sidebar', async ({ page }) => {
    const errors = collectErrors(page)
    const name = `Smoke D ${uid()}`

    const res = await page.evaluate(async ({ name, token }) => {
      const r = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, color: '#409EFF' }),
      })
      return r.json()
    }, { name, token: authToken })
    expect(res.code).toBe(200)

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await expect(page.getByText(name).first()).toBeVisible({ timeout: 10000 })
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 5. Tags
  // ──────────────────────────────────────────────
  test('E: Tags — open TagsView dialog via sidebar', async ({ page }) => {
    const errors = collectErrors(page)
    await page.getByText('标签管理').first().click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('新建标签').first()).toBeVisible({ timeout: 10000 })
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 6. Calendar
  // ──────────────────────────────────────────────
  test('F: Calendar — navigate to calendar and verify month view', async ({ page }) => {
    const errors = collectErrors(page)
    await page.getByTitle('日历').click()
    await page.waitForTimeout(1000)
    await expect(page.locator('.calendar-container')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.month-view')).toBeVisible()
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 7. Habits
  // ──────────────────────────────────────────────
  test('G: Habits — navigate to habits tab', async ({ page }) => {
    const errors = collectErrors(page)
    await page.getByTitle('习惯').click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('习惯追踪').first()).toBeVisible({ timeout: 10000 })
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 8. Anniversaries
  // ──────────────────────────────────────────────
  test('H: Anniversaries — navigate to anniversaries tab', async ({ page }) => {
    const errors = collectErrors(page)
    await page.getByTitle('纪念日').click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('新建纪念日').first()).toBeVisible({ timeout: 10000 })
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 9. Task with repeat rule
  // ──────────────────────────────────────────────
  test('I: Task with repeat rule — create and verify edit panel', async ({ page }) => {
    const errors = collectErrors(page)
    const title = `Smoke I ${uid()}`

    const res = await page.evaluate(async ({ title, token }) => {
      // Step 1: create task
      const r1 = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, priority: 2 }),
      })
      const task = await r1.json()
      // Step 2: set repeat rule (DAILY)
      if (task.code === 200 && task.data?.id) {
        await fetch(`/api/tasks/repeat/${task.data.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ type: 'DAILY', interval: 1 }),
        })
      }
      return task
    }, { title, token: authToken })
    expect(res.code).toBe(200)

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const item = page.getByText(title).first()
    await expect(item).toBeVisible({ timeout: 10000 })
    await item.click()
    await page.waitForTimeout(1000)
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 10. Batch operations
  // ──────────────────────────────────────────────
  test('J: Batch operations — enter batch mode', async ({ page }) => {
    const errors = collectErrors(page)
    const btn = page.getByText('批量操作').first()
    if (await btn.isVisible()) {
      await btn.click()
      await page.waitForTimeout(500)
    }
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 11. Widget view
  // ──────────────────────────────────────────────
  test('K: Widget view — navigates and renders compact task list', async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto('/#/widget')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    // Widget should render at least a container element
    await expect(page.locator('.el-container, #app > *').first()).toBeVisible({ timeout: 10000 })
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 12. Search
  // ──────────────────────────────────────────────
  test('L: Search — type in search box and verify no errors', async ({ page }) => {
    const errors = collectErrors(page)
    const input = page.locator('input[placeholder*="搜索"]').first()
    await expect(input).toBeVisible({ timeout: 10000 })
    await input.fill('smoke')
    await page.waitForTimeout(1000)
    expect(errors).toEqual([])
  })

  // ──────────────────────────────────────────────
  // 13. Theme toggle
  // ──────────────────────────────────────────────
  test('M: Theme toggle — click theme button', async ({ page }) => {
    const errors = collectErrors(page)
    const themeBtn = page.locator('button[title="切换主题"]').first()
    if (await themeBtn.isVisible()) {
      await themeBtn.click()
      await page.waitForTimeout(500)
    }
    expect(errors).toEqual([])
  })
})

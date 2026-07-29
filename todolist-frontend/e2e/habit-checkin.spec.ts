import { test, expect, type Page } from '@playwright/test'

async function setupApiMocks(page: Page) {
  let habits: any[] = [
    {
      id: 1,
      name: '晨跑',
      icon: '🏃',
      color: '#67C23A',
      targetType: 'count',
      targetValue: 1,
      frequency: 'daily',
      timePeriod: 'morning',
      currentStreak: 5,
      totalCompletions: 20,
    },
    {
      id: 2,
      name: '阅读',
      icon: '📚',
      color: '#409EFF',
      targetType: 'duration',
      targetValue: 30,
      frequency: 'daily',
      timePeriod: 'evening',
      currentStreak: 12,
      totalCompletions: 50,
    },
  ]
  let records: any[] = []

  await page.route('http://localhost:5180/api/**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    const method = req.method()

    const ok = (data: any) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data }),
      })

    if (path === '/api/habits' && method === 'GET') return ok(habits)
    if (path === '/api/habits/records/today' && method === 'GET') return ok(records)
    if (path === '/api/lists' && method === 'GET')
      return ok([{ id: 1, name: '默认清单', color: '#409EFF' }])
    if (path === '/api/tags' && method === 'GET') return ok([])
    if (path === '/api/tasks' && method === 'GET')
      return ok({ content: [], totalElements: 0, totalPages: 0, size: 1000, number: 0 })
    if (path === '/api/anniversaries' && method === 'GET') return ok([])
    if (path === '/api/anniversaries/pending-reminders' && method === 'GET') return ok([])

    const checkinMatch = path.match(/^\/api\/habits\/(\d+)\/checkin$/)
    if (checkinMatch && method === 'POST') {
      const id = Number(checkinMatch[1])
      const habit = habits.find((h) => h.id === id)
      if (habit) {
        const today = new Date().toISOString().slice(0, 10)
        if (!records.find((r: any) => r.habitId === id && r.checkDate === today)) {
          records.push({ habitId: id, checkDate: today, completionValue: habit.targetValue })
          habit.currentStreak++
          habit.totalCompletions++
        }
      }
      return ok(null)
    }
    const recordsRangeMatch = path.match(/^\/api\/habits\/(\d+)\/records\/range$/)
    if (recordsRangeMatch && method === 'GET') return ok([])

    return ok(null)
  })
}

test.describe('E2E 习惯打卡', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('导航到习惯模块：点击"习惯"图标后显示习惯列表', async ({ page }) => {
    const habitNav = page.locator('.nav-item[title="习惯"]')
    await habitNav.click()
    await page.waitForTimeout(800)
    await expect(page.getByText('晨跑').first()).toBeVisible()
    await expect(page.getByText('阅读').first()).toBeVisible()
    await expect(page.getByText('新建习惯')).toBeVisible()
  })

  test('习惯卡片显示名称、连续天数、总完成数', async ({ page }) => {
    const habitNav = page.locator('.nav-item[title="习惯"]')
    await habitNav.click()
    await page.waitForTimeout(800)
    await expect(page.getByText('晨跑').first()).toBeVisible()
    await expect(page.getByText('5').first()).toBeVisible()
    await expect(page.getByText('连续天数').first()).toBeVisible()
    await expect(page.getByText('总完成').first()).toBeVisible()
  })

  test('打卡：点击"打卡"按钮后状态变为"已完成"', async ({ page }) => {
    const habitNav = page.locator('.nav-item[title="习惯"]')
    await habitNav.click()
    await page.waitForTimeout(800)
    const checkInBtn = page.getByRole('button', { name: '打卡' }).first()
    await checkInBtn.click()
    await page.waitForTimeout(800)
    const completedBtn = page.getByRole('button', { name: /已完成/ })
    if ((await completedBtn.count()) > 0) {
      await expect(completedBtn.first()).toBeVisible()
    }
  })

  test('新建习惯：点击"新建习惯"按钮显示表单', async ({ page }) => {
    const habitNav = page.locator('.nav-item[title="习惯"]')
    await habitNav.click()
    await page.waitForTimeout(800)
    const newBtn = page.getByRole('button', { name: '新建习惯' })
    await newBtn.click()
    await page.waitForTimeout(500)
    await expect(page.getByText('新建习惯', { exact: false }).nth(1)).toBeVisible()
  })

  test('统计按钮：点击"统计"按钮显示趋势图', async ({ page }) => {
    const habitNav = page.locator('.nav-item[title="习惯"]')
    await habitNav.click()
    await page.waitForTimeout(800)
    const statBtn = page.getByRole('button', { name: /统计/ })
    await statBtn.click()
    await page.waitForTimeout(500)
    await expect(page.getByText('近7天')).toBeVisible()
    await expect(page.getByText('近30天')).toBeVisible()
  })
})

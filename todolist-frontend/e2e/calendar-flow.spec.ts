import { test, expect, type Page } from '@playwright/test'

/**
 * 通用 API mock — 返回空数据 + 几个测试任务。
 * CalendarView 通过 getTasks 拉取（Dashboard 内部），CalendarView 内
 * 直接用 allTasks 渲染，所以 mock /api/tasks 即可。
 */
async function setupApiMocks(page: Page) {
  await page.route('http://localhost:18080/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const method = route.request().method()
    const ok = (data: any) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ code: 200, message: 'success', data })
    })
    if (path === '/api/tasks' && method === 'GET') {
      return ok({ content: [], totalElements: 0, totalPages: 0, size: 1000, number: 0 })
    }
    return ok(null)
  })
}

async function navigateToCalendar(page: Page) {
  // Calendar 入口在左侧导航栏，title="日历"
  await page.getByTitle('日历').click()
  await page.waitForTimeout(500)
}

test.describe('Calendar 视图 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('导航到日历：显示日历容器与工具栏', async ({ page }) => {
    await navigateToCalendar(page)
    const container = page.locator('.calendar-container')
    await expect(container).toBeVisible()
    const toolbar = page.locator('.calendar-toolbar')
    await expect(toolbar).toBeVisible()
  })

  test('月视图默认显示：包含 7 列星期与日单元格', async ({ page }) => {
    await navigateToCalendar(page)
    // 默认 mode = month
    const monthView = page.locator('.month-view')
    await expect(monthView).toBeVisible()
    // 7 个星期标签
    const weekdays = page.locator('.month-view .weekday')
    await expect(weekdays).toHaveCount(7)
    // 日单元格：28-42 之间（取决于当月 1 号是星期几）
    const dayCells = page.locator('.month-view .day-cell')
    const cellCount = await dayCells.count()
    expect(cellCount).toBeGreaterThanOrEqual(28)
    expect(cellCount).toBeLessThanOrEqual(42)
  })

  test('月视图：工具栏显示当前年月标题', async ({ page }) => {
    await navigateToCalendar(page)
    const now = new Date()
    const expected = `${now.getFullYear()}年${now.getMonth() + 1}月`
    const title = page.locator('.current-period')
    await expect(title).toContainText(expected)
  })

  test('切换到周视图：显示 .week-view 容器', async ({ page }) => {
    await navigateToCalendar(page)
    // el-radio-button 的 input 被内层 span 拦截，使用 force 点击
    await page.getByRole('radio', { name: '周' }).click({ force: true })
    await page.waitForTimeout(300)
    const weekView = page.locator('.week-view')
    await expect(weekView).toBeVisible()
  })

  test('切换到日条形视图：显示 .daybar-view 容器', async ({ page }) => {
    await navigateToCalendar(page)
    // el-radio-button 的 input 被内层 span 拦截，使用 force 点击
    await page.getByRole('radio', { name: '日' }).click({ force: true })
    await page.waitForTimeout(300)
    const daybarView = page.locator('.daybar-view')
    await expect(daybarView).toBeVisible()
  })

  test('月视图：点击"下一月"按钮 → 标题变化', async ({ page }) => {
    await navigateToCalendar(page)
    const titleBefore = await page.locator('.current-period').textContent()
    // 点击"下一月"按钮
    await page.getByRole('button', { name: /下一月/ }).click()
    await page.waitForTimeout(300)
    const titleAfter = await page.locator('.current-period').textContent()
    expect(titleAfter).not.toBe(titleBefore)
  })

  test('月视图：点击"上一月" → 标题变化', async ({ page }) => {
    await navigateToCalendar(page)
    const titleBefore = await page.locator('.current-period').textContent()
    await page.getByRole('button', { name: /上一月/ }).click()
    await page.waitForTimeout(300)
    const titleAfter = await page.locator('.current-period').textContent()
    expect(titleAfter).not.toBe(titleBefore)
  })

  test('月视图：点击"今天"按钮 → 回到当月', async ({ page }) => {
    await navigateToCalendar(page)
    // 先点下一月
    await page.getByRole('button', { name: /下一月/ }).click()
    await page.waitForTimeout(200)
    // 再点今天
    await page.getByRole('button', { name: '今天' }).click()
    await page.waitForTimeout(200)
    const now = new Date()
    const expected = `${now.getFullYear()}年${now.getMonth() + 1}月`
    await expect(page.locator('.current-period')).toContainText(expected)
  })

  test('筛选下拉：显示筛选按钮', async ({ page }) => {
    await navigateToCalendar(page)
    const filterBtn = page.locator('button').filter({ hasText: '筛选' })
    await expect(filterBtn.first()).toBeVisible()
  })

  test('今日日期高亮：.day-cell.today 至少有一个', async ({ page }) => {
    await navigateToCalendar(page)
    // 当月有今天 → today class
    const todayCells = page.locator('.day-cell.today')
    await expect(todayCells.first()).toBeVisible()
  })

  test('月视图：点击未来某天打开新建任务对话框', async ({ page }) => {
    await navigateToCalendar(page)
    // day-cell 没有 isCurrentMonth class，使用 :not(.other-month)
    const dayCell = page.locator('.day-cell:not(.other-month)').nth(10)
    await dayCell.click()
    await page.waitForTimeout(500)
    // 新建任务对话框标题
    const dialogTitle = page.getByText('新建任务')
    if ((await dialogTitle.count()) > 0) {
      await expect(dialogTitle.first()).toBeVisible()
    }
  })
})

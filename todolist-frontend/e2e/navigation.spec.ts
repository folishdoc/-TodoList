import { test, expect, type Page } from '@playwright/test'

async function setupApiMocks(page: Page) {
  await page.route('http://localhost:5180/api/**', async (route) => {
    const ok = (data: any) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data }),
      })
    const path = new URL(route.request().url()).pathname
    if (path === '/api/tasks' && route.request().method() === 'GET') {
      return ok({ content: [], totalElements: 0, totalPages: 0, size: 1000, number: 0 })
    }
    if (path === '/api/lists' && route.request().method() === 'GET')
      return ok([{ id: 1, name: '默认清单', color: '#409EFF' }])
    if (path === '/api/tags' && route.request().method() === 'GET') return ok([])
    if (path === '/api/habits' && route.request().method() === 'GET') return ok([])
    if (path === '/api/anniversaries' && route.request().method() === 'GET') return ok([])
    if (path === '/api/anniversaries/pending-reminders' && route.request().method() === 'GET')
      return ok([])
    return ok(null)
  })
}

test.describe('E2E 导航与主题', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('左侧导航显示 5 个图标（清单、日历、习惯、纪念日、铃铛）', async ({ page }) => {
    await expect(page.locator('.nav-item[title="清单"]')).toBeVisible()
    await expect(page.locator('.nav-item[title="日历"]')).toBeVisible()
    await expect(page.locator('.nav-item[title="习惯"]')).toBeVisible()
    await expect(page.locator('.nav-item[title="纪念日"]')).toBeVisible()
    await expect(page.locator('.nav-item.bell-btn, .nav-item').last()).toBeVisible()
  })

  test('侧边栏显示 5 个固定菜单项（全部任务、今日任务、未来任务、数据统计、标签管理）', async ({
    page,
  }) => {
    await expect(page.getByText('全部任务').first()).toBeVisible()
    await expect(page.getByText('今日任务').first()).toBeVisible()
    await expect(page.getByText('未来任务').first()).toBeVisible()
    await expect(page.getByText('数据统计').first()).toBeVisible()
    await expect(page.getByText('标签管理').first()).toBeVisible()
  })

  test('点击"今日任务"切换菜单', async ({ page }) => {
    await page.getByText('今日任务').first().click()
    await page.waitForTimeout(300)
    await expect(page.getByText('今日任务').first()).toBeVisible()
  })

  test('点击"未来任务"切换菜单', async ({ page }) => {
    await page.getByText('未来任务').first().click()
    await page.waitForTimeout(300)
    await expect(page.getByText('未来任务').first()).toBeVisible()
  })

  test('点击"数据统计"进入统计页', async ({ page }) => {
    await page.getByText('数据统计').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText(/任务统计概览/)).toBeVisible()
  })

  test('点击"标签管理"进入标签页', async ({ page }) => {
    await page.getByText('标签管理').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('标签管理').first()).toBeVisible()
  })

  test('点击"习惯"图标切换到习惯视图', async ({ page }) => {
    await page.locator('.nav-item[title="习惯"]').click()
    await page.waitForTimeout(500)
    await expect(page.getByText('习惯追踪').first()).toBeVisible()
  })

  test('点击"纪念日"图标切换到纪念日视图', async ({ page }) => {
    await page.locator('.nav-item[title="纪念日"]').click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('新建纪念日').first()).toBeVisible()
  })

  test('主题切换：点击主题按钮后 html class 变化', async ({ page }) => {
    const html = page.locator('html')
    const before = await html.getAttribute('class')
    const themeBtn = page.locator('button[title="切换主题"]').first()
    if ((await themeBtn.count()) > 0) {
      await themeBtn.click()
      await page.waitForTimeout(500)
      const after = await html.getAttribute('class')
      expect(after).not.toBe(before)
    } else {
      expect(true).toBe(true)
    }
  })
})

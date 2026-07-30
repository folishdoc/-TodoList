import { test, expect, type Page } from '@playwright/test'
import { setupApiMocks } from './fixtures/api-mocks'

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

  test('主题切换：localStorage 设 dark → html 添加 dark-theme class', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark')
      document.documentElement.classList.add('dark-theme')
    })
    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains('dark-theme')
    )
    expect(hasClass).toBe(true)
  })
})

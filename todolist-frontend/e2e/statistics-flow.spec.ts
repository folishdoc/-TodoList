import { test, expect } from '@playwright/test'
import { setupApiMocks } from './fixtures/api-mocks'

const STATS = {
  overview: { totalTasks: 25, completedTasks: 10, pendingTasks: 15, completionRate: 40 },
  byPriority: [
    { name: '高', count: 5, color: '#f56c6c' },
    { name: '中', count: 10, color: '#e6a23c' },
    { name: '低', count: 10, color: '#909399' },
  ],
  byList: [
    { name: '工作', count: 15, color: '#409EFF' },
    { name: '生活', count: 10, color: '#67C23A' },
  ],
  trend: [
    { date: '2026-07-23', created: 3, completed: 1 },
    { date: '2026-07-24', created: 5, completed: 2 },
    { date: '2026-07-25', created: 2, completed: 3 },
    { date: '2026-07-26', created: 4, completed: 1 },
    { date: '2026-07-27', created: 6, completed: 2 },
    { date: '2026-07-28', created: 3, completed: 4 },
    { date: '2026-07-29', created: 2, completed: 1 },
  ],
}

test.describe('E2E 数据统计', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, { statistics: STATS })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('导航到统计页：显示"任务统计概览"卡片和统计数字', async ({ page }) => {
    await page.getByText('数据统计').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText(/任务统计概览/)).toBeVisible()
    await expect(page.getByText('25', { exact: true })).toBeVisible()
    await expect(page.getByText('10', { exact: true })).toBeVisible()
    await expect(page.getByText('15', { exact: true })).toBeVisible()
  })

  test('优先级分布区域：显示各优先级名称和任务数', async ({ page }) => {
    await page.getByText('数据统计').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText(/优先级分布/)).toBeVisible()
    await expect(page.getByText('高')).toBeVisible()
    await expect(page.getByText('中')).toBeVisible()
    await expect(page.getByText('低')).toBeVisible()
  })

  test('清单分布区域：显示各清单名称和任务数', async ({ page }) => {
    await page.getByText('数据统计').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText(/清单分布/)).toBeVisible()
    await expect(page.getByText('工作')).toBeVisible()
    await expect(page.getByText('生活')).toBeVisible()
  })

  test('趋势图区域：显示近7天图表，有创建数和完成数标签', async ({ page }) => {
    await page.getByText('数据统计').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText(/近7天任务趋势/)).toBeVisible()
    // 验证日期标签渲染
    await expect(page.getByText('7/23').first()).toBeVisible()
    await expect(page.getByText('7/29').first()).toBeVisible()
    // 验证数字标签（+创建 / ✓完成）
    await expect(page.getByText('+3').first()).toBeVisible()
    await expect(page.getByText('✓1').first()).toBeVisible()
  })

  test('导出按钮：显示 CSV 和 JSON 导出按钮', async ({ page }) => {
    await page.getByText('数据统计').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('button', { name: /导出CSV/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /导出JSON/ })).toBeVisible()
  })
})

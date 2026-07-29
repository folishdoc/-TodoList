import { test, expect } from '@playwright/test'
import { setupApiMocks } from './fixtures/api-mocks'

test.describe('E2E 数据导出', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [
        { id: 1, title: '买菜', status: 0, priority: 1, parentId: null, createdAt: '2025-01-01' },
        { id: 2, title: '做饭', status: 1, priority: 2, parentId: null, createdAt: '2025-01-02' },
      ],
      statistics: {
        overview: { totalTasks: 2, completedTasks: 1, pendingTasks: 1, completionRate: 50 },
        byList: [],
        byPriority: [],
        trend: [],
      },
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('导航到统计页：导出CSV按钮触发下载请求', async ({ page }) => {
    // 拦截下载请求
    let csvRequested = false
    await page.route('http://localhost:5180/api/export/tasks/csv', async (route) => {
      csvRequested = true
      return route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'id,title,status\n1,买菜,0\n2,做饭,1',
      })
    })

    await page.getByText('数据统计').first().click()
    await page.waitForTimeout(500)

    const csvBtn = page.getByRole('button', { name: /导出CSV/ })
    await expect(csvBtn).toBeVisible()

    // 点击导出按钮
    await csvBtn.click()
    await page.waitForTimeout(500)
    expect(csvRequested).toBe(true)
  })

  test('导航到统计页：导出JSON按钮触发下载请求', async ({ page }) => {
    let jsonRequested = false
    await page.route('http://localhost:5180/api/export/tasks/json', async (route) => {
      jsonRequested = true
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, title: '买菜', status: 0 }]),
      })
    })

    await page.getByText('数据统计').first().click()
    await page.waitForTimeout(500)

    const jsonBtn = page.getByRole('button', { name: /导出JSON/ })
    await expect(jsonBtn).toBeVisible()

    await jsonBtn.click()
    await page.waitForTimeout(500)
    expect(jsonRequested).toBe(true)
  })
})

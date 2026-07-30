import { test, expect, type Page } from '@playwright/test'
import { setupApiMocks } from './fixtures/api-mocks'

test.describe('E2E 任务生命周期', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('Dashboard 显示核心元素（新建任务按钮、批量操作按钮）', async ({ page }) => {
    await expect(page.getByRole('button', { name: '新建任务' })).toBeVisible()
    await expect(page.getByRole('button', { name: '批量操作' })).toBeVisible()
  })

  test('空状态：无任务时显示"暂无任务"提示', async ({ page }) => {
    const empty = page.getByText(/暂无任务/)
    await expect(empty.first()).toBeVisible()
  })

  test('搜索框：存在并可输入', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]')
    await searchInput.first().fill('测试')
    await page.waitForTimeout(300)
    const value = await searchInput.first().inputValue()
    expect(value).toBe('测试')
  })

  test('批量操作：点击"批量操作"进入批量模式', async ({ page }) => {
    const batchBtn = page.getByRole('button', { name: '批量操作' })
    await batchBtn.click()
    await page.waitForTimeout(300)
    await expect(page.getByRole('button', { name: /全选/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /退出批量/ })).toBeVisible()
  })

  test('任务渲染：列表中显示任务标题', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [
        { id: 1, title: '买菜', status: 0, priority: 0, parentId: null, createdAt: '2025-01-01' },
        { id: 2, title: '做饭', status: 1, priority: 1, parentId: null, createdAt: '2025-01-02' },
      ],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.getByText('买菜').first()).toBeVisible()
    await expect(page.getByText('做饭').first()).toBeVisible()
  })

  test('搜索过滤：输入关键词后搜索框内容更新', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [
        { id: 3, title: '买菜', status: 0, priority: 0, parentId: null, createdAt: '2025-01-01' },
        { id: 4, title: '做饭', status: 0, priority: 1, parentId: null, createdAt: '2025-01-02' },
        { id: 5, title: '写代码', status: 0, priority: 2, parentId: null, createdAt: '2025-01-03' },
      ],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const searchInput = page.locator('input[placeholder*="搜索"]')
    await expect(searchInput.first()).toBeVisible()

    // 输入搜索关键词
    await searchInput.first().fill('买菜')
    await page.waitForTimeout(500)

    // 验证搜索框值
    const value = await searchInput.first().inputValue()
    expect(value).toBe('买菜')
  })
})

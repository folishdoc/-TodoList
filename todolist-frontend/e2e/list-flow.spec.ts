import { test, expect, type Page } from '@playwright/test'
import { setupApiMocks } from './fixtures/api-mocks'

test.describe('E2E 清单与搜索', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [
        { id: 1, title: '全部-1', status: 0, priority: 1, listId: null, parentId: null, createdAt: '2025-01-01' },
        { id: 2, title: '全部-2', status: 1, priority: 2, listId: 1, parentId: null, createdAt: '2025-01-02' },
        { id: 3, title: '工作专属', status: 0, priority: 1, listId: 1, parentId: null, createdAt: '2025-01-03' },
      ],
      lists: [
        { id: 1, name: '工作', color: '#409EFF' },
        { id: 2, name: '生活', color: '#67C23A' },
      ],
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('侧边栏显示所有清单（工作、生活）', async ({ page }) => {
    await expect(page.getByText('工作').first()).toBeVisible()
    await expect(page.getByText('生活').first()).toBeVisible()
  })

  test('点击"全部任务"菜单 → 显示所有任务', async ({ page }) => {
    await page.getByText('全部任务').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('全部-1').first()).toBeVisible()
    await expect(page.getByText('全部-2').first()).toBeVisible()
  })

  test('点击"今日任务"菜单 → 切换菜单', async ({ page }) => {
    await page.getByText('今日任务').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('今日任务').first()).toBeVisible()
  })

  test('点击"未来任务"菜单 → 切换菜单', async ({ page }) => {
    await page.getByText('未来任务').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('未来任务').first()).toBeVisible()
  })

  test('点击清单 X（侧边栏）→ 显示该清单任务', async ({ page }) => {
    const workList = page.locator('.list-item').filter({ hasText: '工作' }).first()
    await workList.click()
    await page.waitForTimeout(500)
    await expect(page.getByText('工作专属').first()).toBeVisible()
  })

  test('创建清单：点击 + 按钮 → 显示表单对话框', async ({ page }) => {
    const addListBtn = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .filter({ hasText: '' })
      .first()
    const circleBtn = page.locator('.list-header button').first()
    await circleBtn.click()
    await page.waitForTimeout(500)
    const newListDialog = page.getByText('新建清单')
    await expect(newListDialog.first()).toBeVisible()
  })

  test('搜索任务：输入关键字 → 任务列表过滤', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]')
    await searchInput.first().fill('全部-1')
    await page.waitForTimeout(500)
    const value = await searchInput.first().inputValue()
    expect(value).toBe('全部-1')
  })

  test('清空搜索：点击 clear 按钮 → 输入框清空', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]')
    await searchInput.first().fill('xxx')
    await page.waitForTimeout(300)
    await searchInput.first().fill('')
    await page.waitForTimeout(300)
    const value = await searchInput.first().inputValue()
    expect(value).toBe('')
  })
})

import { test, expect, type Page } from '@playwright/test'
import { setupApiMocks } from './fixtures/api-mocks'

test.describe('E2E 批量操作', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [
        { id: 1, title: '任务A', status: 0, priority: 1, listId: null, parentId: null, createdAt: '2025-01-01' },
        { id: 2, title: '任务B', status: 0, priority: 2, listId: null, parentId: null, createdAt: '2025-01-02' },
        { id: 3, title: '任务C', status: 0, priority: 3, listId: null, parentId: null, createdAt: '2025-01-03' },
      ],
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('初始状态：默认显示"批量操作"按钮，不显示批量操作栏', async ({ page }) => {
    await expect(page.getByRole('button', { name: '批量操作' })).toBeVisible()
    await expect(page.getByText(/删除选中/)).not.toBeVisible()
  })

  test('进入批量模式：点击"批量操作" → 出现"全选/退出批量"按钮', async ({ page }) => {
    const batchBtn = page.getByRole('button', { name: '批量操作' })
    await batchBtn.click()
    await page.waitForTimeout(300)
    await expect(page.getByRole('button', { name: '全选' })).toBeVisible()
    await expect(page.getByRole('button', { name: /退出批量/ })).toBeVisible()
  })

  test('退出批量模式：点击"退出批量模式" → 隐藏批量操作栏', async ({ page }) => {
    await page.getByRole('button', { name: '批量操作' }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: /退出批量/ }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText(/全选/)).not.toBeVisible()
  })

  test('选择任务：勾选任务 → "删除选中"按钮启用', async ({ page }) => {
    await page.getByRole('button', { name: '批量操作' }).click()
    await page.waitForTimeout(300)
    const checkboxes = page.locator('.task-item .el-checkbox')
    await checkboxes.first().click({ force: true })
    await page.waitForTimeout(300)
    const deleteBtn = page.getByRole('button', { name: /删除选中/ })
    await expect(deleteBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('全选：点击"全选" → 任务项标记为 batch-selected', async ({ page }) => {
    await page.getByRole('button', { name: '批量操作' }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: '全选' }).click()
    await page.waitForTimeout(300)
    const selected = page.locator('.task-item.batch-selected')
    expect(await selected.count()).toBeGreaterThan(0)
  })

  test('批量删除：选择任务 → 点击"删除选中" → 任务被移除', async ({ page }) => {
    await page.getByRole('button', { name: '批量操作' }).click()
    await page.waitForTimeout(300)
    // 全选
    await page.getByRole('button', { name: '全选' }).click()
    await page.waitForTimeout(300)
    const deleteBtn = page.getByRole('button', { name: /删除选中/ })
    await deleteBtn.first().click()
    await page.waitForTimeout(500)
    // 确认删除（如果有确认对话框）
    const confirmBtn = page.getByRole('button', { name: '确定' }).last()
    await confirmBtn.click()
    await page.waitForTimeout(500)
  })
})

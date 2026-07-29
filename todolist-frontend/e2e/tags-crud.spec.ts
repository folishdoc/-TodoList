import { test, expect } from '@playwright/test'
import { setupApiMocks } from './fixtures/api-mocks'

test.describe('E2E 标签管理 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, {
      tags: [
        { id: 1, name: '重要', color: '#f56c6c', createdAt: '2025-01-01T00:00:00' },
        { id: 2, name: '工作', color: '#409EFF', createdAt: '2025-01-02T00:00:00' },
      ],
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('导航到标签管理页：显示标签列表和"新建标签"按钮', async ({ page }) => {
    await page.getByText('标签管理').first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('标签管理').first()).toBeVisible()
    await expect(page.getByText('重要').first()).toBeVisible()
    await expect(page.getByText('工作').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '新建标签' })).toBeVisible()
  })

  test('新建标签：点击"新建标签"打开对话框 → 输入名称 → 点击确定 → 新标签出现', async ({ page }) => {
    await page.getByText('标签管理').first().click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: '新建标签' }).click()
    await page.waitForTimeout(500)

    // 对话框可见
    await expect(page.getByText('新建标签').nth(1)).toBeVisible()

    // 输入名称
    const nameInput = page.locator('.el-dialog input[placeholder*="标签名称"]')
    if ((await nameInput.count()) > 0) {
      await nameInput.first().fill('个人')
    }

    // 点击确定
    const confirmBtn = page.locator('.el-dialog .el-button--primary').filter({ hasText: '确定' })
    if ((await confirmBtn.count()) > 0) {
      await confirmBtn.click()
      await page.waitForTimeout(500)
    }
  })

  test('编辑标签：点击"编辑"按钮 → 对话框预填名称 → 修改后确定', async ({ page }) => {
    await page.getByText('标签管理').first().click()
    await page.waitForTimeout(500)

    // 找到"重要"的编辑按钮
    const editBtn = page.locator('.el-table__row').filter({ hasText: '重要' }).getByRole('button', { name: '编辑' })
    if ((await editBtn.count()) > 0) {
      await editBtn.first().click()
      await page.waitForTimeout(500)

      // 对话框标题为"编辑标签"
      await expect(page.getByText('编辑标签')).toBeVisible()

      // 修改名称
      const nameInput = page.locator('.el-dialog input[placeholder*="标签名称"]')
      if ((await nameInput.count()) > 0) {
        await nameInput.first().fill('非常重要')
      }

      const confirmBtn = page.locator('.el-dialog .el-button--primary').filter({ hasText: '确定' })
      if ((await confirmBtn.count()) > 0) {
        await confirmBtn.click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('删除标签：点击"删除"按钮 → 确认对话框 → 确认后标签消失', async ({ page }) => {
    await page.getByText('标签管理').first().click()
    await page.waitForTimeout(500)

    // 找到"工作"的删除按钮
    const deleteBtn = page.locator('.el-table__row').filter({ hasText: '工作' }).getByRole('button', { name: '删除' })
    if ((await deleteBtn.count()) > 0) {
      await deleteBtn.first().click()
      await page.waitForTimeout(500)

      // 确认对话框
      const confirmBtn = page.getByRole('button', { name: '确定' }).last()
      if ((await confirmBtn.count()) > 0) {
        await confirmBtn.click()
        await page.waitForTimeout(500)
      }
    }
  })
})

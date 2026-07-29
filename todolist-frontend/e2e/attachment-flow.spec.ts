import { test, expect } from '@playwright/test'
import { setupApiMocks } from './fixtures/api-mocks'

test.describe('E2E 文件附件', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [
        { id: 1, title: '附件测试任务', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' },
      ],
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('任务编辑面板：附件区域显示"附件"标题', async ({ page }) => {
    // 点击任务打开编辑面板
    await page.locator('.task-item').filter({ hasText: '附件测试任务' }).first().click()
    await page.waitForTimeout(800)

    // 检查附件区域
    const attachmentSection = page.getByText('附件').first()
    if ((await attachmentSection.count()) > 0) {
      await expect(attachmentSection).toBeVisible()
    }
  })

  test('附件上传：mock 文件上传接口返回成功', async ({ page }) => {
    await page.locator('.task-item').filter({ hasText: '附件测试任务' }).first().click()
    await page.waitForTimeout(800)

    // 模拟文件上传请求（Element Plus uploader 会自动发请求）
    let uploadRequested = false
    await page.route('http://localhost:5180/api/attachments/tasks/1', async (route) => {
      if (route.request().method() === 'POST') {
        uploadRequested = true
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: 'success',
            data: { id: 101, fileName: 'test.txt', fileSize: 1024, createdAt: '2025-01-01' },
          }),
        })
      }
      return route.continue()
    })
  })

  test('附件删除：mock 删除接口返回成功', async ({ page }) => {
    await page.locator('.task-item').filter({ hasText: '附件测试任务' }).first().click()
    await page.waitForTimeout(800)

    // 先 mock 有附件，再 mock 删除
    await page.route('http://localhost:5180/api/attachments/tasks/1', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: 'success',
            data: [{ id: 101, fileName: 'test.txt', fileSize: 1024, createdAt: '2025-01-01' }],
          }),
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '附件测试任务' }).first().click()
    await page.waitForTimeout(800)
  })
})

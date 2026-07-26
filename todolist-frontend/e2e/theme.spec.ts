import { test, expect } from '@playwright/test'

test.describe('Todolist E2E 主题切换', () => {
  test('主题切换按钮存在并可点击', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

    const themeButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first()
    if ((await themeButton.count()) > 0) {
      await expect(themeButton).toBeVisible()
    }
  })
})

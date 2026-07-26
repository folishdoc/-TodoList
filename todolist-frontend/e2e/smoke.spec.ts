import { test, expect } from '@playwright/test'

test.describe('Todolist E2E 烟雾测试', () => {
  test('应用首页能正常加载并显示核心 UI', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(response?.ok()).toBeTruthy()

    const root = page.locator('#app')
    await expect(root).toBeVisible()

    const html = (await root.innerHTML()).trim()
    expect(html.length).toBeGreaterThan(0)
  })

  test('页面无致命 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => {
      errors.push(err.message)
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    expect(errors).toEqual([])
  })

  test('页面至少有一个交互元素（按钮或输入框）', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const interactiveCount = await page.evaluate(() => {
      return document.querySelectorAll('button, input, textarea, select, a[href]').length
    })

    expect(interactiveCount).toBeGreaterThan(0)
  })
})

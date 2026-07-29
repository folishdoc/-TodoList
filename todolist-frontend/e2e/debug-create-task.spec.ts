/**
 * 调试：新建任务流程 — 连真实后端（Vite proxy），记录所有 console 错误
 */
import { test, expect } from '@playwright/test'

test.describe('debug: create task flow', () => {
  test('login + create task + check errors', async ({ page }) => {
    const consoleErrors: string[] = []
    const allLogs: string[] = []

    page.on('console', (msg) => {
      const text = msg.text()
      allLogs.push(`[${msg.type()}] ${text}`)
      if (msg.type() === 'error') {
        consoleErrors.push(`[console.error] ${text}`)
      }
    })
    page.on('pageerror', (err) => {
      consoleErrors.push(`[pageerror] ${err.message}`)
    })
    page.on('response', (resp) => {
      if (resp.url().includes('/api/')) {
        allLogs.push(`[api] ${resp.status()} ${resp.url()}`)
      }
    })

    // 不拦截 API，让 Vite proxy 转发到真实后端

    // 打开应用
    await page.goto('/', { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(800)

    // 检查是否在登录页
    const loginBtn = page.getByRole('button', { name: '登录' })
    const onLoginPage = await loginBtn.isVisible().catch(() => false)
    console.log(`[debug] On login page: ${onLoginPage}`)

    if (onLoginPage) {
      await page.locator('input[placeholder="请输入用户名"]').fill('admin')
      await page.locator('input[placeholder="请输入密码"]').fill('admin123')
      await loginBtn.click()
      await page.waitForTimeout(3000)
    }

    // 检查是否在 Dashboard
    const newBtn = page.getByRole('button', { name: '新建任务' })
    const inDashboard = await newBtn.isVisible().catch(() => false)
    console.log(`[debug] In dashboard: ${inDashboard}`)
    console.log(`[debug] URL: ${page.url()}`)

    if (inDashboard) {
      await newBtn.click()
      await page.waitForTimeout(800)

      const titleInput = page.locator('input[placeholder*="任务标题"]')
      const inputVisible = await titleInput.isVisible().catch(() => false)
      console.log(`[debug] Title input visible: ${inputVisible}`)

      if (inputVisible) {
        await titleInput.fill('Playwright create test')
        await page.waitForTimeout(300)

        // 点对话框底部的确定按钮
        const dialogFooter = page.locator('.el-dialog__footer')
        const confirmBtn = dialogFooter.locator('button:has-text("确定")')
        if (await confirmBtn.isVisible().catch(() => false)) {
          await confirmBtn.click()
        } else {
          // fallback
          await page.locator('button:has-text("确定"):visible').last().click().catch(() => {})
        }
        await page.waitForTimeout(1500)
        console.log('[debug] Submitted task creation')
      }
    }

    // 打印所有日志
    console.log(`\n=== All API responses ===`)
    for (const log of allLogs.filter(l => l.startsWith('[api]'))) {
      console.log(log)
    }

    console.log(`\n=== Console errors (${consoleErrors.length}) ===`)
    for (const err of consoleErrors) {
      console.log(err)
    }

    if (consoleErrors.length === 0) {
      console.log('\n✅ No console errors!')
    }
  })
})

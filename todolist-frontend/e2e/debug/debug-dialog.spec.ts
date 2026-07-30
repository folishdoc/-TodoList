import { test, expect } from '@playwright/test'

test('debug: 严格验证新建任务对话框', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`)
    console.log(`[browser ${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', (err) => {
    errors.push(`[pageerror] ${err.message}`)
    console.log(`[pageerror] ${err.message}`)
  })

  // 登录真实后端
  await page.goto('/#/login', { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(500)

  // 检查是否在登录页
  console.log('\n=== 页面状态 ===')
  console.log('URL:', page.url())

  const loginBtn = page.getByRole('button', { name: '登录' })
  const onLoginPage = await loginBtn.isVisible()
  console.log('登录页?:', onLoginPage)

  if (onLoginPage) {
    await page.locator('input[placeholder="请输入用户名"]').fill('admin')
    await page.locator('input[placeholder="请输入密码"]').fill('admin123')
    await loginBtn.click()
    await page.waitForTimeout(2000)
    console.log('登录后 URL:', page.url())
  }

  // 确认在 dashboard
  const newBtn = page.getByRole('button', { name: '新建任务' })
  const inDashboard = await newBtn.isVisible().catch(() => false)
  console.log('Dashboard 可见?:', inDashboard)

  if (!inDashboard) {
    console.log('\n=== 页面内容片段 ===')
    const bodyText = await page.locator('body').innerText()
    console.log(bodyText.substring(0, 500))
    console.log('\n=== Console 错误 ===')
    for (const e of errors) console.log(e)
    return
  }

  // 点击新建任务
  await newBtn.click()
  await page.waitForTimeout(1000)

  // 检查对话框
  const dialog = page.locator('.el-dialog')
  const dialogVisible = await dialog.isVisible().catch(() => false)
  console.log(`对话框可见: ${dialogVisible}`)

  if (dialogVisible) {
    const title = await dialog.locator('.el-dialog__title').textContent()
    console.log(`对话框标题: ${title}`)
  }

  // 检查标题输入框
  const titleInput = page.locator('input[placeholder*="任务标题"]')
  const inputVisible = await titleInput.isVisible().catch(() => false)
  console.log(`标题输入框可见: ${inputVisible}`)

  if (!dialogVisible || !inputVisible) {
    await page.screenshot({ path: '/tmp/debug-dialog-fail.png' })
    console.log('\n=== Console 错误 ===')
    for (const e of errors) console.log(e)
  }

  expect(dialogVisible).toBe(true)
  expect(inputVisible).toBe(true)
})

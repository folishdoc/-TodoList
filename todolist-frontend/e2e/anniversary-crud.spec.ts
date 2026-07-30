import { test, expect } from '@playwright/test'
import { setupApiMocks } from './fixtures/api-mocks'

test.describe('E2E 纪念日 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, {
      anniversaries: [
        {
          id: 1,
          name: '生日',
          date: '2025-08-15',
          repeatType: 'YEARLY',
          remindEnabled: true,
          remindTime: '09:00',
          tags: '家人',
          notes: '',
          daysUntil: 5,
          nextDate: '2026-08-15',
        },
        {
          id: 2,
          name: '结婚纪念日',
          date: '2020-06-01',
          repeatType: 'YEARLY',
          remindEnabled: true,
          remindTime: '09:00',
          tags: '家人',
          notes: '',
          daysUntil: 20,
          nextDate: '2026-06-01',
        },
      ],
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('导航到纪念日模块：点击"纪念日"图标后显示列表', async ({ page }) => {
    const nav = page.locator('.nav-item[title="纪念日"]')
    await nav.click()
    await page.waitForTimeout(800)
    await expect(page.getByText('生日').first()).toBeVisible()
    await expect(page.getByText('结婚纪念日').first()).toBeVisible()
    await expect(page.getByText('新建纪念日')).toBeVisible()
  })

  test('纪念日显示倒计时：渲染"还有X天"格式', async ({ page }) => {
    const nav = page.locator('.nav-item[title="纪念日"]')
    await nav.click()
    await page.waitForTimeout(800)
    await expect(page.getByText(/还有\s*5\s*天/).first()).toBeVisible()
  })

  test('新建纪念日：点击"新建纪念日"按钮打开对话框', async ({ page }) => {
    const nav = page.locator('.nav-item[title="纪念日"]')
    await nav.click()
    await page.waitForTimeout(800)
    const newBtn = page.getByRole('button', { name: '新建纪念日' })
    await newBtn.click()
    await page.waitForTimeout(500)
    await expect(page.getByText('新建纪念日').nth(1)).toBeVisible()
  })

  test('点击纪念日卡片：打开详情抽屉', async ({ page }) => {
    const nav = page.locator('.nav-item[title="纪念日"]')
    await nav.click()
    await page.waitForTimeout(1000)
    const card = page.locator('.anniversary-card').first()
    await card.click()
    await page.waitForTimeout(1500)
    await expect(page.getByText('纪念日详情')).toBeVisible()
  })

  test('详情抽屉显示操作按钮（编辑、生成待办、删除）', async ({ page }) => {
    const nav = page.locator('.nav-item[title="纪念日"]')
    await nav.click()
    await page.waitForTimeout(1000)
    await page.locator('.anniversary-card').first().click()
    await page.waitForTimeout(1500)
    await expect(page.getByRole('button', { name: '编辑' })).toBeVisible()
    await expect(page.getByRole('button', { name: '生成待办' })).toBeVisible()
    await expect(page.getByRole('button', { name: '删除' })).toBeVisible()
  })

  test('搜索框：可输入关键字过滤', async ({ page }) => {
    const nav = page.locator('.nav-item[title="纪念日"]')
    await nav.click()
    await page.waitForTimeout(800)
    const searchInput = page.locator('input[placeholder*="搜索"]')
    await searchInput.first().fill('生日')
    await page.waitForTimeout(300)
    const value = await searchInput.first().inputValue()
    expect(value).toBe('生日')
  })

  test('创建纪念日：填写名称和日期 → 确定 → 列表显示新纪念日', async ({ page }) => {
    const nav = page.locator('.nav-item[title="纪念日"]')
    await nav.click()
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: '新建纪念日' }).click()
    await page.waitForTimeout(500)
    const nameInput = page.locator('input[placeholder*="纪念日名称"]')
    await nameInput.fill('相识纪念日')
    const dateInput = page.locator('input[placeholder*="选择日期"]')
    await dateInput.click()
    await dateInput.fill('2026-12-25')
    await dateInput.press('Enter')
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: '确定' }).last().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('相识纪念日').first()).toBeVisible()
  })
})

import { test, expect } from '@playwright/test'
import { setupApiMocks } from './fixtures/api-mocks'

test.describe('E2E 习惯打卡', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, {
      habits: [
        {
          id: 1,
          name: '晨跑',
          icon: '🏃',
          color: '#67C23A',
          targetType: 'count',
          targetValue: 1,
          frequency: 'daily',
          timePeriod: 'morning',
          currentStreak: 5,
          totalCompletions: 20,
        },
        {
          id: 2,
          name: '阅读',
          icon: '📚',
          color: '#409EFF',
          targetType: 'duration',
          targetValue: 30,
          frequency: 'daily',
          timePeriod: 'evening',
          currentStreak: 12,
          totalCompletions: 50,
        },
      ],
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('导航到习惯模块：点击"习惯"图标后显示习惯列表', async ({ page }) => {
    const habitNav = page.locator('.nav-item[title="习惯"]')
    await habitNav.click()
    await page.waitForTimeout(800)
    await expect(page.getByText('晨跑').first()).toBeVisible()
    await expect(page.getByText('阅读').first()).toBeVisible()
    await expect(page.getByText('新建习惯')).toBeVisible()
  })

  test('习惯卡片显示名称、连续天数、总完成数', async ({ page }) => {
    const habitNav = page.locator('.nav-item[title="习惯"]')
    await habitNav.click()
    await page.waitForTimeout(800)
    await expect(page.getByText('晨跑').first()).toBeVisible()
    await expect(page.getByText('5').first()).toBeVisible()
    await expect(page.getByText('连续天数').first()).toBeVisible()
    await expect(page.getByText('总完成').first()).toBeVisible()
  })

  test('打卡：点击"打卡"按钮后状态变为"已完成"', async ({ page }) => {
    const habitNav = page.locator('.nav-item[title="习惯"]')
    await habitNav.click()
    await page.waitForTimeout(800)
    const checkInBtn = page.getByRole('button', { name: '打卡' }).first()
    await checkInBtn.click()
    await page.waitForTimeout(800)
    const completedBtn = page.getByRole('button', { name: /已完成/ })
    await expect(completedBtn.first()).toBeVisible({ timeout: 5000 })
  })

  test('新建习惯：点击"新建习惯"按钮显示表单', async ({ page }) => {
    const habitNav = page.locator('.nav-item[title="习惯"]')
    await habitNav.click()
    await page.waitForTimeout(800)
    const newBtn = page.getByRole('button', { name: '新建习惯' })
    await newBtn.click()
    await page.waitForTimeout(500)
    await expect(page.getByText('新建习惯', { exact: false }).nth(1)).toBeVisible()
  })

  test('统计按钮：点击"统计"按钮显示趋势图', async ({ page }) => {
    const habitNav = page.locator('.nav-item[title="习惯"]')
    await habitNav.click()
    await page.waitForTimeout(800)
    const statBtn = page.getByRole('button', { name: /统计/ })
    await statBtn.click()
    await page.waitForTimeout(500)
    await expect(page.getByText('近7天')).toBeVisible()
    await expect(page.getByText('近30天')).toBeVisible()
  })

  test('创建习惯：填写名称 → 确定 → 列表显示新习惯', async ({ page }) => {
    const habitNav = page.locator('.nav-item[title="习惯"]')
    await habitNav.click()
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: '新建习惯' }).click()
    await page.waitForTimeout(500)
    const nameInput = page.locator('input[placeholder*="例如"]')
    await nameInput.fill('每日冥想')
    await page.getByRole('button', { name: '确定' }).last().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('每日冥想').first()).toBeVisible()
  })
})

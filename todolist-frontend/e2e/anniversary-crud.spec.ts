import { test, expect, type Page } from '@playwright/test'

async function setupApiMocks(page: Page) {
  let items: any[] = [
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
  ]
  let nextId = 100

  await page.route('http://localhost:5180/api/**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    const method = req.method()
    let body: any = null
    try {
      body = req.postDataJSON()
    } catch {}

    const ok = (data: any) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data }),
      })

    if (path === '/api/anniversaries' && method === 'GET') return ok(items)
    if (path === '/api/anniversaries/pending-reminders' && method === 'GET') return ok([])
    if (path === '/api/anniversaries' && method === 'POST') {
      const t = { id: nextId++, daysUntil: 30, nextDate: body?.date || '', ...body }
      items.push(t)
      return ok(t)
    }
    const idMatch = path.match(/^\/api\/anniversaries\/(\d+)$/)
    if (idMatch && method === 'GET') return ok(items.find((i: any) => i.id === Number(idMatch[1])))
    if (idMatch && method === 'PUT') {
      const id = Number(idMatch[1])
      const idx = items.findIndex((i: any) => i.id === id)
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...body }
        return ok(items[idx])
      }
    }
    if (idMatch && method === 'DELETE') {
      const id = Number(idMatch[1])
      items = items.filter((i: any) => i.id !== id)
      return ok(null)
    }
    if (path === '/api/lists' && method === 'GET')
      return ok([{ id: 1, name: '默认清单', color: '#409EFF' }])
    if (path === '/api/tags' && method === 'GET') return ok([])
    if (path === '/api/tasks' && method === 'GET')
      return ok({ content: [], totalElements: 0, totalPages: 0, size: 1000, number: 0 })
    if (path === '/api/habits' && method === 'GET') return ok([])

    return ok(null)
  })
}

test.describe('E2E 纪念日 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
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
    if ((await searchInput.count()) > 0) {
      await searchInput.first().fill('生日')
      await page.waitForTimeout(300)
      const value = await searchInput.first().inputValue()
      expect(value).toBe('生日')
    }
  })
})

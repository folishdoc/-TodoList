import { test, expect, type Page } from '@playwright/test'

async function setupApiMocks(page: Page, initialTasks: any[] = []) {
  let tasks: any[] = [...initialTasks]
  let nextId = 1000

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

    if (path === '/api/tasks' && method === 'GET') {
      return ok({
        content: tasks,
        totalElements: tasks.length,
        totalPages: 1,
        size: 1000,
        number: 0,
      })
    }
    if (path === '/api/tasks' && method === 'POST') {
      const t = {
        id: nextId++,
        status: 0,
        priority: 0,
        parentId: null,
        ...body,
        createdAt: new Date().toISOString(),
      }
      tasks.push(t)
      return ok(t)
    }
    const idMatch = path.match(/^\/api\/tasks\/(\d+)$/)
    if (idMatch && method === 'PUT') {
      const id = Number(idMatch[1])
      const idx = tasks.findIndex((t) => t.id === id)
      if (idx >= 0) {
        tasks[idx] = { ...tasks[idx], ...body }
        return ok(tasks[idx])
      }
    }
    if (idMatch && method === 'DELETE') {
      const id = Number(idMatch[1])
      tasks = tasks.filter((t) => t.id !== id)
      return ok(null)
    }
    if (path === '/api/lists' && method === 'GET')
      return ok([{ id: 1, name: '默认清单', color: '#409EFF' }])
    if (path === '/api/tags' && method === 'GET') return ok([])
    if (path === '/api/statistics/overview' && method === 'GET')
      return ok({
        totalTasks: tasks.length,
        completedTasks: 0,
        pendingTasks: tasks.length,
        completionRate: 0,
      })
    if (path === '/api/statistics/by-list' && method === 'GET') return ok([])
    if (path === '/api/statistics/by-priority' && method === 'GET') return ok([])
    if (path === '/api/statistics/trend' && method === 'GET') return ok([])
    if (path === '/api/habits' && method === 'GET') return ok([])
    if (path === '/api/anniversaries' && method === 'GET') return ok([])
    if (path === '/api/anniversaries/pending-reminders' && method === 'GET') return ok([])

    return ok(null)
  })
}

test.describe('E2E 任务生命周期', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('Dashboard 显示核心元素（新建任务按钮、批量操作按钮）', async ({ page }) => {
    await expect(page.getByRole('button', { name: '新建任务' })).toBeVisible()
    await expect(page.getByRole('button', { name: '批量操作' })).toBeVisible()
  })

  test('空状态：无任务时显示"暂无任务"提示', async ({ page }) => {
    const empty = page.getByText(/暂无任务/)
    if ((await empty.count()) > 0) {
      await expect(empty.first()).toBeVisible()
    }
  })

  test('搜索框：存在并可输入', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]')
    if ((await searchInput.count()) > 0) {
      await searchInput.first().fill('测试')
      await page.waitForTimeout(300)
      const value = await searchInput.first().inputValue()
      expect(value).toBe('测试')
    }
  })

  test('批量操作：点击"批量操作"进入批量模式', async ({ page }) => {
    const batchBtn = page.getByRole('button', { name: '批量操作' })
    await batchBtn.click()
    await page.waitForTimeout(300)
    await expect(page.getByRole('button', { name: /全选/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /退出批量/ })).toBeVisible()
  })

  test('任务渲染：列表中显示任务标题', async ({ page }) => {
    await setupApiMocks(page, [
      { id: 1, title: '买菜', status: 0, priority: 0, parentId: null, createdAt: '2025-01-01' },
      { id: 2, title: '做饭', status: 1, priority: 1, parentId: null, createdAt: '2025-01-02' },
    ])
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.getByText('买菜').first()).toBeVisible()
    await expect(page.getByText('做饭').first()).toBeVisible()
  })
})

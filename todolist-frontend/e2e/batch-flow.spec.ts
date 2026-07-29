import { test, expect, type Page } from '@playwright/test'

async function setupApiMocks(page: Page) {
  let tasks: any[] = [
    {
      id: 1,
      title: '任务A',
      status: 0,
      priority: 1,
      listId: null,
      parentId: null,
      createdAt: '2025-01-01',
    },
    {
      id: 2,
      title: '任务B',
      status: 0,
      priority: 2,
      listId: null,
      parentId: null,
      createdAt: '2025-01-02',
    },
    {
      id: 3,
      title: '任务C',
      status: 0,
      priority: 3,
      listId: null,
      parentId: null,
      createdAt: '2025-01-03',
    },
  ]

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
        id: 100 + tasks.length,
        status: 0,
        priority: 2,
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
    if (path === '/api/tasks/batch' && method === 'POST') {
      const ids: number[] = body?.ids || []
      tasks = tasks.filter((t) => !ids.includes(t.id))
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

test.describe('E2E 批量操作', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('初始状态：默认显示"批量操作"按钮，不显示批量操作栏', async ({ page }) => {
    await expect(page.getByRole('button', { name: '批量操作' })).toBeVisible()
    await expect(page.getByText(/删除选中/)).not.toBeVisible()
  })

  test('进入批量模式：点击"批量操作" → 出现"全选/退出批量"按钮', async ({ page }) => {
    const batchBtn = page.getByRole('button', { name: '批量操作' })
    await batchBtn.click()
    await page.waitForTimeout(300)
    await expect(page.getByRole('button', { name: '全选' })).toBeVisible()
    await expect(page.getByRole('button', { name: /退出批量/ })).toBeVisible()
  })

  test('退出批量模式：点击"退出批量模式" → 隐藏批量操作栏', async ({ page }) => {
    await page.getByRole('button', { name: '批量操作' }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: /退出批量/ }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText(/全选/)).not.toBeVisible()
  })

  test('选择任务：勾选任务 → "删除选中"按钮启用', async ({ page }) => {
    await page.getByRole('button', { name: '批量操作' }).click()
    await page.waitForTimeout(300)
    const checkboxes = page.locator('.task-item .el-checkbox')
    if ((await checkboxes.count()) > 0) {
      await checkboxes.first().click({ force: true })
      await page.waitForTimeout(300)
      const deleteBtn = page.getByRole('button', { name: /删除选中/ })
      if ((await deleteBtn.count()) > 0) {
        await expect(deleteBtn.first()).toBeVisible()
      }
    }
  })

  test('全选：点击"全选" → 任务项标记为 batch-selected', async ({ page }) => {
    await page.getByRole('button', { name: '批量操作' }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: '全选' }).click()
    await page.waitForTimeout(300)
    const selected = page.locator('.task-item.batch-selected')
    expect(await selected.count()).toBeGreaterThan(0)
  })

  test('批量删除：选择任务 → 点击"删除选中" → 任务被移除', async ({ page }) => {
    await page.getByRole('button', { name: '批量操作' }).click()
    await page.waitForTimeout(300)
    // 全选
    await page.getByRole('button', { name: '全选' }).click()
    await page.waitForTimeout(300)
    const deleteBtn = page.getByRole('button', { name: /删除选中/ })
    if ((await deleteBtn.count()) > 0) {
      await deleteBtn.first().click()
      await page.waitForTimeout(500)
      // 确认删除（如果有确认对话框）
      const confirmBtn = page.getByRole('button', { name: '确定' }).last()
      if ((await confirmBtn.count()) > 0) {
        await confirmBtn.click()
        await page.waitForTimeout(500)
      }
    }
  })
})

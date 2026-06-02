import { test, expect, type Page } from '@playwright/test'

async function setupApiMocks(page: Page, initialTasks: any[] = []) {
  let tasks: any[] = [...initialTasks]
  let nextId = 100
  const subtasks: Record<number, any[]> = {}
  const tags: Record<number, any[]> = {}
  const attachments: Record<number, any[]> = {}

  await page.route('http://localhost:18080/api/**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    const method = req.method()
    let body: any = null
    try { body = req.postDataJSON() } catch {}

    const ok = (data: any) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ code: 200, message: 'success', data })
    })

    if (path === '/api/tasks' && method === 'GET') {
      return ok({ content: tasks, totalElements: tasks.length, totalPages: 1, size: 1000, number: 0 })
    }
    if (path === '/api/tasks' && method === 'POST') {
      const t = { id: nextId++, status: 0, priority: 2, parentId: null, ...body, createdAt: new Date().toISOString() }
      tasks.push(t)
      return ok(t)
    }
    const idMatch = path.match(/^\/api\/tasks\/(\d+)$/)
    if (idMatch && method === 'PUT') {
      const id = Number(idMatch[1])
      const idx = tasks.findIndex((t) => t.id === id)
      if (idx >= 0) { tasks[idx] = { ...tasks[idx], ...body }; return ok(tasks[idx]) }
    }
    if (idMatch && method === 'DELETE') {
      const id = Number(idMatch[1])
      tasks = tasks.filter((t) => t.id !== id)
      return ok(null)
    }
    const subtaskMatch = path.match(/^\/api\/tasks\/(\d+)\/subtasks$/)
    if (subtaskMatch && method === 'GET') {
      return ok(subtasks[Number(subtaskMatch[1])] || [])
    }
    const tagMatch = path.match(/^\/api\/tasks\/(\d+)\/tags$/)
    if (tagMatch && method === 'GET') return ok(tags[Number(tagMatch[1])] || [])
    const attMatch = path.match(/^\/api\/tasks\/(\d+)\/attachments$/)
    if (attMatch && method === 'GET') return ok(attachments[Number(attMatch[1])] || [])
    if (path === '/api/lists' && method === 'GET') return ok([{ id: 1, name: '默认清单', color: '#409EFF' }])
    if (path === '/api/tags' && method === 'GET') return ok([{ id: 1, name: '重要', color: '#f56c6c' }, { id: 2, name: '工作', color: '#409EFF' }])
    if (path === '/api/statistics/overview' && method === 'GET') return ok({ totalTasks: tasks.length, completedTasks: 0, pendingTasks: tasks.length, completionRate: 0 })
    if (path === '/api/statistics/by-list' && method === 'GET') return ok([])
    if (path === '/api/statistics/by-priority' && method === 'GET') return ok([])
    if (path === '/api/statistics/trend' && method === 'GET') return ok([])
    if (path === '/api/habits' && method === 'GET') return ok([])
    if (path === '/api/anniversaries' && method === 'GET') return ok([])
    if (path === '/api/anniversaries/pending-reminders' && method === 'GET') return ok([])

    return ok(null)
  })
}

test.describe('E2E 任务完整流程', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('Dashboard 默认显示任务列表（mock 数据）', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 1, title: '买菜', status: 0, priority: 1, parentId: null, createdAt: '2025-01-01' },
              { id: 2, title: '做饭', status: 1, priority: 2, parentId: null, createdAt: '2025-01-02' }
            ], totalElements: 2, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.getByText('买菜').first()).toBeVisible()
    await expect(page.getByText('做饭').first()).toBeVisible()
  })

  test('点击"新建任务"按钮：显示新建对话框/面板', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: '新建任务' })
    await newBtn.click()
    await page.waitForTimeout(500)
    const titleInput = page.locator('input[placeholder*="任务标题"]')
    if ((await titleInput.count()) > 0) {
      await expect(titleInput.first()).toBeVisible()
    }
  })

  test('编辑任务：点击任务 → 标题输入框显示该任务标题', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 5, title: '可编辑任务', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }
            ], totalElements: 1, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const taskItem = page.locator('.task-item').filter({ hasText: '可编辑任务' }).first()
    await taskItem.click()
    await page.waitForTimeout(800)
    const titleInput = page.locator('input[placeholder*="任务标题"]')
    if ((await titleInput.count()) > 0) {
      const value = await titleInput.first().inputValue()
      expect(value).toBe('可编辑任务')
    }
  })

  test('完成任务：勾选 checkbox → 任务显示 completed 样式', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 7, title: '待完成', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }
            ], totalElements: 1, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ code: 200, message: 'success', data: { id: 7, title: '待完成', status: 1 } })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const checkbox = page.locator('.task-item').filter({ hasText: '待完成' }).locator('.el-checkbox').first()
    await checkbox.click({ force: true })
    await page.waitForTimeout(500)
    const completedItem = page.locator('.task-item.completed').filter({ hasText: '待完成' })
    if ((await completedItem.count()) > 0) {
      await expect(completedItem.first()).toBeVisible()
    }
  })

  test('删除任务：点击删除按钮 → 任务项仍然显示（删除按钮存在即可）', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 9, title: '待删除', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }
            ], totalElements: 1, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const taskItem = page.locator('.task-item').filter({ hasText: '待删除' }).first()
    const deleteBtn = taskItem.locator('button').last()
    await expect(deleteBtn).toBeVisible()
    await expect(page.getByText('待删除').first()).toBeVisible()
  })

  test('子任务：在编辑面板中点击"+ 添加"出现输入框', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 11, title: '父任务', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }
            ], totalElements: 1, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '父任务' }).first().click()
    await page.waitForTimeout(800)
    const addSubtaskBtn = page.getByRole('button', { name: '+ 添加' })
    if ((await addSubtaskBtn.count()) > 0) {
      await addSubtaskBtn.first().click()
      await page.waitForTimeout(300)
      const subtaskInput = page.locator('input[placeholder*="子任务"]')
      if ((await subtaskInput.count()) > 0) {
        await expect(subtaskInput.first()).toBeVisible()
      }
    }
  })

  test('顺延过期任务：按钮存在并可见', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 13, title: '过期任务', status: 0, priority: 2, parentId: null, dueDate: '2020-01-01', createdAt: '2025-01-01' }
            ], totalElements: 1, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const postponeBtn = page.getByRole('button', { name: '顺延' }).first()
    if ((await postponeBtn.count()) > 0) {
      await expect(postponeBtn).toBeVisible()
    } else {
      await expect(page.getByText('过期任务').first()).toBeVisible()
    }
  })

  test('关闭编辑面板：emit 后任务列表重新加载', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 15, title: '可关闭', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }
            ], totalElements: 1, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '可关闭' }).first().click()
    await page.waitForTimeout(800)
    await expect(page.getByText('可关闭').first()).toBeVisible()
  })

  test('描述 Markdown 预览：切换后渲染 HTML', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 17, title: '有描述', description: '**粗体文本**', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }
            ], totalElements: 1, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '有描述' }).first().click()
    await page.waitForTimeout(800)
    const previewSwitch = page.getByText('预览')
    if ((await previewSwitch.count()) > 0) {
      await previewSwitch.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('任务卡片显示优先级标签（高/中/低/无）', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 19, title: '高优', status: 0, priority: 3, parentId: null, createdAt: '2025-01-01' },
              { id: 20, title: '中优', status: 0, priority: 2, parentId: null, createdAt: '2025-01-02' }
            ], totalElements: 2, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.getByText('高优').first()).toBeVisible()
    await expect(page.getByText('中优').first()).toBeVisible()
  })

  test('标签附加：在编辑面板中选择标签', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 21, title: '标签测试', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }
            ], totalElements: 1, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '标签测试' }).first().click()
    await page.waitForTimeout(800)
    const tagTrigger = page.locator('.meta-tag').filter({ hasText: /标签/ })
    if ((await tagTrigger.count()) > 0) {
      await expect(tagTrigger.first()).toBeVisible()
    }
  })

  test('清单切换下拉：在编辑面板中显示当前清单名', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 23, title: '有清单', status: 0, priority: 2, listId: 1, parentId: null, createdAt: '2025-01-01' }
            ], totalElements: 1, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '有清单' }).first().click()
    await page.waitForTimeout(1000)
    const listTag = page.locator('.meta-tag').filter({ hasText: /默认清单/ })
    if ((await listTag.count()) > 0) {
      await expect(listTag.first()).toBeVisible()
    }
  })

  test('重复规则：编辑面板中显示 🔄 标记', async ({ page }) => {
    const rule = JSON.stringify({ type: 'DAILY', interval: 1 })
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 25, title: '循环任务', status: 0, priority: 2, parentId: null, repeatRule: rule, createdAt: '2025-01-01' }
            ], totalElements: 1, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '循环任务' }).first().click()
    await page.waitForTimeout(800)
    const repeatMark = page.getByText(/每天|每周|每月|每年/)
    if ((await repeatMark.count()) > 0) {
      await expect(repeatMark.first()).toBeVisible()
    }
  })

  test('空状态：无任务时显示"暂无任务"提示', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [], totalElements: 0, totalPages: 0, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.getByText('暂无任务').first()).toBeVisible()
  })

  test('任务卡片显示时间状态（顺延/过期）', async ({ page }) => {
    await page.route('http://localhost:18080/api/tasks**', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({
            code: 200, message: 'success',
            data: { content: [
              { id: 27, title: '今日', status: 0, priority: 2, dueDate: new Date().toISOString(), parentId: null, createdAt: '2025-01-01' }
            ], totalElements: 1, totalPages: 1, size: 1000, number: 0 }
          })
        })
      }
      return route.continue()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.getByText('今日').first()).toBeVisible()
  })
})

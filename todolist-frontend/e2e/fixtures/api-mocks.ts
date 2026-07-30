/**
 * 共享 API Mock 工具
 *
 * 为 Playwright E2E 测试提供统一的 `setupApiMocks`。
 * 覆盖所有后端 API 端点，支持 in-memory CRUD 状态追踪。
 * 每个新测试文件应优先使用此 fixture，而非手写重复的 route handler。
 *
 * 使用方式：
 * ```ts
 * import { setupApiMocks } from './fixtures/api-mocks'
 *
 * test.beforeEach(async ({ page }) => {
 *   await setupApiMocks(page, {
 *     tasks: [{ id: 1, title: '测试', status: 0 }],
 *     tags: [{ id: 1, name: '重要', color: '#f56c6c' }],
 *   })
 *   await page.goto('/')
 *   await page.waitForLoadState('networkidle')
 *   await page.waitForTimeout(1500)
 * })
 * ```
 */

import { type Page } from '@playwright/test'

export interface StatisticsData {
  overview?: { totalTasks: number; completedTasks: number; pendingTasks: number; completionRate: number }
  byList?: Array<{ name: string; count: number; color: string }>
  byPriority?: Array<{ name: string; count: number; color: string }>
  trend?: Array<{ date: string; created: number; completed: number }>
}

export interface MockConfig {
  tasks?: any[]
  lists?: any[]
  tags?: any[]
  habits?: any[]
  anniversaries?: any[]
  statistics?: StatisticsData
  /** 自定义路由处理，返回 true 表示已处理 */
  extraRoute?: (path: string, method: string, body: any, ok: (data: any) => void, route: any) => boolean | Promise<boolean>
}

const API_BASE = 'http://localhost:5180'

export async function setupApiMocks(page: Page, config: MockConfig = {}) {
  // 深拷贝初始数据，避免跨测试污染
  let tasks: any[] = config.tasks ? JSON.parse(JSON.stringify(config.tasks)) : []
  let lists: any[] = config.lists
    ? JSON.parse(JSON.stringify(config.lists))
    : [{ id: 1, name: '默认清单', color: '#409EFF' }]
  let tags: any[] = config.tags ? JSON.parse(JSON.stringify(config.tags)) : []
  let habits: any[] = config.habits ? JSON.parse(JSON.stringify(config.habits)) : []
  let anniversaries: any[] = config.anniversaries ? JSON.parse(JSON.stringify(config.anniversaries)) : []
  let nextId = 100
  const subtasks: Record<number, any[]> = {}
  const taskTags: Record<number, any[]> = {}
  /** 今日打卡记录，checkin 时写入 */
  let todayCheckinRecords: any[] = []

  await page.route(`${API_BASE}/api/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    const method = req.method()
    let body: any = null
    try {
      body = req.postDataJSON()
    } catch { /* skip non-json */ }

    const ok = (data: any) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, message: 'success', data }),
      })

    const blobOk = (data: string, contentType: string = 'text/csv') =>
      route.fulfill({
        status: 200,
        contentType,
        body: data,
      })

    // ── 自定义路由（优先于默认路由） ──
    if (config.extraRoute) {
      const handled = await config.extraRoute(path, method, body, ok, route)
      if (handled) return
    }

    // ── Tasks ──
    if (path === '/api/tasks' && method === 'GET') {
      return ok({ content: tasks, totalElements: tasks.length, totalPages: 1, size: 1000, number: 0 })
    }
    if (path === '/api/tasks/range' && method === 'GET') {
      return ok(tasks)
    }
    if (path === '/api/tasks' && method === 'POST') {
      const t = { id: nextId++, status: 0, priority: 2, parentId: null, ...body, createdAt: new Date().toISOString() }
      tasks.push(t)
      return ok(t)
    }
    const idMatch = path.match(/^\/api\/tasks\/(\d+)$/)
    if (idMatch && method === 'PUT') {
      const id = Number(idMatch[1])
      const idx = tasks.findIndex((t: any) => t.id === id)
      if (idx >= 0) { tasks[idx] = { ...tasks[idx], ...body }; return ok(tasks[idx]) }
    }
    if (idMatch && method === 'DELETE') {
      const id = Number(idMatch[1])
      tasks = tasks.filter((t: any) => t.id !== id)
      return ok(null)
    }
    if (idMatch && method === 'PATCH') {
      const id = Number(idMatch[1])
      const idx = tasks.findIndex((t: any) => t.id === id)
      if (idx >= 0) { tasks[idx] = { ...tasks[idx], ...body }; return ok(tasks[idx]) }
    }

    // ── Task complete/uncomplete ──
    const completeMatch = path.match(/^\/api\/tasks\/(\d+)\/(complete|uncomplete)$/)
    if (completeMatch) {
      const id = Number(completeMatch[1])
      const idx = tasks.findIndex((t: any) => t.id === id)
      if (idx >= 0) {
        tasks[idx] = { ...tasks[idx], status: completeMatch[2] === 'complete' ? 1 : 0 }
        return ok(tasks[idx])
      }
    }

    // ── Task time (drag reschedule) ──
    const timeMatch = path.match(/^\/api\/tasks\/(\d+)\/time$/)
    if (timeMatch && method === 'PATCH') {
      const id = Number(timeMatch[1])
      const idx = tasks.findIndex((t: any) => t.id === id)
      if (idx >= 0) { tasks[idx] = { ...tasks[idx], startDate: body?.startDate, dueDate: body?.dueDate }; return ok(tasks[idx]) }
    }

    // ── Subtasks ──
    const subtaskMatch = path.match(/^\/api\/tasks\/(\d+)\/subtasks$/)
    if (subtaskMatch && method === 'GET') return ok(subtasks[Number(subtaskMatch[1])] || [])
    if (subtaskMatch && method === 'POST') {
      const parentId = Number(subtaskMatch[1])
      const st = { id: nextId++, parentId, status: 0, ...body, createdAt: new Date().toISOString() }
      if (!subtasks[parentId]) subtasks[parentId] = []
      subtasks[parentId].push(st)
      tasks.push(st)
      return ok(st)
    }

    // ── Batch delete ──
    if (path === '/api/tasks/batch' && method === 'POST') {
      const ids: number[] = body?.ids || []
      tasks = tasks.filter((t: any) => !ids.includes(t.id))
      return ok(null)
    }

    // ── Repeat rules ──
    const repeatMatch = path.match(/^\/api\/tasks\/repeat\/(\d+)$/)
    if (repeatMatch && method === 'POST') {
      const id = Number(repeatMatch[1])
      const idx = tasks.findIndex((t: any) => t.id === id)
      if (idx >= 0) { tasks[idx].repeatRule = JSON.stringify(body); return ok(tasks[idx]) }
    }
    if (repeatMatch && method === 'DELETE') {
      const id = Number(repeatMatch[1])
      const idx = tasks.findIndex((t: any) => t.id === id)
      if (idx >= 0) { delete tasks[idx].repeatRule; return ok(null) }
    }
    if (path === '/api/tasks/repeat/generate' && method === 'POST') {
      return ok(null)
    }

    // ── Lists ──
    if (path === '/api/lists' && method === 'GET') return ok(lists)
    if (path === '/api/lists' && method === 'POST') {
      const l = { id: nextId++, ...body }
      lists.push(l)
      return ok(l)
    }
    const listIdMatch = path.match(/^\/api\/lists\/(\d+)$/)
    if (listIdMatch && method === 'PUT') {
      const id = Number(listIdMatch[1])
      const idx = lists.findIndex((l: any) => l.id === id)
      if (idx >= 0) { lists[idx] = { ...lists[idx], ...body }; return ok(lists[idx]) }
    }
    if (listIdMatch && method === 'DELETE') {
      const id = Number(listIdMatch[1])
      lists = lists.filter((l: any) => l.id !== id)
      return ok(null)
    }

    // ── Tags ──
    if (path === '/api/tags' && method === 'GET') return ok(tags)
    if (path === '/api/tags' && method === 'POST') {
      const t = { id: nextId++, ...body }
      tags.push(t)
      return ok(t)
    }
    const tagIdMatch = path.match(/^\/api\/tags\/(\d+)$/)
    if (tagIdMatch && method === 'PUT') {
      const id = Number(tagIdMatch[1])
      const idx = tags.findIndex((t: any) => t.id === id)
      if (idx >= 0) { tags[idx] = { ...tags[idx], ...body }; return ok(tags[idx]) }
    }
    if (tagIdMatch && method === 'DELETE') {
      const id = Number(tagIdMatch[1])
      tags = tags.filter((t: any) => t.id !== id)
      return ok(null)
    }

    // ── Task-Tag association ──
    const taskTagMatch = path.match(/^\/api\/tags\/tasks\/(\d+)$/)
    if (taskTagMatch && method === 'GET') return ok(taskTags[Number(taskTagMatch[1])] || [])
    if (taskTagMatch && method === 'POST') {
      const taskId = Number(taskTagMatch[1])
      if (!taskTags[taskId]) taskTags[taskId] = []
      taskTags[taskId].push(body)
      return ok(body)
    }
    if (taskTagMatch && method === 'DELETE') {
      const taskId = Number(taskTagMatch[1])
      if (body?.tagId && taskTags[taskId]) {
        taskTags[taskId] = taskTags[taskId].filter((t: any) => t.id !== body.tagId)
      }
      return ok(null)
    }

    // ── Habits ──
    if (path === '/api/habits' && method === 'GET') return ok(habits)
    const habitIdMatch = path.match(/^\/api\/habits\/(\d+)$/)
    if (habitIdMatch && method === 'GET') {
      const h = habits.find((h: any) => h.id === Number(habitIdMatch[1]))
      return ok(h || null)
    }
    if (path === '/api/habits' && method === 'POST') {
      const h = { id: nextId++, currentStreak: 0, totalCompletions: 0, ...body }
      habits.push(h)
      return ok(h)
    }
    if (habitIdMatch && method === 'PUT') {
      const id = Number(habitIdMatch[1])
      const idx = habits.findIndex((h: any) => h.id === id)
      if (idx >= 0) { habits[idx] = { ...habits[idx], ...body }; return ok(habits[idx]) }
    }
    if (habitIdMatch && method === 'DELETE') {
      const id = Number(habitIdMatch[1])
      habits = habits.filter((h: any) => h.id !== id)
      return ok(null)
    }

    // ── Habits checkin ──
    if (path === '/api/habits/records/today' && method === 'GET') {
      return ok(todayCheckinRecords)
    }
    const checkinMatch = path.match(/^\/api\/habits\/(\d+)\/checkin$/)
    if (checkinMatch && method === 'POST') {
      const id = Number(checkinMatch[1])
      const h = habits.find((h: any) => h.id === id)
      if (h) {
        const today = new Date().toISOString().slice(0, 10)
        const exists = todayCheckinRecords.some((r: any) => r.habitId === id && r.checkDate === today)
        if (!exists) {
          todayCheckinRecords.push({
            habitId: id,
            checkDate: today,
            completionValue: body?.completionValue ?? h.targetValue ?? 1,
            note: body?.note ?? '',
            isMakeup: body?.isMakeup ?? false,
            createdAt: new Date().toISOString(),
          })
          h.currentStreak++
          h.totalCompletions++
        }
        const record = todayCheckinRecords.find((r: any) => r.habitId === id && r.checkDate === today)
        return ok(record || null)
      }
      return ok(null)
    }
    if (checkinMatch && method === 'DELETE') {
      const id = Number(checkinMatch[1])
      todayCheckinRecords = todayCheckinRecords.filter((r: any) => r.habitId !== id)
      return ok(null)
    }
    const recordsMatch = path.match(/^\/api\/habits\/(\d+)\/records(\/range)?$/)
    if (recordsMatch && method === 'GET') return ok([])

    // ── Anniversaries ──
    if (path === '/api/anniversaries' && method === 'GET') return ok(anniversaries)
    if (path === '/api/anniversaries' && method === 'POST') {
      const a = { id: nextId++, daysUntil: 30, nextDate: body?.date || '', ...body }
      anniversaries.push(a)
      return ok(a)
    }
    const anniIdMatch = path.match(/^\/api\/anniversaries\/(\d+)$/)
    if (anniIdMatch && method === 'GET') return ok(anniversaries.find((a: any) => a.id === Number(anniIdMatch[1])))
    if (anniIdMatch && method === 'PUT') {
      const id = Number(anniIdMatch[1])
      const idx = anniversaries.findIndex((a: any) => a.id === id)
      if (idx >= 0) { anniversaries[idx] = { ...anniversaries[idx], ...body }; return ok(anniversaries[idx]) }
    }
    if (anniIdMatch && method === 'DELETE') {
      const id = Number(anniIdMatch[1])
      anniversaries = anniversaries.filter((a: any) => a.id !== id)
      return ok(null)
    }
    if (path === '/api/anniversaries/pending-reminders' && method === 'GET') return ok([])
    if (path.match(/^\/api\/anniversaries\/\d+\/generate-todo$/) && method === 'POST') {
      return ok({ id: nextId++, title: body?.title || '纪念日待办', status: 0 })
    }
    const remindReadMatch = path.match(/^\/api\/anniversaries\/reminders\/(\d+)\/read$/)
    if (remindReadMatch && method === 'PUT') return ok(null)

    // ── Attachments ──
    const attTaskMatch = path.match(/^\/api\/attachments\/tasks\/(\d+)$/)
    if (attTaskMatch && method === 'GET') return ok([])
    if (attTaskMatch && method === 'POST') {
      return ok({ id: nextId++, fileName: 'test.txt', fileSize: 1024, createdAt: new Date().toISOString() })
    }
    const attIdMatch = path.match(/^\/api\/attachments\/(\d+)$/)
    if (attIdMatch && method === 'DELETE') return ok(null)
    if (path.match(/^\/api\/attachments\/.+$/) && method === 'GET') {
      return blobOk('mock file content', 'application/octet-stream')
    }

    // ── Statistics ──
    if (config.statistics) {
      const s = config.statistics
      if (path === '/api/statistics/overview' && method === 'GET' && s.overview) return ok(s.overview)
      if (path === '/api/statistics/by-list' && method === 'GET' && s.byList) return ok(s.byList)
      if (path === '/api/statistics/by-priority' && method === 'GET' && s.byPriority) return ok(s.byPriority)
      if (path === '/api/statistics/trend' && method === 'GET' && s.trend) return ok(s.trend)
    }
    // 未配置 statistics 时的默认值
    if (path === '/api/statistics/overview' && method === 'GET')
      return ok({ totalTasks: 0, completedTasks: 0, pendingTasks: 0, completionRate: 0 })
    if (path === '/api/statistics/by-list' && method === 'GET') return ok([])
    if (path === '/api/statistics/by-priority' && method === 'GET') return ok([])
    if (path === '/api/statistics/trend' && method === 'GET') return ok([])

    // ── 兜底：未知路由返回 200/null（与各文件自定义 mock 行为一致） ──
    return ok(null)
  })
}

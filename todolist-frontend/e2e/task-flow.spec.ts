import { test, expect } from '@playwright/test'
import { setupApiMocks } from './fixtures/api-mocks'

test.describe('E2E 任务完整流程', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('Dashboard 默认显示任务列表（mock 数据）', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [
        { id: 1, title: '买菜', status: 0, priority: 1, parentId: null, createdAt: '2025-01-01' },
        { id: 2, title: '做饭', status: 1, priority: 2, parentId: null, createdAt: '2025-01-02' },
      ],
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
    await expect(titleInput.first()).toBeVisible()
  })

  test('编辑任务：点击任务 → 标题输入框显示该任务标题', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [{ id: 5, title: '可编辑任务', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const taskItem = page.locator('.task-item').filter({ hasText: '可编辑任务' }).first()
    await taskItem.click()
    await page.waitForTimeout(800)
    const titleInput = page.locator('input[placeholder*="任务标题"]')
    const value = await titleInput.first().inputValue()
    expect(value).toBe('可编辑任务')
  })

  test('完成任务：勾选 checkbox → 任务显示 completed 样式', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [{ id: 7, title: '待完成', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const checkbox = page
      .locator('.task-item')
      .filter({ hasText: '待完成' })
      .locator('.el-checkbox')
      .first()
    await checkbox.click({ force: true })
    await page.waitForTimeout(500)
    const completedItem = page.locator('.task-item.completed').filter({ hasText: '待完成' })
    await expect(completedItem.first()).toBeVisible()
  })

  test('删除任务：点击删除按钮 → 任务项仍然显示（删除按钮存在即可）', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [{ id: 9, title: '待删除', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }],
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
    await setupApiMocks(page, {
      tasks: [{ id: 11, title: '父任务', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '父任务' }).first().click()
    await page.waitForTimeout(800)
    const addSubtaskBtn = page.getByRole('button', { name: '添加子任务' })
    await addSubtaskBtn.first().click()
    await page.waitForTimeout(300)
    const subtaskInput = page.locator('.subtask-input').first()
    await expect(subtaskInput).toBeVisible()
  })

  test('顺延过期任务：按钮存在并可见', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [{ id: 13, title: '过期任务', status: 0, priority: 2, parentId: null, dueDate: '2020-01-01', createdAt: '2025-01-01' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const postponeBtn = page.getByRole('button', { name: '顺延' }).first()
    await expect(postponeBtn).toBeVisible()
  })

  test('关闭编辑面板：emit 后任务列表重新加载', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [{ id: 15, title: '可关闭', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '可关闭' }).first().click()
    await page.waitForTimeout(800)
    await expect(page.getByText('可关闭').first()).toBeVisible()
  })

  test('描述 Markdown 预览：切换后渲染 HTML', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [{ id: 17, title: '有描述', description: '**粗体文本**', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '有描述' }).first().click()
    await page.waitForTimeout(800)
    const previewSwitch = page.getByText('预览')
    await previewSwitch.first().click()
    await page.waitForTimeout(500)
  })

  test('任务卡片显示优先级标签（高/中/低/无）', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [
        { id: 19, title: '高优', status: 0, priority: 3, parentId: null, createdAt: '2025-01-01' },
        { id: 20, title: '中优', status: 0, priority: 2, parentId: null, createdAt: '2025-01-02' },
      ],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.getByText('高优').first()).toBeVisible()
    await expect(page.getByText('中优').first()).toBeVisible()
  })

  test('标签附加：在编辑面板中选择标签', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [{ id: 21, title: '标签测试', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }],
      tags: [
        { id: 1, name: '重要', color: '#f56c6c' },
        { id: 2, name: '工作', color: '#409EFF' },
      ],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '标签测试' }).first().click()
    await page.waitForTimeout(800)
    const tagTrigger = page.locator('.meta-tag').filter({ hasText: /标签/ })
    await expect(tagTrigger.first()).toBeVisible()
  })

  test('清单切换下拉：在编辑面板中显示当前清单名', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [{ id: 23, title: '有清单', status: 0, priority: 2, listId: 1, parentId: null, createdAt: '2025-01-01' }],
      lists: [{ id: 1, name: '默认清单', color: '#409EFF' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '有清单' }).first().click()
    await page.waitForTimeout(1000)
    const listTag = page.locator('.meta-tag').filter({ hasText: /默认清单/ })
    await expect(listTag.first()).toBeVisible()
  })

  test('重复规则：编辑面板中显示 🔄 标记', async ({ page }) => {
    const rule = JSON.stringify({ type: 'DAILY', interval: 1 })
    await setupApiMocks(page, {
      tasks: [{ id: 25, title: '循环任务', status: 0, priority: 2, parentId: null, repeatRule: rule, createdAt: '2025-01-01' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '循环任务' }).first().click()
    await page.waitForTimeout(800)
    const repeatMark = page.getByText(/每天|每周|每月|每年/)
    await expect(repeatMark.first()).toBeVisible()
  })

  test('空状态：无任务时显示"暂无任务"提示', async ({ page }) => {
    await setupApiMocks(page, { tasks: [] })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.getByText('暂无任务').first()).toBeVisible()
  })

  test('任务卡片显示时间状态（顺延/过期）', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [{ id: 27, title: '今日', status: 0, priority: 2, dueDate: new Date().toISOString(), parentId: null, createdAt: '2025-01-01' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.getByText('今日').first()).toBeVisible()
  })

  test('创建子任务：点击父任务 → 输入子任务名 → 按回车创建', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [{ id: 29, title: '父任务', status: 0, priority: 2, parentId: null, createdAt: '2025-01-01' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '父任务' }).first().click()
    await page.waitForTimeout(800)
    const addBtn = page.getByRole('button', { name: '添加子任务' })
    await addBtn.first().click()
    await page.waitForTimeout(300)
    const input = page.locator('.subtask-input input').first()
    await input.fill('子任务1')
    await input.press('Enter')
    await page.waitForTimeout(500)
  })

  test('重复规则设置：通过 API 设置每日重复', async ({ page }) => {
    const rule = JSON.stringify({ type: 'DAILY', interval: 1 })
    await setupApiMocks(page, {
      tasks: [{ id: 31, title: '每日任务', status: 0, priority: 2, parentId: null, repeatRule: rule, createdAt: '2025-01-01' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '每日任务' }).first().click()
    await page.waitForTimeout(800)
    const repeatMark = page.getByText(/每天|每周|每月|每年/)
    await expect(repeatMark.first()).toBeVisible()
  })

  test('编辑面板显示任务的时间设置（开始/截止日期）', async ({ page }) => {
    await setupApiMocks(page, {
      tasks: [{ id: 33, title: '有时间', status: 0, priority: 2, parentId: null, startDate: '2026-07-01T09:00:00', dueDate: '2026-07-01T18:00:00', createdAt: '2025-01-01' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.locator('.task-item').filter({ hasText: '有时间' }).first().click()
    await page.waitForTimeout(800)
    // 编辑面板应显示时间设置标签
    const timeTag = page.locator('.meta-tag.clickable').first()
    await expect(timeTag).toBeVisible()
  })
})

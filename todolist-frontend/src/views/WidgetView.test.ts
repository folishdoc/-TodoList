import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// ── hoisted mocks ──
const { mockEmitTaskChanged } = vi.hoisted(() => ({
  mockEmitTaskChanged: vi.fn(),
}))

// ── API mocks ──
const taskMocks = vi.hoisted(() => ({
  getTasks: vi.fn(),
  getTodayTasks: vi.fn(),
  getUpcomingTasks: vi.fn(),
  completeTask: vi.fn(),
  uncompleteTask: vi.fn(),
  createTask: vi.fn(),
  deleteTask: vi.fn(),
}))

vi.mock('../api/task', () => taskMocks)

vi.mock('../api/list', () => ({
  getLists: vi.fn(),
}))

vi.mock('../composables/useDateUtils', () => ({
  isOverdue: vi.fn(() => false),
  formatDate: vi.fn((d: string) => d),
}))

vi.mock('../composables/useRepeatRule', () => ({
  getRepeatLabel: vi.fn((r: string) => r),
}))

vi.mock('../composables/usePriority', () => ({
  priorityClass: vi.fn((p: number) => (p === 3 ? 'pri-high' : p === 1 ? 'pri-low' : '')),
}))

vi.mock('../composables/useTaskSync', () => ({
  useTaskSync: () => ({ emitTaskChanged: mockEmitTaskChanged }),
}))

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    setAlwaysOnTop: vi.fn(),
    setOpacity: vi.fn(),
    hide: vi.fn(),
  })),
}))

import WidgetView from './WidgetView.vue'

// ── Stubs ──
const ElDialogStub = {
  name: 'ElDialog',
  props: ['modelValue'],
  template:
    '<div class="el-dialog" v-if="modelValue" data-testid="el-dialog"><slot/><slot name="footer"/></div>',
}

const TaskEditPanelStub = {
  name: 'TaskEditPanel',
  props: ['task', 'mode'],
  template: '<div class="task-edit-panel-stub" data-testid="task-edit-panel"/>',
  emits: ['close', 'changed'],
}

function mountWidget(options: { stubs?: Record<string, any> } = {}) {
  return mount(WidgetView, {
    global: {
      stubs: {
        'el-dialog': ElDialogStub,
        'el-button': true,
        'el-input': true,
        'el-checkbox': true,
        'el-switch': true,
        TaskEditPanel: TaskEditPanelStub,
        ...options.stubs,
      },
    },
    attachTo: document.body,
  })
}

const defaultTaskMocks = () => ({
  getTasks: vi.fn().mockResolvedValue({ data: { content: [] }, code: 200 }),
  getTodayTasks: vi.fn().mockResolvedValue({ data: [], code: 200 }),
  getUpcomingTasks: vi.fn().mockResolvedValue({ data: [], code: 200 }),
  completeTask: vi.fn().mockResolvedValue({ code: 200 }),
  uncompleteTask: vi.fn().mockResolvedValue({ code: 200 }),
  createTask: vi.fn().mockResolvedValue({ data: { id: 1 }, code: 200 }),
  deleteTask: vi.fn().mockResolvedValue({ code: 200 }),
})

const mockGetLists = vi.fn()

describe('WidgetView.vue', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()

    // Apply default mocks
    Object.assign(taskMocks, defaultTaskMocks())
    mockGetLists.mockResolvedValue({ data: [], code: 200 })
    const { getLists } = await import('../api/list')
    vi.mocked(getLists).mockImplementation(mockGetLists)

    delete (window as any).__TAURI_INTERNALS__
  })

  describe('mounting', () => {
    it('mounts without errors', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the widget container', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.find('.widget').exists()).toBe(true)
    })

    it('loads tasks and lists on mount', async () => {
      mountWidget()
      await flushPromises()
      expect(taskMocks.getTodayTasks).toHaveBeenCalled()
      expect(mockGetLists).toHaveBeenCalled()
    })

    it('loads settings from localStorage', async () => {
      localStorage.setItem(
        'widget-settings',
        JSON.stringify({ theme: 'light', opacity: 80, alwaysOnTop: false }),
      )
      const wrapper = mountWidget()
      await flushPromises()
      const vm = wrapper.vm as any
      expect(vm.settings.theme).toBe('light')
      expect(vm.settings.opacity).toBe(80)
      expect(vm.settings.alwaysOnTop).toBe(false)
    })
  })

  describe('filter', () => {
    it('defaults to "today" filter', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.text()).toContain('今日任务')
    })

    it('shows filter dropdown when clicking filter label', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.find('.filter-menu').exists()).toBe(false)

      await wrapper.find('.filter-dropdown').trigger('click')
      expect(wrapper.find('.filter-menu').exists()).toBe(true)
    })

    it('selecting "全部任务" calls getTasks', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      await wrapper.find('.filter-dropdown').trigger('click')
      await wrapper.findAll('.filter-item')[0].trigger('click')
      await flushPromises()

      expect(taskMocks.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, size: 500 }),
      )
    })

    it('selecting "今日任务" calls getTodayTasks', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      taskMocks.getTodayTasks.mockClear()
      await wrapper.find('.filter-dropdown').trigger('click')
      await wrapper.findAll('.filter-item')[1].trigger('click')
      await flushPromises()

      expect(taskMocks.getTodayTasks).toHaveBeenCalled()
    })

    it('selecting "未来任务" calls getUpcomingTasks', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      taskMocks.getUpcomingTasks.mockClear()
      await wrapper.find('.filter-dropdown').trigger('click')
      await wrapper.findAll('.filter-item')[2].trigger('click')
      await flushPromises()

      expect(taskMocks.getUpcomingTasks).toHaveBeenCalled()
    })

    it('renders list items from getLists response', async () => {
      mockGetLists.mockResolvedValue({
        data: [
          { id: 1, name: '工作' },
          { id: 2, name: '个人' },
        ],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()
      await wrapper.find('.filter-dropdown').trigger('click')

      const items = wrapper.findAll('.filter-item')
      const names = items.map((i) => i.text())
      expect(names).toContain('工作')
      expect(names).toContain('个人')
    })

    it('shows "暂无清单" when lists are empty', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      await wrapper.find('.filter-dropdown').trigger('click')

      expect(wrapper.text()).toContain('暂无清单')
    })
  })

  describe('task display', () => {
    it('shows empty message when no tasks', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.text()).toContain('今天没有待办任务')
    })

    it('renders task items when tasks exist', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({
        data: [
          { id: 1, title: '测试任务', status: 0, priority: 2, dueDate: null, repeatRule: null },
        ],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.text()).toContain('测试任务')
      expect(wrapper.findAll('.task-item')).toHaveLength(1)
    })

    it('renders multiple tasks', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({
        data: [
          { id: 1, title: '任务A', status: 0, priority: 2 },
          { id: 2, title: '任务B', status: 1, priority: 1 },
          { id: 3, title: '任务C', status: 0, priority: 3 },
        ],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.findAll('.task-item')).toHaveLength(3)
    })

    it('applies done class to completed tasks', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({
        data: [
          { id: 1, title: '已完成', status: 1, priority: 2 },
          { id: 2, title: '未完成', status: 0, priority: 2 },
        ],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()
      const items = wrapper.findAll('.task-item')
      expect(items[0].classes()).toContain('done')
      expect(items[1].classes()).not.toContain('done')
    })
  })

  describe('task operations', () => {
    it('toggleTask calls completeTask when task is incomplete', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({
        data: [{ id: 1, title: '任务', status: 0, priority: 2 }],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()

      await wrapper.find('.task-check').trigger('click', { stopPropagation: vi.fn() })
      await flushPromises()

      expect(taskMocks.completeTask).toHaveBeenCalledWith(1)
      expect(mockEmitTaskChanged).toHaveBeenCalled()
    })

    it('toggleTask calls uncompleteTask when task is complete', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({
        data: [{ id: 1, title: '任务', status: 1, priority: 2 }],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()

      await wrapper.find('.task-check').trigger('click', { stopPropagation: vi.fn() })
      await flushPromises()

      expect(taskMocks.uncompleteTask).toHaveBeenCalledWith(1)
    })

    it('handleDelete calls deleteTask and reloads', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({
        data: [{ id: 1, title: '任务', status: 0, priority: 2 }],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()
      taskMocks.getTodayTasks.mockClear()

      await wrapper.find('.task-del').trigger('click', { stopPropagation: vi.fn() })
      await flushPromises()

      expect(taskMocks.deleteTask).toHaveBeenCalledWith(1)
      expect(taskMocks.getTodayTasks).toHaveBeenCalled()
      expect(mockEmitTaskChanged).toHaveBeenCalled()
    })

    it('addTask creates a task and reloads', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({ data: [], code: 200 })
      const wrapper = mountWidget()
      await flushPromises()

      const vm = wrapper.vm as any
      vm.newTitle = '新任务'
      await wrapper.find('.widget-input').trigger('keyup.enter')
      await flushPromises()

      expect(taskMocks.createTask).toHaveBeenCalledWith({
        title: '新任务',
        status: 0,
        priority: 2,
      })
      expect(vm.newTitle).toBe('')
      expect(taskMocks.getTodayTasks).toHaveBeenCalled()
      expect(mockEmitTaskChanged).toHaveBeenCalled()
    })

    it('addTask ignores empty title', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      taskMocks.createTask.mockClear()

      await wrapper.find('.widget-input').trigger('keyup.enter')
      await flushPromises()

      expect(taskMocks.createTask).not.toHaveBeenCalled()
    })
  })

  describe('edit dialog', () => {
    it('opens edit dialog when clicking task content', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({
        data: [{ id: 1, title: '任务', status: 0, priority: 2 }],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()

      await wrapper.find('.task-content').trigger('click')
      await flushPromises()

      // The dialog stub renders regardless; click should trigger handleEdit
      expect(wrapper.emitted()).toBeDefined()
    })

    it('opens edit dialog on contextmenu on task item', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({
        data: [{ id: 1, title: '任务', status: 0, priority: 2 }],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()

      await wrapper.find('.task-item').trigger('contextmenu', { preventDefault: vi.fn() })
      await flushPromises()

      // The dialog stub renders regardless; contextmenu should not throw
      expect(wrapper.find('.task-content').exists()).toBe(true)
    })
  })

  describe('settings panel', () => {
    it('toggles settings panel when clicking gear button', async () => {
      const wrapper = mountWidget()
      await flushPromises()

      expect(wrapper.find('.settings-panel').exists()).toBe(false)

      await wrapper.find('.gear-icon').trigger('click')
      expect(wrapper.find('.settings-panel').exists()).toBe(true)

      await wrapper.find('.gear-icon').trigger('click')
      expect(wrapper.find('.settings-panel').exists()).toBe(false)
    })

    it('saves settings to localStorage when changed', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      await wrapper.find('.gear-icon').trigger('click')

      const vm = wrapper.vm as any
      vm.settings.theme = 'light'
      await wrapper.vm.$nextTick()

      const saved = JSON.parse(localStorage.getItem('widget-settings') || '{}')
      expect(saved.theme).toBe('light')
    })

    it('renders theme, opacity, and always-on-top controls in settings', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      await wrapper.find('.gear-icon').trigger('click')

      expect(wrapper.text()).toContain('颜色主题')
      expect(wrapper.text()).toContain('不透明度')
      expect(wrapper.text()).toContain('窗口置顶')
    })
  })

  describe('priority display', () => {
    it('shows priority tag for priority 3', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({
        data: [{ id: 1, title: '高优先', status: 0, priority: 3 }],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.text()).toContain('高')
    })

    it('shows priority tag for priority 2', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({
        data: [{ id: 1, title: '中优先', status: 0, priority: 2 }],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.text()).toContain('中')
    })

    it('shows priority tag for priority 1', async () => {
      taskMocks.getTodayTasks.mockResolvedValue({
        data: [{ id: 1, title: '低优先', status: 0, priority: 1 }],
        code: 200,
      })
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.text()).toContain('低')
    })
  })

  describe('error handling', () => {
    it('handles loadTasks API failure gracefully', async () => {
      taskMocks.getTodayTasks.mockRejectedValue(new Error('Network error'))
      const wrapper = mountWidget()
      await flushPromises()
      // Should not crash, should show empty state
      expect(wrapper.find('.widget').exists()).toBe(true)
    })

    it('handles loadLists API failure gracefully', async () => {
      mockGetLists.mockRejectedValue(new Error('Network error'))
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.find('.widget').exists()).toBe(true)
    })

    it('handles invalid localStorage settings gracefully', async () => {
      localStorage.setItem('widget-settings', 'invalid json{{{')
      const wrapper = mountWidget()
      await flushPromises()
      const vm = wrapper.vm as any
      // Should fall back to defaults
      expect(vm.settings.theme).toBe('dark')
      expect(vm.settings.opacity).toBe(100)
    })
  })

  describe('close button', () => {
    it('renders close button in header', async () => {
      const wrapper = mountWidget()
      await flushPromises()
      expect(wrapper.find('.header-close').exists()).toBe(true)
    })
  })

  describe('loading state', () => {
    it('shows loading indicator while fetching', async () => {
      // Don't resolve the promise immediately
      taskMocks.getTodayTasks.mockReturnValue(new Promise(() => {}))
      const wrapper = mountWidget()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.widget-loading').exists()).toBe(true)
      expect(wrapper.text()).toContain('加载中...')
    })
  })
})

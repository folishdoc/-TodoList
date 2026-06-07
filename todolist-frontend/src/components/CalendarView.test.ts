import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const getTasksMock = vi.fn()
const getTasksByDateRangeMock = vi.fn()
const createTaskMock = vi.fn()
const updateTaskTimeMock = vi.fn()
const completeTaskMock = vi.fn()
const uncompleteTaskMock = vi.fn()

vi.mock('../api/task', () => ({
  getTasks: (...args: unknown[]) => getTasksMock(...args),
  getTasksByDateRange: (...args: unknown[]) => getTasksByDateRangeMock(...args),
  createTask: (...args: unknown[]) => createTaskMock(...args),
  updateTaskTime: (...args: unknown[]) => updateTaskTimeMock(...args),
  completeTask: (...args: unknown[]) => completeTaskMock(...args),
  uncompleteTask: (...args: unknown[]) => uncompleteTaskMock(...args)
}))

const replaceMock = vi.fn()
const routeQuery: Record<string, string> = {}
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ replace: replaceMock })
}))

import CalendarView from './CalendarView.vue'

const ElButtonStub = {
  name: 'ElButtonStub',
  template: '<button type="button" @click="$emit(\'click\')"><slot/></button>',
  props: ['size', 'type']
}

const ElButtonGroupStub = {
  name: 'ElButtonGroupStub',
  template: '<div class="el-button-group"><slot/></div>'
}

const ElRadioGroupStub = {
  name: 'ElRadioGroupStub',
  template: '<div class="el-radio-group" @update:modelValue="$emit(\'update:modelValue\', $event)"><slot/></div>',
  props: ['modelValue']
}

const ElRadioButtonStub = {
  name: 'ElRadioButtonStub',
  template: '<label class="el-radio-button" @click="$emit(\'click\')"><slot/></label>',
  props: ['value']
}

const ElDropdownStub = {
  name: 'ElDropdownStub',
  template: '<div class="el-dropdown" @click="$emit(\'click\')" @command="$emit(\'command\', $event)"><slot/></div>',
  props: ['trigger']
}

const ElDropdownMenuStub = {
  name: 'ElDropdownMenuStub',
  template: '<div class="el-dropdown-menu"><slot/></div>'
}

const ElDropdownItemStub = {
  name: 'ElDropdownItemStub',
  template: '<div class="el-dropdown-item" :data-command="command" @click="$emit(\'click\', command)"><slot/></div>',
  props: ['command', 'divided']
}

const ElDividerStub = {
  name: 'ElDividerStub',
  template: '<hr class="el-divider" />',
  props: ['direction']
}

const ElIconStub = {
  name: 'ElIconStub',
  template: '<i class="el-icon"><slot/></i>'
}

const ElCheckboxStub = {
  name: 'ElCheckboxStub',
  template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'change\', $event.target.checked); $emit(\'update:modelValue\', $event.target.checked)" />',
  props: ['modelValue']
}

const ElTooltipStub = {
  name: 'ElTooltipStub',
  template: '<div class="el-tooltip"><slot name="default"/></div>',
  props: ['content', 'placement', 'showAfter']
}

const ElEmptyStub = {
  name: 'ElEmptyStub',
  template: '<div class="el-empty"><slot/></div>',
  props: ['description', 'imageSize']
}

const ElDatePickerStub = {
  name: 'ElDatePickerStub',
  template: '<input :value="modelValue" @update:modelValue="$emit(\'update:modelValue\', $event.target.value); $emit(\'change\', $event.target.value)" />',
  props: ['modelValue', 'type', 'placeholder', 'format', 'valueFormat']
}

const ElTimePickerStub = {
  name: 'ElTimePickerStub',
  template: '<input :value="modelValue" @update:modelValue="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder']
}

const ElDialogStub = {
  name: 'ElDialogStub',
  template: '<div v-if="modelValue" class="el-dialog"><slot/></div>',
  props: ['modelValue', 'title', 'width']
}

const ElFormStub = {
  name: 'ElFormStub',
  template: '<form class="el-form"><slot/></form>',
  props: ['model']
}

const ElFormItemStub = {
  name: 'ElFormItemStub',
  template: '<div class="el-form-item"><slot/></div>',
  props: ['label']
}

const ElInputStub = {
  name: 'ElInputStub',
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder', 'type', 'rows']
}

const ElSelectStub = {
  name: 'ElSelectStub',
  template: '<div class="el-select" @update:modelValue="$emit(\'update:modelValue\', $event)"><slot/></div>',
  props: ['modelValue', 'placeholder']
}

const ElOptionStub = {
  name: 'ElOptionStub',
  template: '<div class="el-option" :data-value="value"><slot/></div>',
  props: ['value', 'label']
}

function mountView() {
  return mount(CalendarView, {
    attachTo: document.body,
    global: {
      stubs: {
        'el-button': ElButtonStub,
        'el-button-group': ElButtonGroupStub,
        'el-radio-group': ElRadioGroupStub,
        'el-radio-button': ElRadioButtonStub,
        'el-dropdown': ElDropdownStub,
        'el-dropdown-menu': ElDropdownMenuStub,
        'el-dropdown-item': ElDropdownItemStub,
        'el-divider': ElDividerStub,
        'el-icon': ElIconStub,
        'el-checkbox': ElCheckboxStub,
        'el-tooltip': ElTooltipStub,
        'el-empty': ElEmptyStub,
        'el-date-picker': ElDatePickerStub,
        'el-time-picker': ElTimePickerStub,
        'el-dialog': ElDialogStub,
        'el-form': ElFormStub,
        'el-form-item': ElFormItemStub,
        'el-input': ElInputStub,
        'el-select': ElSelectStub,
        'el-option': ElOptionStub,
        Filter: { template: '<span class="filter-stub" />' }
      }
    }
  })
}

describe('CalendarView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const k of Object.keys(routeQuery)) delete routeQuery[k]
    document.body.innerHTML = ''
    getTasksByDateRangeMock.mockResolvedValue({ data: [] } as any)
    getTasksMock.mockResolvedValue({ data: { content: [] } } as any)
    createTaskMock.mockResolvedValue({ id: 100 } as any)
    updateTaskTimeMock.mockResolvedValue({} as any)
    completeTaskMock.mockResolvedValue({} as any)
    uncompleteTaskMock.mockResolvedValue({} as any)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  describe('视图模式切换', () => {
    it('默认 viewMode 为 month', async () => {
      const wrapper = mountView()
      await flushPromises()
      expect((wrapper.vm as any).viewMode).toBe('month')
      expect(wrapper.find('.month-view').exists()).toBe(true)
    })

    it('通过 query 设置 viewMode=week', async () => {
      routeQuery.calendarView = 'week'
      const wrapper = mountView()
      await flushPromises()
      expect((wrapper.vm as any).viewMode).toBe('week')
      expect(wrapper.find('.week-view').exists()).toBe(true)
    })

    it('通过 query 设置 viewMode=bar', async () => {
      routeQuery.calendarView = 'bar'
      const wrapper = mountView()
      await flushPromises()
      expect((wrapper.vm as any).viewMode).toBe('bar')
      expect(wrapper.find('.bar-view').exists()).toBe(true)
    })

    it('通过 query 设置 viewMode=daybar', async () => {
      routeQuery.calendarView = 'daybar'
      const wrapper = mountView()
      await flushPromises()
      expect((wrapper.vm as any).viewMode).toBe('daybar')
      expect(wrapper.find('.daybar-view').exists()).toBe(true)
    })
  })

  describe('openCreateWithTime(date, time?)', () => {
    it('仅传 date → newTaskForm.dueDate 设置、time 为 null', async () => {
      const wrapper = mountView()
      await flushPromises()
      const target = new Date('2026-07-15T00:00:00')
      ;(wrapper.vm as any).openCreateWithTime(target)
      const form = (wrapper.vm as any).newTaskForm
      expect(form.dueDate.toDateString()).toBe(target.toDateString())
      expect(form.time).toBeNull()
      expect((wrapper.vm as any).showCreateDialog).toBe(true)
    })

    it('传 date + time{h,m} → newTaskForm.time 含具体时分', async () => {
      const wrapper = mountView()
      await flushPromises()
      const target = new Date('2026-07-15T00:00:00')
      ;(wrapper.vm as any).openCreateWithTime(target, { h: 14, m: 30 })
      const form = (wrapper.vm as any).newTaskForm
      expect(form.dueDate.toDateString()).toBe(target.toDateString())
      expect(form.time).not.toBeNull()
      expect(form.time.getHours()).toBe(14)
      expect(form.time.getMinutes()).toBe(30)
    })

    it('打开时清空 title/description、priority 重置为 2', async () => {
      const wrapper = mountView()
      await flushPromises()
      const form = (wrapper.vm as any).newTaskForm
      form.title = '旧标题'
      form.description = '旧描述'
      form.priority = 3
      ;(wrapper.vm as any).openCreateWithTime(new Date('2026-07-15'))
      expect(form.title).toBe('')
      expect(form.description).toBe('')
      expect(form.priority).toBe(2)
    })
  })

  describe('handleCreateTask', () => {
    it('提交时 startDate 字段存在且 ≈ NOW、dueDate 来自表单', async () => {
      vi.useFakeTimers()
      const fakeNow = new Date('2026-07-15T10:00:00')
      vi.setSystemTime(fakeNow)
      const wrapper = mountView()
      await flushPromises()
      const form = (wrapper.vm as any).newTaskForm
      form.title = '新任务'
      form.dueDate = new Date('2026-07-20T00:00:00')
      form.time = null
      form.priority = 2
      await (wrapper.vm as any).handleCreateTask()
      await flushPromises()
      expect(createTaskMock).toHaveBeenCalledTimes(1)
      const payload = createTaskMock.mock.calls[0][0]
      expect(payload.title).toBe('新任务')
      expect(payload.status).toBe(0)
      expect(payload.priority).toBe(2)
      expect(payload.startDate).toBeDefined()
      expect(payload.dueDate).toBe('2026-07-20T00:00:00')
      const start = new Date(payload.startDate)
      expect(Math.abs(start.getTime() - fakeNow.getTime())).toBeLessThan(1000)
    })

    it('提交时 time 与 dueDate 合并（小时分钟）', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-07-15T10:00:00'))
      const wrapper = mountView()
      await flushPromises()
      const form = (wrapper.vm as any).newTaskForm
      form.title = '新任务'
      form.dueDate = new Date('2026-07-20T00:00:00')
      form.time = new Date('2026-01-01T15:45:00')
      form.priority = 1
      await (wrapper.vm as any).handleCreateTask()
      await flushPromises()
      const payload = createTaskMock.mock.calls[0][0]
      expect(payload.dueDate).toBe('2026-07-20T15:45:00')
    })

    it('标题为空时给出警告且不调用 createTask', async () => {
      const { ElMessage } = await import('element-plus')
      const wrapper = mountView()
      await flushPromises()
      const form = (wrapper.vm as any).newTaskForm
      form.title = '   '
      form.dueDate = new Date('2026-07-20')
      await (wrapper.vm as any).handleCreateTask()
      await flushPromises()
      expect(ElMessage.warning).toHaveBeenCalledWith('请输入任务标题')
      expect(createTaskMock).not.toHaveBeenCalled()
    })

    it('成功创建后关闭对话框', async () => {
      const wrapper = mountView()
      await flushPromises()
      const form = (wrapper.vm as any).newTaskForm
      form.title = '新'
      form.dueDate = new Date('2026-07-20')
      ;(wrapper.vm as any).showCreateDialog = true
      await (wrapper.vm as any).handleCreateTask()
      await flushPromises()
      expect((wrapper.vm as any).showCreateDialog).toBe(false)
    })
  })

  describe('视图点击 → openCreateWithTime', () => {
    it('月视图点击 day-cell 触发 openCreateWithTime 并打开对话框', async () => {
      const wrapper = mountView()
      await flushPromises()
      const cells = wrapper.findAll('.day-cell')
      expect(cells.length).toBeGreaterThan(0)
      const firstCell = cells[0]
      await firstCell.trigger('click')
      expect((wrapper.vm as any).showCreateDialog).toBe(true)
    })

    it('周视图点击 week-day-column 触发 openCreateWithTime', async () => {
      routeQuery.calendarView = 'week'
      const wrapper = mountView()
      await flushPromises()
      const cols = wrapper.findAll('.week-day-column')
      expect(cols.length).toBe(7)
      await cols[0].trigger('click')
      expect((wrapper.vm as any).showCreateDialog).toBe(true)
    })

    it('条形视图点击 bar-header-cell 触发 openCreateWithTime', async () => {
      routeQuery.calendarView = 'bar'
      const wrapper = mountView()
      await flushPromises()
      const cells = wrapper.findAll('.bar-header-cell')
      expect(cells.length).toBeGreaterThan(0)
      await cells[0].trigger('click')
      expect((wrapper.vm as any).showCreateDialog).toBe(true)
    })

    it('日条形视图点击 daybar-track 空白区域触发 openCreateWithTime（带时间）', async () => {
      routeQuery.calendarView = 'daybar'
      const wrapper = mountView()
      await flushPromises()
      const track = wrapper.find('.daybar-track')
      expect(track.exists()).toBe(true)
      const trackEl = track.element as HTMLElement
      const rectSpy = vi.spyOn(trackEl, 'getBoundingClientRect').mockReturnValue({
        top: 100, left: 0, right: 0, bottom: 0, width: 0, height: 48 * 30, x: 0, y: 100, toJSON: () => ({})
      } as any)
      const targetDate = (wrapper.vm as any).dayBarDate
      ;(wrapper.vm as any).onDayBarTrackClick({ target: trackEl, clientY: 250 } as any)
      expect(rectSpy).toHaveBeenCalled()
      expect((wrapper.vm as any).showCreateDialog).toBe(true)
      const form = (wrapper.vm as any).newTaskForm
      expect(form.dueDate.toDateString()).toBe(targetDate.toDateString())
      expect(form.time).not.toBeNull()
      expect(form.time.getHours()).toBe(2)
      expect(form.time.getMinutes()).toBe(30)
    })

    it('日条形视图拖拽后短时间内点击 track 不触发 openCreateWithTime', async () => {
      routeQuery.calendarView = 'daybar'
      const wrapper = mountView()
      await flushPromises()
      const track = wrapper.find('.daybar-track')
      track.element.getBoundingClientRect = () => ({
        top: 100, left: 0, right: 0, bottom: 0, width: 0, height: 48 * 30, x: 0, y: 100, toJSON: () => ({})
      } as any)
      // Simulate drag-end timestamp being just set
      ;(wrapper.vm as any).dayBarSuppressClick = Date.now()
      ;(wrapper.vm as any).onDayBarTrackClick({ target: track.element, clientY: 250 } as any)
      expect((wrapper.vm as any).showCreateDialog).toBe(false)
    })
  })

  describe('handleTaskClick (existing behavior)', () => {
    it('emit task-click', async () => {
      const wrapper = mountView()
      await flushPromises()
      const task = { id: 1, title: 'A', priority: 2, status: 0 }
      ;(wrapper.vm as any).handleTaskClick(task)
      expect(wrapper.emitted('task-click')).toBeTruthy()
      expect(wrapper.emitted('task-click')![0][0]).toEqual(task)
    })
  })
})

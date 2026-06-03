import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<any>('element-plus')
  return {
    ...actual,
    ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
    ElMessageBox: { confirm: vi.fn().mockResolvedValue('confirm') },
  }
})

vi.mock('../api/task', () => ({
  getTasks: vi.fn().mockResolvedValue({ data: { content: [], totalElements: 0, totalPages: 0, size: 1000, number: 0 }, code: 200, message: 'success' }),
  getTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  createTask: vi.fn().mockResolvedValue({ data: { id: 1 }, code: 200, message: 'success' }),
  updateTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  deleteTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  completeTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  uncompleteTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  postponeTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  updateTaskTime: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  getSubtasks: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  getTodayTasks: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  getUpcomingTasks: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  searchTasks: vi.fn().mockResolvedValue({ data: { content: [], totalElements: 0, totalPages: 0 }, code: 200, message: 'success' }),
}))
vi.mock('../api/batch', () => ({
  batchDelete: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  batchComplete: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  batchUpdate: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
}))
vi.mock('../api/list', () => ({
  getLists: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  createList: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  updateList: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  deleteList: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
}))
vi.mock('../api/tag', () => ({
  getTags: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  createTag: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  updateTag: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  deleteTag: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  getTaskTags: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  addTaskTag: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  removeTaskTag: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  setTaskTags: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
}))
vi.mock('../api/attachment', () => ({
  getTaskAttachments: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  uploadAttachment: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  deleteAttachment: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
}))
vi.mock('../api/repeat', () => ({
  setRepeatRule: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  cancelRepeatRule: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  updateRepeatEndDate: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
}))
vi.mock('../api/anniversary', () => ({
  getPendingReminders: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  markReminderRead: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  listAnniversaries: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  createAnniversary: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  updateAnniversary: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  deleteAnniversary: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  generateTodo: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
}))
vi.mock('../api/habit', () => ({
  getHabits: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  createHabit: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  updateHabit: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  deleteHabit: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  checkIn: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  uncheck: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  getRecordsByRange: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
}))
vi.mock('../api/statistics', () => ({
  getOverview: vi.fn().mockResolvedValue({ data: {}, code: 200, message: 'success' }),
  getByList: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  getByPriority: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  getTrend: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
}))

const stubElButton = defineComponent({
  name: 'ElButton',
  setup(_, { slots }) {
    return () => h('button', { 'data-testid': 'el-button' }, slots.default?.())
  },
})
const stubElIcon = defineComponent({
  name: 'ElIcon',
  setup(_, { slots }) {
    return () => h('span', { 'data-testid': 'el-icon' }, slots.default?.())
  },
})
const stubElDialog = defineComponent({
  name: 'ElDialog',
  props: ['modelValue'],
  setup(props, { slots }) {
    return () => props.modelValue
      ? h('div', { 'data-testid': 'el-dialog' }, [slots.default?.(), slots.footer ? h('div', { 'data-testid': 'dialog-footer' }, slots.footer()) : null])
      : null
  },
})
const stubElEmpty = defineComponent({ name: 'ElEmpty', setup: () => () => h('div', { 'data-testid': 'el-empty' }) })
const stubElPopover = defineComponent({ name: 'ElPopover', setup: (_, { slots }) => () => slots.default?.() })
const stubElBadge = defineComponent({ name: 'ElBadge', setup: (_, { slots }) => () => h('span', { 'data-testid': 'el-badge' }, slots.default?.()) })
const stubElDropdown = defineComponent({ name: 'ElDropdown', setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-dropdown' }, slots.default?.()) })
const stubElDropdownMenu = defineComponent({ name: 'ElDropdownMenu', setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-dropdown-menu' }, slots.default?.()) })
const stubElDropdownItem = defineComponent({ name: 'ElDropdownItem', setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-dropdown-item' }, slots.default?.()) })
const stubElDivider = defineComponent({ name: 'ElDivider', setup: () => () => h('hr', { 'data-testid': 'el-divider' }) })
const stubElForm = defineComponent({ name: 'ElForm', setup: (_, { slots }) => () => h('form', { 'data-testid': 'el-form' }, slots.default?.()) })
const stubElFormItem = defineComponent({ name: 'ElFormItem', setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-form-item' }, slots.default?.()) })
const stubElInput = defineComponent({ name: 'ElInput', props: ['modelValue'], setup: (props, { emit }) => () => h('input', { 'data-testid': 'el-input', value: props.modelValue, onInput: (e: any) => emit('update:modelValue', e.target.value) }) })
const stubElSelect = defineComponent({ name: 'ElSelect', props: ['modelValue'], setup: (props, { emit, slots }) => () => h('select', { 'data-testid': 'el-select', value: props.modelValue, onChange: (e: any) => emit('update:modelValue', e.target.value) }, slots.default?.()) })
const stubElOption = defineComponent({ name: 'ElOption', props: ['label', 'value'], setup: (props) => () => h('option', { value: props.value }, props.label) })
const stubElCheckbox = defineComponent({ name: 'ElCheckbox', props: ['modelValue'], setup: (props, { emit }) => () => h('input', { type: 'checkbox', 'data-testid': 'el-checkbox', checked: props.modelValue, onChange: (e: any) => emit('update:modelValue', e.target.checked) }) })
const stubElCheckboxGroup = defineComponent({ name: 'ElCheckboxGroup', props: ['modelValue'], setup: (props, { emit, slots }) => () => h('div', { 'data-testid': 'el-checkbox-group' }, slots.default?.()) })
const stubElRadioGroup = defineComponent({ name: 'ElRadioGroup', props: ['modelValue'], setup: (props, { emit, slots }) => () => h('div', { 'data-testid': 'el-radio-group' }, slots.default?.()) })
const stubElRadioButton = defineComponent({ name: 'ElRadioButton', props: ['value'], setup: (props) => () => h('button', { 'data-testid': 'el-radio-button', 'data-value': props.value }) })
const stubElRadio = defineComponent({ name: 'ElRadio', props: ['value'], setup: (props) => () => h('button', { 'data-testid': 'el-radio', 'data-value': props.value }) })
const stubElTag = defineComponent({ name: 'ElTag', setup: (_, { slots }) => () => h('span', { 'data-testid': 'el-tag' }, slots.default?.()) })
const stubElTooltip = defineComponent({ name: 'ElTooltip', setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-tooltip' }, slots.default?.()) })
const stubElMenu = defineComponent({ name: 'ElMenu', props: ['defaultActive'], setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-menu' }, slots.default?.()) })
const stubElMenuItem = defineComponent({ name: 'ElMenuItem', props: ['index'], setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-menu-item', 'data-index': _.index }, slots.default?.()) })
const stubElContainer = defineComponent({ name: 'ElContainer', setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-container' }, slots.default?.()) })
const stubElAside = defineComponent({ name: 'ElAside', setup: (_, { slots }) => () => h('aside', { 'data-testid': 'el-aside' }, slots.default?.()) })
const stubElHeader = defineComponent({ name: 'ElHeader', setup: (_, { slots }) => () => h('header', { 'data-testid': 'el-header' }, slots.default?.()) })
const stubElMain = defineComponent({ name: 'ElMain', setup: (_, { slots }) => () => h('main', { 'data-testid': 'el-main' }, slots.default?.()) })
const stubElDatePicker = defineComponent({ name: 'ElDatePicker', props: ['modelValue'], setup: (props, { emit }) => () => h('input', { 'data-testid': 'el-date-picker', value: props.modelValue, onInput: (e: any) => emit('update:modelValue', e.target.value) }) })
const stubElTimePicker = defineComponent({ name: 'ElTimePicker', props: ['modelValue'], setup: (props, { emit }) => () => h('input', { 'data-testid': 'el-time-picker', value: props.modelValue, onInput: (e: any) => emit('update:modelValue', e.target.value) }) })
const stubElButtonGroup = defineComponent({ name: 'ElButtonGroup', setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-button-group' }, slots.default?.()) })
const stubElSkeleton = defineComponent({ name: 'ElSkeleton', setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-skeleton' }, slots.default?.()) })
const stubElSkeletonItem = defineComponent({ name: 'ElSkeletonItem', setup: () => () => h('div', { 'data-testid': 'el-skeleton-item' }) })
const stubElInputNumber = defineComponent({ name: 'ElInputNumber', props: ['modelValue'], setup: (props, { emit }) => () => h('input', { 'data-testid': 'el-input-number', value: props.modelValue, onInput: (e: any) => emit('update:modelValue', Number(e.target.value)) }) })
const stubElSwitch = defineComponent({ name: 'ElSwitch', props: ['modelValue'], setup: (props, { emit }) => () => h('input', { type: 'checkbox', 'data-testid': 'el-switch', checked: props.modelValue, onChange: (e: any) => emit('update:modelValue', e.target.checked) }) })
const stubElStatistic = defineComponent({ name: 'ElStatistic', props: ['value', 'title'], setup: (props) => () => h('div', { 'data-testid': 'el-statistic' }, `${props.title}: ${props.value}`) })
const stubElCard = defineComponent({ name: 'ElCard', setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-card' }, slots.default?.()) })
const stubElSpace = defineComponent({ name: 'ElSpace', setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-space' }, slots.default?.()) })
const stubElAlert = defineComponent({ name: 'ElAlert', setup: (_, { slots }) => () => h('div', { 'data-testid': 'el-alert' }, slots.default?.()) })

const stubTaskEditPanel = defineComponent({
  name: 'TaskEditPanel',
  props: ['task', 'taskForm', 'taskLists', 'allTags', 'mode', 'visible'],
  emits: ['update:task', 'update:taskForm', 'save', 'close', 'delete'],
  setup(props, { emit }) {
    return () => h('div', { 'data-testid': 'task-edit-panel' }, [
      h('button', { 'data-testid': 'panel-close', onClick: () => emit('close') }, '关闭'),
      h('button', { 'data-testid': 'panel-save', onClick: () => emit('save') }, '保存'),
      h('button', { 'data-testid': 'panel-delete', onClick: () => emit('delete') }, '删除'),
    ])
  },
})

const stubSubtasksView = defineComponent({ name: 'SubtasksView', setup: () => () => h('div', { 'data-testid': 'subtasks-view' }) })
const stubTagsView = defineComponent({ name: 'TagsView', setup: () => () => h('div', { 'data-testid': 'tags-view' }) })
const stubCalendarView = defineComponent({ name: 'CalendarView', setup: () => () => h('div', { 'data-testid': 'calendar-view' }) })
const stubHabitsView = defineComponent({ name: 'HabitsView', setup: () => () => h('div', { 'data-testid': 'habits-view' }) })
const stubAnniversaryList = defineComponent({ name: 'AnniversaryList', setup: () => () => h('div', { 'data-testid': 'anniversary-list' }) })
const stubStatisticsView = defineComponent({ name: 'StatisticsView', setup: () => () => h('div', { 'data-testid': 'statistics-view' }) })

const stubChild = (name: string) => defineComponent({
  name,
  setup: () => () => h('div', { 'data-testid': name.toLowerCase() }),
})

const elementPlusStubs: Record<string, any> = {
  'el-button': stubElButton,
  'el-icon': stubElIcon,
  'el-dialog': stubElDialog,
  'el-empty': stubElEmpty,
  'el-popover': stubElPopover,
  'el-badge': stubElBadge,
  'el-dropdown': stubElDropdown,
  'el-dropdown-menu': stubElDropdownMenu,
  'el-dropdown-item': stubElDropdownItem,
  'el-divider': stubElDivider,
  'el-form': stubElForm,
  'el-form-item': stubElFormItem,
  'el-input': stubElInput,
  'el-select': stubElSelect,
  'el-option': stubElOption,
  'el-checkbox': stubElCheckbox,
  'el-checkbox-group': stubElCheckboxGroup,
  'el-radio-group': stubElRadioGroup,
  'el-radio-button': stubElRadioButton,
  'el-radio': stubElRadio,
  'el-tag': stubElTag,
  'el-tooltip': stubElTooltip,
  'el-menu': stubElMenu,
  'el-menu-item': stubElMenuItem,
  'el-container': stubElContainer,
  'el-aside': stubElAside,
  'el-header': stubElHeader,
  'el-main': stubElMain,
  'el-date-picker': stubElDatePicker,
  'el-time-picker': stubElTimePicker,
  'el-button-group': stubElButtonGroup,
  'el-skeleton': stubElSkeleton,
  'el-skeleton-item': stubElSkeletonItem,
  'el-input-number': stubElInputNumber,
  'el-switch': stubElSwitch,
  'el-statistic': stubElStatistic,
  'el-card': stubElCard,
  'el-space': stubElSpace,
  'el-alert': stubElAlert,
}

const iconStubs: Record<string, any> = {}
;['List', 'Calendar', 'Clock', 'Plus', 'Folder', 'Delete', 'DataAnalysis', 'PriceTag', 'TrendCharts', 'Flag', 'Bell', 'Upload', 'Download'].forEach((name) => {
  iconStubs[`el-icon-${name}`] = stubChild(`el-icon-${name}`)
})

const stubs = {
  ...elementPlusStubs,
  ...iconStubs,
  TaskEditPanel: stubTaskEditPanel,
  SubtasksView: stubSubtasksView,
  TagsView: stubTagsView,
  CalendarView: stubCalendarView,
  HabitsView: stubHabitsView,
  AnniversaryList: stubAnniversaryList,
  StatisticsView: stubStatisticsView,
}

const globalDirectives = {
  loading: { mounted: () => {}, updated: () => {}, unmounted: () => {} },
}

async function mountDashboard() {
  setActivePinia(createPinia())
  const Dashboard = (await import('../views/Dashboard.vue')).default
  const wrapper = mount(Dashboard, {
    global: { stubs, directives: globalDirectives, mocks: { $t: (k: string) => k } },
    attachTo: document.body,
  })
  await flushPromises()
  await nextTick()
  return wrapper
}

describe('Dashboard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('挂载不报错且渲染容器', async () => {
    const w = await mountDashboard()
    expect(w.exists()).toBe(true)
  })

  it('默认 currentModule = tasks', async () => {
    const w = await mountDashboard()
    const setup = (w.vm as any).$
    const cm = setup.setupState?.currentModule
    expect(cm).toBe('tasks')
  })

  it('切换 currentModule 到 calendar', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.currentModule = 'calendar'
    await nextTick()
    expect(setupState.currentModule).toBe('calendar')
  })

  it('切换 currentModule 到 habits', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.currentModule = 'habits'
    await nextTick()
    expect(setupState.currentModule).toBe('habits')
  })

  it('切换 currentModule 到 anniversaries', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.currentModule = 'anniversaries'
    await nextTick()
    expect(setupState.currentModule).toBe('anniversaries')
  })

  it('loadTasks 填充 tasks 数组', async () => {
    const { getTasks } = await import('../api/task')
    ;(getTasks as any).mockResolvedValue({
      data: { content: [{ id: 1, title: 'T1' }, { id: 2, title: 'T2' }], totalElements: 2, totalPages: 1, size: 1000, number: 0 },
      code: 200,
      message: 'success',
    })
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    await setupState.loadTasks()
    expect(setupState.tasks.length).toBe(2)
    expect(setupState.tasks[0].title).toBe('T1')
  })

  it('loadLists 填充 taskLists 数组', async () => {
    const { getLists } = await import('../api/list')
    ;(getLists as any).mockResolvedValue({
      data: [{ id: 1, name: 'List 1' }, { id: 2, name: 'List 2' }],
      code: 200,
      message: 'success',
    })
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    await setupState.loadLists()
    expect(setupState.taskLists.length).toBe(2)
    expect(setupState.taskLists[0].name).toBe('List 1')
  })

  it('handleMenuSelect 改变 activeMenu 并重新加载', async () => {
    const { getTasks } = await import('../api/task')
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.handleMenuSelect('today')
    await flushPromises()
    expect(setupState.activeMenu).toBe('today')
    expect(getTasks).toHaveBeenCalled()
  })

  it('handleSearch 重置 currentPage 并加载', async () => {
    const { getTasks } = await import('../api/task')
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.currentPage = 5
    setupState.handleSearch()
    expect(setupState.currentPage).toBe(1)
    expect(getTasks).toHaveBeenCalled()
  })

  it('enterBatchMode 设置 batchMode=true 并清空选择', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.selectedTaskIds.add(1)
    setupState.enterBatchMode()
    expect(setupState.batchMode).toBe(true)
    expect(setupState.selectedTaskIds.size).toBe(0)
  })

  it('exitBatchMode 设置 batchMode=false 并清空选择', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.batchMode = true
    setupState.selectedTaskIds.add(1)
    setupState.exitBatchMode()
    expect(setupState.batchMode).toBe(false)
    expect(setupState.selectedTaskIds.size).toBe(0)
  })

  it('toggleTaskSelection 添加/移除 id', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.toggleTaskSelection(1)
    expect(setupState.selectedTaskIds.has(1)).toBe(true)
    setupState.toggleTaskSelection(1)
    expect(setupState.selectedTaskIds.has(1)).toBe(false)
    setupState.toggleTaskSelection(2)
    expect(setupState.selectedTaskIds.size).toBe(1)
  })

  it('handleSelectAll 选中所有非级联子任务', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.tasks = [
      { id: 1, title: 'P1', parentId: null },
      { id: 2, title: 'S1', parentId: 1 },
      { id: 3, title: 'P2', parentId: null },
    ]
    setupState.handleSelectAll()
    expect(setupState.selectedTaskIds.size).toBe(2)
    expect(setupState.selectedTaskIds.has(1)).toBe(true)
    expect(setupState.selectedTaskIds.has(2)).toBe(false)  // 级联跳过
    expect(setupState.selectedTaskIds.has(3)).toBe(true)
  })

  it('handleEditTask 打开编辑面板并填充表单', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    const task = { id: 7, title: 'Edit Me', description: 'desc', priority: 3, listId: 2 }
    await setupState.handleEditTask(task)
    expect(setupState.editingTask).toEqual(task)
    expect(setupState.taskForm.title).toBe('Edit Me')
    expect(setupState.taskForm.priority).toBe(3)
    expect(setupState.taskForm.listId).toBe(2)
  })

  it('handleCalendarTaskClick 触发 handleEditTask', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    const task = { id: 8, title: 'Cal Click' }
    await setupState.handleCalendarTaskClick(task)
    expect(setupState.editingTask).toEqual(task)
    expect(setupState.taskForm.title).toBe('Cal Click')
  })

  it('closeEditPanel 清空 editingTask', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.editingTask = { id: 1, title: 'x' }
    await setupState.closeEditPanel()
    expect(setupState.editingTask).toBeNull()
  })

  it('handleCompleteTask 调用 completeTask API 当 status=0', async () => {
    const { completeTask } = await import('../api/task')
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    await setupState.handleCompleteTask({ id: 9, status: 0 })
    expect(completeTask).toHaveBeenCalledWith(9)
  })

  it('handleCompleteTask 调用 uncompleteTask API 当 status=1', async () => {
    const { uncompleteTask } = await import('../api/task')
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    await setupState.handleCompleteTask({ id: 9, status: 1 })
    expect(uncompleteTask).toHaveBeenCalledWith(9)
  })

  it('loadReminders 更新 unreadReminderCount', async () => {
    const { getPendingReminders } = await import('../api/anniversary')
    ;(getPendingReminders as any).mockResolvedValue({
      data: [
        { id: 1, anniversaryId: 5, isRead: false },
        { id: 2, anniversaryId: 6, isRead: false },
        { id: 3, anniversaryId: 7, isRead: true },
      ],
      code: 200,
      message: 'success',
    })
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    await setupState.loadReminders()
    expect(setupState.reminders.length).toBe(3)
    expect(setupState.unreadReminderCount).toBe(2)
  })

  it('handleReminderClick 标记已读并切换模块', async () => {
    const { markReminderRead } = await import('../api/anniversary')
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    const reminder = { id: 11, anniversaryId: 5, isRead: false }
    await setupState.handleReminderClick(reminder)
    expect(markReminderRead).toHaveBeenCalledWith(11)
    expect(setupState.currentModule).toBe('anniversaries')
  })

  it('handleMainContentClick 关闭编辑面板（点击非 panel 元素）', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.editingTask = { id: 1, title: 'x' }
    // 模拟 .edit-panel 已存在
    const editPanel = document.createElement('div')
    editPanel.className = 'edit-panel'
    document.body.appendChild(editPanel)
    // 目标元素在 panel 外
    const target = document.createElement('div')
    document.body.appendChild(target)
    const event = { target } as any as MouseEvent
    setupState.handleMainContentClick(event)
    await flushPromises()
    expect(setupState.editingTask).toBeNull()
  })

  it('openCreateTaskDialog 显示对话框', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.openCreateTaskDialog()
    expect(setupState.showCreateTaskDialog).toBe(true)
  })

  it('handleBatchDelete 警告当未选择任务', async () => {
    const w = await mountDashboard()
    const setupState = (w.vm as any).$.setupState
    setupState.batchMode = true
    await setupState.handleBatchDelete()
    expect(ElMessage.warning).toHaveBeenCalled()
  })
})

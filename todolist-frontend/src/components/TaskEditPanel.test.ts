import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const getListsMock = vi.fn()
const getSubtasksMock = vi.fn()
const updateTaskMock = vi.fn()
const deleteTaskMock = vi.fn()
const createTaskMock = vi.fn()
const getTaskTagsMock = vi.fn()
const addTagToTaskMock = vi.fn()
const removeTagFromTaskMock = vi.fn()
const getTagsMock = vi.fn()
const setRepeatRuleMock = vi.fn()
const cancelRepeatRuleMock = vi.fn()

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

vi.mock('../api/task', () => ({
  getSubtasks: (...args: unknown[]) => getSubtasksMock(...args),
  updateTask: (...args: unknown[]) => updateTaskMock(...args),
  deleteTask: (...args: unknown[]) => deleteTaskMock(...args),
  createTask: (...args: unknown[]) => createTaskMock(...args),
}))

vi.mock('../api/list', () => ({
  getLists: (...args: unknown[]) => getListsMock(...args),
}))

vi.mock('../api/tag', () => ({
  getTaskTags: (...args: unknown[]) => getTaskTagsMock(...args),
  addTagToTask: (...args: unknown[]) => addTagToTaskMock(...args),
  removeTagFromTask: (...args: unknown[]) => removeTagFromTaskMock(...args),
  getTags: (...args: unknown[]) => getTagsMock(...args),
}))

vi.mock('../api/repeat', () => ({
  setRepeatRule: (...args: unknown[]) => setRepeatRuleMock(...args),
  cancelRepeatRule: (...args: unknown[]) => cancelRepeatRuleMock(...args),
}))

import TaskEditPanel from './TaskEditPanel.vue'

const ElInputStub = {
  name: 'ElInputStub',
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @blur="$emit(\'blur\')" @keyup.enter="$emit(\'keyup.enter\')" />',
  props: ['modelValue', 'placeholder', 'type', 'rows'],
}

const ElButtonStub = {
  name: 'ElButtonStub',
  template: '<button type="button" @click="$emit(\'click\')"><slot/></button>',
  props: ['type', 'size'],
}

const ElTagStub = {
  name: 'ElTagStub',
  template: '<span class="el-tag" :data-type="type" @click="$emit(\'click\')"><slot/></span>',
  props: ['type', 'size', 'closable', 'color'],
}

const ElIconStub = {
  name: 'ElIconStub',
  template: '<i class="el-icon"><slot/></i>',
}

const ElDropdownStub = {
  name: 'ElDropdownStub',
  template: '<div class="el-dropdown" @click="$emit(\'click\')"><slot/></div>',
  props: ['trigger'],
}

const ElDropdownMenuStub = {
  name: 'ElDropdownMenuStub',
  template: '<div class="el-dropdown-menu"><slot/></div>',
}

const ElDropdownItemStub = {
  name: 'ElDropdownItemStub',
  template:
    '<div class="el-dropdown-item" :data-command="command" @click="$emit(\'click\')"><slot/></div>',
  props: ['command', 'divided'],
}

const ElPopoverStub = {
  name: 'ElPopoverStub',
  template: '<div class="el-popover" @hide="$emit(\'hide\')"><slot name="reference"/><slot/></div>',
  props: ['trigger', 'placement', 'width'],
}

const ElFormStub = {
  name: 'ElFormStub',
  template: '<form class="el-form"><slot/></form>',
  props: ['model'],
}

const ElFormItemStub = {
  name: 'ElFormItemStub',
  template: '<div class="el-form-item"><slot/></div>',
  props: ['label'],
}

const ElSelectStub = {
  name: 'ElSelectStub',
  template:
    '<div class="el-select" @update:modelValue="$emit(\'update:modelValue\', $event)"><slot/></div>',
  props: ['modelValue', 'placeholder', 'multiple', 'filterable'],
}

const ElOptionStub = {
  name: 'ElOptionStub',
  template: '<div class="el-option" :data-value="value"><slot/></div>',
  props: ['value', 'label'],
}

const ElDatePickerStub = {
  name: 'ElDatePickerStub',
  template:
    '<input :value="modelValue" @update:modelValue="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'type', 'placeholder', 'format', 'valueFormat'],
}

const ElInputNumberStub = {
  name: 'ElInputNumberStub',
  template:
    '<input type="number" :value="modelValue" @update:modelValue="$emit(\'update:modelValue\', Number($event.target.value))" />',
  props: ['modelValue', 'min', 'max'],
}

const ElCheckboxStub = {
  name: 'ElCheckboxStub',
  template:
    '<input type="checkbox" :checked="modelValue" @change="$emit(\'change\', $event.target.checked)" />',
  props: ['modelValue'],
}

const ElCheckboxGroupStub = {
  name: 'ElCheckboxGroupStub',
  template: '<div class="el-checkbox-group"><slot/></div>',
  props: ['modelValue'],
}

const ElSwitchStub = {
  name: 'ElSwitchStub',
  template:
    '<button role="switch" :aria-checked="String(modelValue)" @click="$emit(\'update:modelValue\', !modelValue)">{{ modelValue }}</button>',
  props: ['modelValue'],
}

const ElDividerStub = {
  name: 'ElDividerStub',
  template: '<hr class="el-divider" />',
}

function mountPanel(task: any, mode: 'panel' | 'dialog' = 'panel') {
  return mount(TaskEditPanel, {
    props: { task, mode },
    global: {
      stubs: {
        'el-input': ElInputStub,
        'el-button': ElButtonStub,
        'el-tag': ElTagStub,
        'el-icon': ElIconStub,
        'el-dropdown': ElDropdownStub,
        'el-dropdown-menu': ElDropdownMenuStub,
        'el-dropdown-item': ElDropdownItemStub,
        'el-popover': ElPopoverStub,
        'el-form': ElFormStub,
        'el-form-item': ElFormItemStub,
        'el-select': ElSelectStub,
        'el-option': ElOptionStub,
        'el-date-picker': ElDatePickerStub,
        'el-input-number': ElInputNumberStub,
        'el-checkbox': ElCheckboxStub,
        'el-checkbox-group': ElCheckboxGroupStub,
        'el-switch': ElSwitchStub,
        'el-divider': ElDividerStub,
      },
    },
  })
}

const baseTask = {
  id: 1,
  title: '原始标题',
  description: '原始描述',
  priority: 2,
  startDate: '',
  dueDate: '',
  listId: null,
  parentId: null,
  repeatRule: null,
  status: 0,
}

describe('TaskEditPanel.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    getListsMock.mockResolvedValue({
      data: [
        { id: 1, name: '工作' },
        { id: 2, name: '生活' },
      ],
    } as any)
    getSubtasksMock.mockResolvedValue({ data: [] } as any)
    updateTaskMock.mockResolvedValue({} as any)
    deleteTaskMock.mockResolvedValue({} as any)
    createTaskMock.mockResolvedValue({ id: 100 } as any)
    getTaskTagsMock.mockResolvedValue({ data: [] } as any)
    addTagToTaskMock.mockResolvedValue({} as any)
    removeTagFromTaskMock.mockResolvedValue({} as any)
    getTagsMock.mockResolvedValue({ data: [] } as any)
    setRepeatRuleMock.mockResolvedValue({} as any)
    cancelRepeatRuleMock.mockResolvedValue({} as any)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mount 时 init() 加载任务数据 → taskForm 字段填充', async () => {
    const task = { ...baseTask, title: '买菜', priority: 3, listId: 2 }
    const wrapper = mountPanel(task)
    await vi.runAllTimersAsync()
    await flushPromises()
    const form = (wrapper.vm as any).taskForm
    expect(form.title).toBe('买菜')
    expect(form.priority).toBe(3)
    expect(form.listId).toBe(2)
  })

  it('init() 加载列表、现有标签、子任务', async () => {
    getListsMock.mockResolvedValueOnce({ data: [{ id: 1, name: 'A' }] } as any)
    getSubtasksMock.mockResolvedValueOnce({ data: [{ id: 10, title: '子1', status: 0 }] } as any)
    getTaskTagsMock.mockResolvedValueOnce({ data: [{ id: 5, name: '重要' }] } as any)
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    expect((wrapper.vm as any).taskLists.length).toBe(1)
    expect((wrapper.vm as any).taskForm.subtasks.length).toBe(1)
    expect((wrapper.vm as any).taskTags.length).toBe(1)
  })

  it('标题修改 + blur → 触发 autoSave（debounce 300ms）', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    updateTaskMock.mockClear()
    ;(wrapper.vm as any).taskForm.title = '新标题'
    await (wrapper.vm as any).autoSave()
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(updateTaskMock).toHaveBeenCalledWith(1, expect.objectContaining({ title: '新标题' }))
  })

  it('标题为空时 doSave 不调用 API', async () => {
    const wrapper = mountPanel({ ...baseTask, title: '' })
    await vi.runAllTimersAsync()
    await flushPromises()
    updateTaskMock.mockClear()
    await (wrapper.vm as any).doSave()
    await flushPromises()
    expect(updateTaskMock).not.toHaveBeenCalled()
  })

  it('优先级切换 (0-3) → autoSave', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    updateTaskMock.mockClear()
    ;(wrapper.vm as any).handlePriorityChange(3)
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(updateTaskMock).toHaveBeenCalledWith(1, expect.objectContaining({ priority: 3 }))
  })

  it('清单切换 → autoSave（"null" 字符串转 null）', async () => {
    const wrapper = mountPanel({ ...baseTask, listId: 1 })
    await vi.runAllTimersAsync()
    await flushPromises()
    updateTaskMock.mockClear()
    ;(wrapper.vm as any).handleListChange('null')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(updateTaskMock).toHaveBeenCalledWith(1, expect.objectContaining({ listId: null }))
  })

  it('清单切换为 ID → autoSave 保存该 ID', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    updateTaskMock.mockClear()
    ;(wrapper.vm as any).handleListChange(2)
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(updateTaskMock).toHaveBeenCalledWith(1, expect.objectContaining({ listId: 2 }))
  })

  it('标签下拉打开时 loadAllTags 被调用', async () => {
    getTagsMock.mockResolvedValueOnce({
      data: [
        { id: 1, name: 'A', color: '#f00' },
        { id: 2, name: 'B', color: '#0f0' },
      ],
    } as any)
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    await (wrapper.vm as any).loadAllTags()
    await flushPromises()
    expect((wrapper.vm as any).allTags.length).toBe(2)
  })

  it('标签选择变更 → 移除旧标签 + 添加新标签', async () => {
    getTaskTagsMock.mockResolvedValue({ data: [{ id: 1, name: '旧' }] } as any)
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    ;(wrapper.vm as any).selectedTagIds = [2, 3]
    await (wrapper.vm as any).handleTagChange()
    await flushPromises()
    expect(removeTagFromTaskMock).toHaveBeenCalledWith(1, 1)
    expect(addTagToTaskMock).toHaveBeenCalledWith(1, 2)
    expect(addTagToTaskMock).toHaveBeenCalledWith(1, 3)
  })

  it('标签关闭 → removeTagFromTask + 从列表移除', async () => {
    getTaskTagsMock.mockResolvedValue({
      data: [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ],
    } as any)
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    await (wrapper.vm as any).handleRemoveTag(1)
    await flushPromises()
    expect(removeTagFromTaskMock).toHaveBeenCalledWith(1, 1)
    expect((wrapper.vm as any).taskTags.length).toBe(1)
    expect((wrapper.vm as any).selectedTagIds).toEqual([2])
  })

  it('描述输入 + blur → autoSave', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    updateTaskMock.mockClear()
    ;(wrapper.vm as any).taskForm.description = '新描述'
    await (wrapper.vm as any).autoSave()
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(updateTaskMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ description: '新描述' }),
    )
  })

  it('描述切换为预览 → 渲染 Markdown HTML', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    ;(wrapper.vm as any).taskForm.description = '# 标题\n**粗体**'
    ;(wrapper.vm as any).descriptionPreview = true
    await wrapper.vm.$nextTick()
    const html = (wrapper.vm as any).renderMarkdown('# 标题\n**粗体**')
    expect(html).toContain('<h1')
    expect(html).toContain('<strong>')
  })

  it('子任务 addSubtask → 推入空 subtask', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    const before = (wrapper.vm as any).taskForm.subtasks.length
    ;(wrapper.vm as any).addSubtask()
    expect((wrapper.vm as any).taskForm.subtasks.length).toBe(before + 1)
    expect((wrapper.vm as any).taskForm.subtasks[before].title).toBe('')
    expect((wrapper.vm as any).taskForm.subtasks[before].completed).toBe(false)
  })

  it('子任务勾选 → handleSubtaskToggle 翻转 completed', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    const st = { title: 'X', completed: false }
    ;(wrapper.vm as any).handleSubtaskToggle(st)
    expect(st.completed).toBe(true)
    ;(wrapper.vm as any).handleSubtaskToggle(st)
    expect(st.completed).toBe(false)
  })

  it('子任务删除（未保存）→ 直接 splice', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    ;(wrapper.vm as any).taskForm.subtasks = [{ title: 'A' }, { title: 'B' }]
    deleteTaskMock.mockClear()
    await (wrapper.vm as any).removeSubtask(0)
    await flushPromises()
    expect((wrapper.vm as any).taskForm.subtasks.length).toBe(1)
    expect(deleteTaskMock).not.toHaveBeenCalled()
  })

  it('子任务删除（已保存）→ 调 deleteTask + splice', async () => {
    getSubtasksMock.mockResolvedValue({ data: [{ id: 10, title: 'A' }] } as any)
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    ;(wrapper.vm as any).taskForm.subtasks = [{ id: 10, title: 'A' }, { title: 'B' }]
    deleteTaskMock.mockClear()
    await (wrapper.vm as any).removeSubtask(0)
    await flushPromises()
    expect(deleteTaskMock).toHaveBeenCalledWith(10)
    expect((wrapper.vm as any).taskForm.subtasks.length).toBe(1)
  })

  it('子任务回车 → autoSave + addSubtask', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    const before = (wrapper.vm as any).taskForm.subtasks.length
    await (wrapper.vm as any).handleSubtaskEnter()
    await flushPromises()
    expect((wrapper.vm as any).taskForm.subtasks.length).toBe(before + 1)
  })

  it('删除任务 → deleteTask + emit close + emit changed', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    await (wrapper.vm as any).handleDeleteTask()
    await flushPromises()
    expect(deleteTaskMock).toHaveBeenCalledWith(1)
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('changed')).toBeTruthy()
  })

  it('重复规则添加（DAILY）→ setRepeatRule + 更新 task.repeatRule', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    ;(wrapper.vm as any).repeatForm.type = 'DAILY'
    ;(wrapper.vm as any).repeatForm.interval = 2
    await (wrapper.vm as any).handleAddRepeatInPanel()
    await flushPromises()
    expect(setRepeatRuleMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ type: 'DAILY', interval: 2 }),
    )
    expect((wrapper.vm as any).task.repeatRule).toContain('DAILY')
  })

  it('重复规则更新 endDate', async () => {
    const task = {
      ...baseTask,
      repeatRule: JSON.stringify({ type: 'DAILY', interval: 1, endDate: null }),
    }
    const wrapper = mountPanel(task)
    await vi.runAllTimersAsync()
    await flushPromises()
    ;(wrapper.vm as any).editRepeatEndDate = '2025-12-31T23:59:59'
    await (wrapper.vm as any).handleUpdateRepeatEndDate()
    await flushPromises()
    expect(setRepeatRuleMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ endDate: '2025-12-31T23:59:59' }),
    )
  })

  it('重复规则取消 → cancelRepeatRule + 清空', async () => {
    const task = { ...baseTask, repeatRule: JSON.stringify({ type: 'DAILY' }) }
    const wrapper = mountPanel(task)
    await vi.runAllTimersAsync()
    await flushPromises()
    await (wrapper.vm as any).handleCancelRepeat()
    await flushPromises()
    expect(cancelRepeatRuleMock).toHaveBeenCalledWith(1)
    expect((wrapper.vm as any).task.repeatRule).toBeNull()
  })

  it('onRepeatTypeChange 重置 weekDays/dayOfMonth/endDate', async () => {
    const wrapper = mountPanel(baseTask)
    await vi.runAllTimersAsync()
    await flushPromises()
    const rf = (wrapper.vm as any).repeatForm
    rf.type = 'WEEKLY'
    rf.interval = 2
    rf.weekDays = [1, 2]
    rf.dayOfMonth = 15
    rf.endDate = '2025-01-01'
    ;(wrapper.vm as any).onRepeatTypeChange()
    expect((wrapper.vm as any).repeatForm.weekDays).toEqual([])
    expect((wrapper.vm as any).repeatForm.dayOfMonth).toBe(1)
    expect((wrapper.vm as any).repeatForm.endDate).toBe('')
    expect((wrapper.vm as any).repeatForm.interval).toBe(1)
  })

  it('getTimeSummary 组合：无时间时返回"时间"', () => {
    const wrapper = mountPanel({ ...baseTask, startDate: '', dueDate: '', repeatRule: null })
    expect((wrapper.vm as any).getTimeSummary()).toBe('时间')
  })

  it('getTimeSummary 有 dueDate → 返回格式化日期', () => {
    const wrapper = mountPanel({
      ...baseTask,
      dueDate: '2025-06-15',
      startDate: '',
      repeatRule: null,
    })
    const summary = (wrapper.vm as any).getTimeSummary()
    expect(summary).toContain('6/15')
  })

  it('getTimeSummary 有 repeatRule → 包含循环标签', () => {
    const task = {
      ...baseTask,
      dueDate: '2025-06-15',
      repeatRule: JSON.stringify({ type: 'DAILY', interval: 1 }),
    }
    const wrapper = mountPanel(task)
    const summary = (wrapper.vm as any).getTimeSummary()
    expect(summary).toContain('每天')
  })

  it('mode=dialog 时显示底部 footer 按钮', async () => {
    const wrapper = mountPanel(baseTask, 'dialog')
    await vi.runAllTimersAsync()
    await flushPromises()
    const buttons = wrapper.findAllComponents(ElButtonStub)
    const btnTexts = buttons.map((b) => b.text().trim())
    expect(btnTexts.some((t) => t === '关闭')).toBe(true)
    expect(btnTexts.some((t) => t === '删除')).toBe(true)
  })
})

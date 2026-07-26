import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, type PropType } from 'vue'

const getSubtasksMock = vi.fn()
const createTaskMock = vi.fn()
const completeTaskMock = vi.fn()
const uncompleteTaskMock = vi.fn()
const deleteTaskMock = vi.fn()

const ElMessageBoxConfirmMock = vi.fn()

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  ElMessageBox: { confirm: (...args: unknown[]) => ElMessageBoxConfirmMock(...args) },
}))

vi.mock('../api/task', () => ({
  getSubtasks: (...args: unknown[]) => getSubtasksMock(...args),
  createTask: (...args: unknown[]) => createTaskMock(...args),
  completeTask: (...args: unknown[]) => completeTaskMock(...args),
  uncompleteTask: (...args: unknown[]) => uncompleteTaskMock(...args),
  deleteTask: (...args: unknown[]) => deleteTaskMock(...args),
}))

vi.mock('@element-plus/icons-vue', () => ({
  Plus: { name: 'PlusStub' },
  Delete: { name: 'DeleteStub' },
}))

import SubtasksView from './SubtasksView.vue'

const makeStub = (
  name: string,
  render: any,
  props: string[] = [],
  emits: string[] = ['click', 'update:modelValue'],
) =>
  defineComponent({
    name,
    props: props as PropType<string>[],
    emits,
    setup(p, { slots, emit, attrs }) {
      return () => render({ props: p, slots, emit, attrs })
    },
  })

const ElButtonStub = makeStub(
  'ElButtonStub',
  ({ props, slots, emit }) =>
    h('button', { type: 'button', onClick: () => emit('click') }, slots.default?.()),
  ['type', 'size', 'link'],
)

const ElIconStub = makeStub('ElIconStub', ({ slots }) => h('i', slots.default?.()))

const ElEmptyStub = makeStub('ElEmptyStub', () => h('div', { class: 'el-empty' }), [
  'description',
  'imageSize',
])

const ElCheckboxStub = makeStub(
  'ElCheckboxStub',
  ({ props, emit }) =>
    h('input', {
      type: 'checkbox',
      checked: !!props.modelValue,
      onChange: (e: Event) => emit('change', (e.target as HTMLInputElement).checked),
    }),
  ['modelValue'],
)

const ElDialogStub = makeStub(
  'ElDialogStub',
  ({ props, slots }) =>
    props.modelValue
      ? h('div', { 'data-testid': 'subtask-dialog' }, [
          slots.default?.(),
          slots.footer
            ? h('div', { 'data-testid': 'subtask-dialog-footer' }, slots.footer())
            : null,
        ])
      : null,
  ['modelValue', 'title', 'width'],
)

const ElFormStub = makeStub('ElFormStub', ({ slots }) => h('form', slots.default?.()))

const ElFormItemStub = makeStub('ElFormItemStub', ({ slots }) => h('div', slots.default?.()), [
  'label',
])

const ElInputStub = makeStub(
  'ElInputStub',
  ({ props, emit }) =>
    h('input', {
      value: props.modelValue,
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
    }),
  ['modelValue', 'placeholder'],
)

function mountView(parentId = 1) {
  return mount(SubtasksView, {
    props: { parentId },
    global: {
      stubs: {
        'el-button': ElButtonStub,
        'el-icon': ElIconStub,
        'el-empty': ElEmptyStub,
        'el-checkbox': ElCheckboxStub,
        'el-dialog': ElDialogStub,
        'el-form': ElFormStub,
        'el-form-item': ElFormItemStub,
        'el-input': ElInputStub,
      },
    },
  })
}

describe('SubtasksView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSubtasksMock.mockResolvedValue({ data: [] } as any)
    createTaskMock.mockResolvedValue({ id: 100 } as any)
    completeTaskMock.mockResolvedValue({} as any)
    uncompleteTaskMock.mockResolvedValue({} as any)
    deleteTaskMock.mockResolvedValue({} as any)
    ElMessageBoxConfirmMock.mockResolvedValue('confirm' as any)
  })

  it('loads subtasks on mount', async () => {
    getSubtasksMock.mockResolvedValue({ data: [{ id: 1, title: '子1', status: 0 }] } as any)
    const wrapper = mountView(7)
    await flushPromises()
    expect(getSubtasksMock).toHaveBeenCalledWith(7)
    expect(wrapper.text()).toContain('子1')
  })

  it('shows empty state when no subtasks', async () => {
    getSubtasksMock.mockResolvedValue({ data: [] } as any)
    const wrapper = mountView(7)
    await flushPromises()
    expect(wrapper.findComponent(ElEmptyStub).exists()).toBe(true)
  })

  it('reloads subtasks when parentId changes', async () => {
    const wrapper = mountView(1)
    await flushPromises()
    expect(getSubtasksMock).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ parentId: 2 })
    await flushPromises()
    expect(getSubtasksMock).toHaveBeenCalledTimes(2)
    expect(getSubtasksMock).toHaveBeenLastCalledWith(2)
  })

  it('opens add dialog when 添加子任务 button is clicked', async () => {
    const wrapper = mountView(1)
    await flushPromises()
    const addButton = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('添加子任务'))!
    await addButton.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ElDialogStub).props('modelValue')).toBe(true)
  })

  it('does not call createTask when title is empty (warning shown)', async () => {
    const wrapper = mountView(1)
    await flushPromises()
    const addButton = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('添加子任务'))!
    await addButton.trigger('click')
    await wrapper.vm.$nextTick()
    const confirmButton = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('确定') && !b.props('link'))!
    await confirmButton.trigger('click')
    await flushPromises()
    expect(createTaskMock).not.toHaveBeenCalled()
  })

  it('creates subtask with parentId and resets form on success', async () => {
    const wrapper = mountView(5)
    await flushPromises()
    getSubtasksMock.mockResolvedValue({
      data: [{ id: 200, title: '新建', status: 0, parentId: 5 }],
    } as any)
    const addButton = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('添加子任务'))!
    await addButton.trigger('click')
    await wrapper.vm.$nextTick()
    const input = wrapper.findComponent(ElInputStub)
    await input.vm.$emit('update:modelValue', '新建')
    await wrapper.vm.$nextTick()
    const confirmButton = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('确定') && !b.props('link'))!
    await confirmButton.trigger('click')
    await flushPromises()
    expect(createTaskMock).toHaveBeenCalledWith({
      title: '新建',
      parentId: 5,
      priority: 2,
      status: 0,
    })
    expect(wrapper.findComponent(ElDialogStub).props('modelValue')).toBe(false)
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('calls completeTask when checkbox is checked (status 0 → 1)', async () => {
    getSubtasksMock.mockResolvedValue({ data: [{ id: 1, title: '子1', status: 0 }] } as any)
    const wrapper = mountView(1)
    await flushPromises()
    const checkbox = wrapper.findComponent(ElCheckboxStub)
    await checkbox.vm.$emit('change', true)
    await flushPromises()
    expect(completeTaskMock).toHaveBeenCalledWith(1)
    expect(uncompleteTaskMock).not.toHaveBeenCalled()
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('calls uncompleteTask when checkbox is unchecked (status 1 → 0)', async () => {
    getSubtasksMock.mockResolvedValue({ data: [{ id: 1, title: '子1', status: 1 }] } as any)
    const wrapper = mountView(1)
    await flushPromises()
    const checkbox = wrapper.findComponent(ElCheckboxStub)
    await checkbox.vm.$emit('change', false)
    await flushPromises()
    expect(uncompleteTaskMock).toHaveBeenCalledWith(1)
    expect(completeTaskMock).not.toHaveBeenCalled()
  })

  it('shows completed class for status=1 subtasks', async () => {
    getSubtasksMock.mockResolvedValue({
      data: [
        { id: 1, title: '未完成', status: 0 },
        { id: 2, title: '已完成', status: 1 },
      ],
    } as any)
    const wrapper = mountView(1)
    await flushPromises()
    const items = wrapper.findAll('.subtask-item')
    expect(items[0].classes()).not.toContain('completed')
    expect(items[1].classes()).toContain('completed')
  })

  it('deletes subtask after ElMessageBox confirm', async () => {
    getSubtasksMock.mockResolvedValue({ data: [{ id: 1, title: '子1', status: 0 }] } as any)
    const wrapper = mountView(1)
    await flushPromises()
    const deleteButton = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.props('type') === 'danger' && 'link' in b.props())!
    await deleteButton.trigger('click')
    await flushPromises()
    expect(ElMessageBoxConfirmMock).toHaveBeenCalled()
    expect(deleteTaskMock).toHaveBeenCalledWith(1)
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('does not delete when ElMessageBox is cancelled', async () => {
    ElMessageBoxConfirmMock.mockRejectedValue('cancel' as any)
    getSubtasksMock.mockResolvedValue({ data: [{ id: 1, title: '子1', status: 0 }] } as any)
    const wrapper = mountView(1)
    await flushPromises()
    const deleteButton = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.props('type') === 'danger' && 'link' in b.props())!
    await deleteButton.trigger('click')
    await flushPromises()
    expect(deleteTaskMock).not.toHaveBeenCalled()
  })
})

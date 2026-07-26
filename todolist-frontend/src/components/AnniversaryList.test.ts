import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const getAnniversariesMock = vi.fn()
const getAnniversaryByIdMock = vi.fn()
const createAnniversaryMock = vi.fn()
const updateAnniversaryMock = vi.fn()
const deleteAnniversaryMock = vi.fn()
const generateTodoMock = vi.fn()

const ElMessageBoxConfirmMock = vi.fn()
let validateResult = true
const validateMock = vi.fn((cb: any) => cb(validateResult))

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  ElMessageBox: { confirm: (...args: unknown[]) => ElMessageBoxConfirmMock(...args) },
}))

vi.mock('../api/anniversary', () => ({
  getAnniversaries: (...args: unknown[]) => getAnniversariesMock(...args),
  getAnniversaryById: (...args: unknown[]) => getAnniversaryByIdMock(...args),
  createAnniversary: (...args: unknown[]) => createAnniversaryMock(...args),
  updateAnniversary: (...args: unknown[]) => updateAnniversaryMock(...args),
  deleteAnniversary: (...args: unknown[]) => deleteAnniversaryMock(...args),
  generateTodo: (...args: unknown[]) => generateTodoMock(...args),
}))

import AnniversaryList from './AnniversaryList.vue'

const ElButtonStub = {
  name: 'ElButtonStub',
  template: '<button type="button" @click="$emit(\'click\')"><slot/></button>',
  props: ['type', 'size'],
}

const ElInputStub = {
  name: 'ElInputStub',
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder'],
}

const ElSelectStub = {
  name: 'ElSelectStub',
  template:
    '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot/></select>',
  props: ['modelValue', 'placeholder'],
}

const ElOptionStub = {
  name: 'ElOptionStub',
  template: '<option :value="value"><slot/></option>',
  props: ['value', 'label'],
}

const ElIconStub = {
  name: 'ElIconStub',
  template: '<i class="el-icon"><slot/></i>',
}

const ElEmptyStub = {
  name: 'ElEmptyStub',
  template: '<div class="el-empty"><slot/></div>',
  props: ['description'],
}

const ElTagStub = {
  name: 'ElTagStub',
  template: '<span class="el-tag" :data-type="type"><slot/></span>',
  props: ['type', 'size', 'effect'],
}

const ElDialogStub = {
  name: 'ElDialogStub',
  props: ['modelValue', 'title', 'width'],
  template: `
    <div v-if="modelValue" data-testid="dialog">
      <slot/>
      <div data-testid="dialog-footer">
        <slot name="footer"/>
      </div>
    </div>
  `,
}

const ElDrawerStub = {
  name: 'ElDrawerStub',
  props: ['modelValue', 'title', 'size'],
  template: `
    <div v-if="modelValue" data-testid="drawer">
      <slot/>
    </div>
  `,
}

const ElFormStub = {
  name: 'ElFormStub',
  props: ['model', 'rules'],
  template: '<form><slot/></form>',
  setup(_, { expose }: any) {
    expose({
      validate: (cb: any) => validateMock(cb),
    })
  },
}

const ElFormItemStub = {
  name: 'ElFormItemStub',
  template: '<div class="el-form-item"><slot/></div>',
  props: ['label', 'prop'],
}

const ElDatePickerStub = {
  name: 'ElDatePickerStub',
  template:
    '<input :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder', 'type', 'valueFormat'],
}

const ElSwitchStub = {
  name: 'ElSwitchStub',
  template:
    '<button role="switch" :aria-checked="String(modelValue)" @click="$emit(\'update:modelValue\', !modelValue)">{{ modelValue }}</button>',
  props: ['modelValue'],
}

const ElCheckboxGroupStub = {
  name: 'ElCheckboxGroupStub',
  props: ['modelValue'],
  template: '<div class="el-checkbox-group"><slot/></div>',
}

const ElCheckboxStub = {
  name: 'ElCheckboxStub',
  props: ['label', 'modelValue'],
  template:
    '<label class="el-checkbox" @click.prevent="$emit(\'update:modelValue\', label)">{{ label }}<slot/></label>',
}

const ElTimePickerStub = {
  name: 'ElTimePickerStub',
  template:
    '<input :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder', 'format', 'valueFormat'],
}

const ElDescriptionsStub = {
  name: 'ElDescriptionsStub',
  template: '<div class="el-descriptions"><slot/></div>',
  props: ['column', 'border'],
}

const ElDescriptionsItemStub = {
  name: 'ElDescriptionsItemStub',
  template: '<div class="el-descriptions-item"><slot/></div>',
  props: ['label'],
}

function mountView() {
  return mount(AnniversaryList, {
    global: {
      directives: {
        loading: { mounted: () => {}, updated: () => {}, unmounted: () => {} },
      },
      stubs: {
        'el-button': ElButtonStub,
        'el-icon': ElIconStub,
        'el-input': ElInputStub,
        'el-select': ElSelectStub,
        'el-option': ElOptionStub,
        'el-empty': ElEmptyStub,
        'el-tag': ElTagStub,
        'el-dialog': ElDialogStub,
        'el-drawer': ElDrawerStub,
        'el-form': ElFormStub,
        'el-form-item': ElFormItemStub,
        'el-date-picker': ElDatePickerStub,
        'el-switch': ElSwitchStub,
        'el-checkbox-group': ElCheckboxGroupStub,
        'el-checkbox': ElCheckboxStub,
        'el-time-picker': ElTimePickerStub,
        'el-descriptions': ElDescriptionsStub,
        'el-descriptions-item': ElDescriptionsItemStub,
      },
    },
  })
}

describe('AnniversaryList.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    validateResult = true
    validateMock.mockClear()
    getAnniversariesMock.mockResolvedValue({ data: [] } as any)
    getAnniversaryByIdMock.mockResolvedValue({ data: {} } as any)
    createAnniversaryMock.mockResolvedValue({ id: 1 } as any)
    updateAnniversaryMock.mockResolvedValue({} as any)
    deleteAnniversaryMock.mockResolvedValue({} as any)
    generateTodoMock.mockResolvedValue({} as any)
    ElMessageBoxConfirmMock.mockResolvedValue('confirm' as any)
  })

  it('loads anniversaries on mount', async () => {
    getAnniversariesMock.mockResolvedValue({
      data: [{ id: 1, name: '生日', date: '2025-01-01' }],
    } as any)
    const wrapper = mountView()
    await flushPromises()
    expect(getAnniversariesMock).toHaveBeenCalled()
    expect((wrapper.vm as any).list.length).toBe(1)
    expect((wrapper.vm as any).list[0].name).toBe('生日')
  })

  it('shows empty state when list is empty', async () => {
    getAnniversariesMock.mockResolvedValue({ data: [] } as any)
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.findComponent(ElEmptyStub).exists()).toBe(true)
  })

  it('opens create dialog with reset form when 新建纪念日 clicked', async () => {
    const wrapper = mountView()
    await flushPromises()
    const newButton = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('新建纪念日'))!
    await newButton.trigger('click')
    await flushPromises()
    expect((wrapper.vm as any).showForm).toBe(true)
    expect((wrapper.vm as any).editingItem).toBeNull()
    expect((wrapper.vm as any).form.name).toBe('')
    expect((wrapper.vm as any).form.date).toBe('')
    expect((wrapper.vm as any).form.repeatType).toBe('NONE')
    expect((wrapper.vm as any).form.remindEnabled).toBe(false)
  })

  it('loadList passes sortBy and order params to API', async () => {
    const wrapper = mountView()
    await flushPromises()
    getAnniversariesMock.mockClear()
    ;(wrapper.vm as any).loadList()
    await flushPromises()
    const lastCallArgs = getAnniversariesMock.mock.calls[0][0]
    expect(lastCallArgs.sortBy).toBe('nextDate')
    expect(lastCallArgs.order).toBe('asc')
  })

  it('loadList does not include search/tag params when empty', async () => {
    const wrapper = mountView()
    await flushPromises()
    getAnniversariesMock.mockClear()
    ;(wrapper.vm as any).loadList()
    await flushPromises()
    const lastCallArgs = getAnniversariesMock.mock.calls[0][0]
    expect(lastCallArgs.search).toBeUndefined()
    expect(lastCallArgs.tag).toBeUndefined()
  })

  it('toggleOrder flips sortOrder and reloads', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect((wrapper.vm as any).sortOrder).toBe('asc')
    getAnniversariesMock.mockClear()
    ;(wrapper.vm as any).toggleOrder()
    await flushPromises()
    expect((wrapper.vm as any).sortOrder).toBe('desc')
    expect(getAnniversariesMock).toHaveBeenCalled()
  })

  it('openDetail fetches anniversary and opens drawer', async () => {
    getAnniversaryByIdMock.mockResolvedValue({ data: { id: 1, name: '生日', daysUntil: 5 } } as any)
    const wrapper = mountView()
    await flushPromises()
    await (wrapper.vm as any).openDetail({ id: 1, name: '生日' })
    await flushPromises()
    expect(getAnniversaryByIdMock).toHaveBeenCalledWith(1)
    expect((wrapper.vm as any).detailItem.name).toBe('生日')
    expect((wrapper.vm as any).showDetail).toBe(true)
  })

  it('editFromDetail populates form and opens dialog', async () => {
    getAnniversaryByIdMock.mockResolvedValue({
      data: {
        id: 1,
        name: '生日',
        date: '2025-01-01',
        repeatType: 'YEARLY',
        remindEnabled: true,
        remindTime: '10:00',
        remindDaysBefore: '1,3',
        tags: '家人,朋友',
        notes: '重要',
      },
    } as any)
    const wrapper = mountView()
    await flushPromises()
    await (wrapper.vm as any).openDetail({ id: 1 })
    await flushPromises()
    ;(wrapper.vm as any).editFromDetail()
    await flushPromises()
    expect((wrapper.vm as any).editingItem).not.toBeNull()
    expect((wrapper.vm as any).form.name).toBe('生日')
    expect((wrapper.vm as any).form.date).toBe('2025-01-01')
    expect((wrapper.vm as any).form.repeatType).toBe('YEARLY')
    expect((wrapper.vm as any).form.tags).toBe('家人,朋友')
    expect((wrapper.vm as any).remindDaysArr).toEqual(['1', '3'])
    expect((wrapper.vm as any).showDetail).toBe(false)
    expect((wrapper.vm as any).showForm).toBe(true)
  })

  it('handleSave calls createAnniversary for new items', async () => {
    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).openCreate()
    await flushPromises()
    const form = (wrapper.vm as any).form
    form.name = '纪念日X'
    form.date = '2025-06-15'
    await (wrapper.vm as any).handleSave()
    await flushPromises()
    expect(createAnniversaryMock).toHaveBeenCalled()
    const callArgs = createAnniversaryMock.mock.calls[0][0]
    expect(callArgs.name).toBe('纪念日X')
    expect(callArgs.date).toBe('2025-06-15')
    expect(callArgs.remindDaysBefore).toBe('0')
  })

  it('handleSave calls updateAnniversary for editing items', async () => {
    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).openCreate()
    await flushPromises()
    ;(wrapper.vm as any).editingItem = { id: 7, name: '旧名' }
    ;(wrapper.vm as any).form.name = '新名'
    ;(wrapper.vm as any).form.date = '2025-12-31'
    await (wrapper.vm as any).handleSave()
    await flushPromises()
    expect(updateAnniversaryMock).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ name: '新名', date: '2025-12-31' }),
    )
    expect(createAnniversaryMock).not.toHaveBeenCalled()
  })

  it('handleSave does nothing when validation fails', async () => {
    validateResult = false
    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).openCreate()
    await flushPromises()
    await (wrapper.vm as any).handleSave()
    await flushPromises()
    expect(createAnniversaryMock).not.toHaveBeenCalled()
    expect(updateAnniversaryMock).not.toHaveBeenCalled()
  })

  it('handleSave displays error message on API failure', async () => {
    const { ElMessage } = await import('element-plus')
    createAnniversaryMock.mockRejectedValue({
      response: { data: { message: '名称已存在' } },
    } as any)
    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).openCreate()
    await flushPromises()
    ;(wrapper.vm as any).form.name = 'X'
    ;(wrapper.vm as any).form.date = '2025-01-01'
    await (wrapper.vm as any).handleSave()
    await flushPromises()
    expect(ElMessage.error).toHaveBeenCalledWith('名称已存在')
  })

  it('handleDelete confirms and calls API', async () => {
    const wrapper = mountView()
    await flushPromises()
    getAnniversaryByIdMock.mockResolvedValue({ data: { id: 5, name: 'X' } } as any)
    await (wrapper.vm as any).openDetail({ id: 5 })
    await flushPromises()
    deleteAnniversaryMock.mockClear()
    await (wrapper.vm as any).handleDelete()
    await flushPromises()
    expect(ElMessageBoxConfirmMock).toHaveBeenCalled()
    expect(deleteAnniversaryMock).toHaveBeenCalledWith(5)
    expect((wrapper.vm as any).showDetail).toBe(false)
  })

  it('handleDelete skips when user cancels', async () => {
    ElMessageBoxConfirmMock.mockRejectedValue('cancel' as any)
    const wrapper = mountView()
    await flushPromises()
    getAnniversaryByIdMock.mockResolvedValue({ data: { id: 5, name: 'X' } } as any)
    await (wrapper.vm as any).openDetail({ id: 5 })
    await flushPromises()
    deleteAnniversaryMock.mockClear()
    await (wrapper.vm as any).handleDelete()
    await flushPromises()
    expect(deleteAnniversaryMock).not.toHaveBeenCalled()
    expect((wrapper.vm as any).showDetail).toBe(true)
  })

  it('handleGenerateTodo calls API and shows success', async () => {
    const wrapper = mountView()
    await flushPromises()
    getAnniversaryByIdMock.mockResolvedValue({ data: { id: 8, name: '生日' } } as any)
    await (wrapper.vm as any).openDetail({ id: 8 })
    await flushPromises()
    await (wrapper.vm as any).handleGenerateTodo()
    await flushPromises()
    expect(generateTodoMock).toHaveBeenCalledWith(8)
  })

  it('parseTags splits comma-separated string and trims', () => {
    const wrapper = mountView()
    expect((wrapper.vm as any).parseTags('a, b ,c')).toEqual(['a', 'b', 'c'])
    expect((wrapper.vm as any).parseTags('')).toEqual([])
    expect((wrapper.vm as any).parseTags('only')).toEqual(['only'])
  })

  it('repeatText maps enum values', () => {
    const wrapper = mountView()
    expect((wrapper.vm as any).repeatText('NONE')).toBe('不重复')
    expect((wrapper.vm as any).repeatText('YEARLY')).toBe('每年')
    expect((wrapper.vm as any).repeatText('MONTHLY')).toBe('每月')
    expect((wrapper.vm as any).repeatText('WEEKLY')).toBe('每周')
    expect((wrapper.vm as any).repeatText('UNKNOWN')).toBe('UNKNOWN')
  })

  it('countdownClass returns correct class based on days', () => {
    const wrapper = mountView()
    expect((wrapper.vm as any).countdownClass(0)).toBe('countdown-today')
    expect((wrapper.vm as any).countdownClass(3)).toBe('countdown-urgent')
    expect((wrapper.vm as any).countdownClass(15)).toBe('countdown-near')
    expect((wrapper.vm as any).countdownClass(100)).toBe('countdown-far')
    expect((wrapper.vm as any).countdownClass(-5)).toBe('countdown-far')
  })

  it('allTags computed extracts unique tags from list', async () => {
    getAnniversariesMock.mockResolvedValue({
      data: [
        { id: 1, tags: '家人,朋友' },
        { id: 2, tags: '工作,家人' },
        { id: 3, tags: '' },
      ],
    } as any)
    const wrapper = mountView()
    await flushPromises()
    const allTags = (wrapper.vm as any).allTags
    expect(allTags.sort()).toEqual(['家人', '工作', '朋友'])
  })

  it('formatDate returns empty string for empty input', () => {
    const wrapper = mountView()
    expect((wrapper.vm as any).formatDate('')).toBe('')
  })

  it('formatDateTime formats date object correctly', () => {
    const wrapper = mountView()
    expect((wrapper.vm as any).formatDateTime('')).toBe('')
    expect((wrapper.vm as any).formatDateTime('2025-06-15T10:30:00')).toContain('2025')
    expect((wrapper.vm as any).formatDateTime('2025-06-15T10:30:00')).toContain('10:30')
  })
})

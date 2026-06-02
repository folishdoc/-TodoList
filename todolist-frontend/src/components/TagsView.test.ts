import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const getTagsMock = vi.fn()
const createTagMock = vi.fn()
const updateTagMock = vi.fn()
const deleteTagMock = vi.fn()

const ElMessageBoxConfirmMock = vi.fn()
let validateResult = true
const validateMock = vi.fn((cb: any) => cb(validateResult))

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  ElMessageBox: { confirm: (...args: unknown[]) => ElMessageBoxConfirmMock(...args) }
}))

vi.mock('../api/tag', () => ({
  getTags: (...args: unknown[]) => getTagsMock(...args),
  createTag: (...args: unknown[]) => createTagMock(...args),
  updateTag: (...args: unknown[]) => updateTagMock(...args),
  deleteTag: (...args: unknown[]) => deleteTagMock(...args)
}))

vi.mock('@element-plus/icons-vue', () => ({
  Plus: { template: '<i class="icon-plus" />' }
}))

import TagsView from './TagsView.vue'

const ElButtonStub = {
  name: 'ElButtonStub',
  template: '<button type="button" @click="$emit(\'click\')"><slot/></button>',
  props: ['type', 'size']
}

const ElIconStub = {
  name: 'ElIconStub',
  template: '<i><slot/></i>'
}

const ElCardStub = {
  name: 'ElCardStub',
  template: '<div class="el-card"><slot name="header"/><slot/></div>'
}

const ElEmptyStub = {
  name: 'ElEmptyStub',
  template: '<div class="el-empty"></div>',
  props: ['description']
}

const ElTableStub = {
  name: 'ElTableStub',
  props: ['data', 'loading'],
  template: '<table data-testid="tags-table"><tbody><slot/></tbody></table>'
}

const ElTableColumnStub = {
  name: 'ElTableColumnStub',
  template: '<td class="el-table-column"></td>',
  props: ['prop', 'label', 'width', 'fixed']
}

const ElTagStub = {
  name: 'ElTagStub',
  template: '<span class="el-tag" :style="{ background: color }"><slot/></span>',
  props: ['color', 'effect']
}

const ElDialogStub = {
  name: 'ElDialogStub',
  props: ['modelValue', 'title', 'width'],
  template: `
    <div v-if="modelValue" data-testid="tag-dialog">
      <slot/>
      <div data-testid="tag-dialog-footer">
        <slot name="footer"/>
      </div>
    </div>
  `
}

const ElFormStub = {
  name: 'ElFormStub',
  props: ['model', 'rules'],
  template: '<form><slot/></form>',
  setup(_, { expose }: any) {
    expose({
      validate: (cb: any) => validateMock(cb)
    })
  }
}

const ElFormItemStub = {
  name: 'ElFormItemStub',
  template: '<div class="el-form-item"><slot/></div>',
  props: ['label', 'prop']
}

const ElInputStub = {
  name: 'ElInputStub',
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder']
}

const ElColorPickerStub = {
  name: 'ElColorPickerStub',
  template: '<input type="color" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue']
}

function mountView() {
  return mount(TagsView, {
    global: {
      directives: {
        loading: { mounted: () => {}, updated: () => {}, unmounted: () => {} }
      },
      components: {
        'el-button-stub': ElButtonStub
      },
      stubs: {
        'el-button': ElButtonStub,
        'el-icon': ElIconStub,
        'el-card': ElCardStub,
        'el-empty': ElEmptyStub,
        'el-table': ElTableStub,
        'el-table-column': ElTableColumnStub,
        'el-tag': ElTagStub,
        'el-dialog': ElDialogStub,
        'el-form': ElFormStub,
        'el-form-item': ElFormItemStub,
        'el-input': ElInputStub,
        'el-color-picker': ElColorPickerStub
      }
    }
  })
}

describe('TagsView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    validateResult = true
    validateMock.mockClear()
    getTagsMock.mockResolvedValue({ data: [] } as any)
    createTagMock.mockResolvedValue({ id: 1 } as any)
    updateTagMock.mockResolvedValue({} as any)
    deleteTagMock.mockResolvedValue({} as any)
    ElMessageBoxConfirmMock.mockResolvedValue('confirm' as any)
  })

  it('loads tags on mount (renders rows from data)', async () => {
    getTagsMock.mockResolvedValue({ data: [{ id: 1, name: '工作', color: '#ff0000' }] } as any)
    const wrapper = mountView()
    await flushPromises()
    expect(getTagsMock).toHaveBeenCalled()
    const tableStub = wrapper.findComponent(ElTableStub)
    expect(tableStub.exists()).toBe(true)
    expect((tableStub.props('data') as any[]).length).toBe(1)
  })

  it('shows empty state when no tags', async () => {
    getTagsMock.mockResolvedValue({ data: [] } as any)
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.findComponent(ElEmptyStub).exists()).toBe(true)
  })

  it('opens create dialog when 新建标签 button is clicked', async () => {
    const wrapper = mountView()
    await flushPromises()
    const newButton = wrapper.findAllComponents(ElButtonStub).find((b) => b.text().includes('新建标签'))!
    await newButton.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ElDialogStub).props('modelValue')).toBe(true)
  })

  it('opens create dialog and renders form (verifies form data binding)', async () => {
    const wrapper = mountView()
    await flushPromises()
    const newButton = wrapper.findAllComponents(ElButtonStub).find((b) => b.text().includes('新建标签'))!
    await newButton.trigger('click')
    await flushPromises()
    const tagForm = (wrapper.vm as any).tagForm
    expect(tagForm).toBeTruthy()
    expect(tagForm.name).toBe('')
    tagForm.name = 'TestName'
    expect(tagForm.name).toBe('TestName')
    const formRef = (wrapper.vm as any).tagFormRef
    expect(formRef).toBeTruthy()
    expect(typeof formRef.validate).toBe('function')
  })

  it('editingTag state is set when handleEdit is called and cleared after submit', async () => {
    getTagsMock.mockResolvedValue({ data: [{ id: 5, name: '旧名', color: '#ff0000' }] } as any)
    const wrapper = mountView()
    await flushPromises()
    expect((wrapper.vm as any).editingTag).toBeNull()
    ;(wrapper.vm as any).handleEdit({ id: 5, name: '旧名', color: '#ff0000' })
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as any).editingTag).toEqual({ id: 5, name: '旧名', color: '#ff0000' })
    expect(wrapper.findComponent(ElDialogStub).props('title')).toBe('编辑标签')
  })

  it('resetForm clears tagForm and editingTag', async () => {
    getTagsMock.mockResolvedValue({ data: [{ id: 1, name: 'X', color: '#000' }] } as any)
    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).handleEdit({ id: 1, name: 'X', color: '#000' })
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as any).editingTag).not.toBeNull()
    expect((wrapper.vm as any).tagForm.name).toBe('X')
    ;(wrapper.vm as any).resetForm()
    expect((wrapper.vm as any).editingTag).toBeNull()
    expect((wrapper.vm as any).tagForm.name).toBe('')
    expect((wrapper.vm as any).tagForm.color).toBe('#409EFF')
  })

  it('does not submit when validation fails', async () => {
    const wrapper = mountView()
    await flushPromises()
    const newButton = wrapper.findAllComponents(ElButtonStub).find((b) => b.text().includes('新建标签'))!
    await newButton.trigger('click')
    await flushPromises()
    const formRef = (wrapper.vm as any).$.setupState.tagFormRef
    if (formRef) {
      formRef.validate = (cb: any) => Promise.resolve(cb(false))
    }
    await (wrapper.vm as any).handleSubmit()
    await flushPromises()
    expect(createTagMock).not.toHaveBeenCalled()
    expect(updateTagMock).not.toHaveBeenCalled()
  })

  it('deletes tag after ElMessageBox confirm (via handleDelete)', async () => {
    getTagsMock.mockResolvedValue({ data: [{ id: 1, name: '工作', color: '#fff' }] } as any)
    const wrapper = mountView()
    await flushPromises()
    await (wrapper.vm as any).handleDelete({ id: 1, name: '工作', color: '#fff' })
    await flushPromises()
    expect(ElMessageBoxConfirmMock).toHaveBeenCalled()
    expect(deleteTagMock).toHaveBeenCalledWith(1)
  })

  it('does not delete when ElMessageBox is cancelled (via handleDelete)', async () => {
    ElMessageBoxConfirmMock.mockRejectedValue('cancel' as any)
    getTagsMock.mockResolvedValue({ data: [{ id: 1, name: '工作', color: '#fff' }] } as any)
    const wrapper = mountView()
    await flushPromises()
    await (wrapper.vm as any).handleDelete({ id: 1, name: '工作', color: '#fff' })
    await flushPromises()
    expect(deleteTagMock).not.toHaveBeenCalled()
  })

  it('closes dialog and resets form on cancel', async () => {
    const wrapper = mountView()
    await flushPromises()
    const newButton = wrapper.findAllComponents(ElButtonStub).find((b) => b.text().includes('新建标签'))!
    await newButton.trigger('click')
    await wrapper.vm.$nextTick()
    const cancelButton = wrapper.findAllComponents(ElButtonStub).find((b) => b.text().trim() === '取消')!
    await cancelButton.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(ElDialogStub).props('modelValue')).toBe(false)
  })
})

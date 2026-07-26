import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, type PropType } from 'vue'

const setRepeatRuleMock = vi.fn()
const cancelRepeatRuleMock = vi.fn()

vi.mock('../api/repeat', () => ({
  setRepeatRule: (...args: unknown[]) => setRepeatRuleMock(...args),
  cancelRepeatRule: (...args: unknown[]) => cancelRepeatRuleMock(...args),
  generateRepeatTasks: vi.fn(),
}))

vi.mock('@element-plus/icons-vue', () => ({
  Plus: { name: 'PlusStub' },
  Delete: { name: 'DeleteStub' },
}))

import RepeatRuleDialog from './RepeatRuleDialog.vue'

const makeStub = (name: string, render: any, props: string[] = []) =>
  defineComponent({
    name,
    props: props as PropType<string>[],
    emits: ['click', 'update:modelValue'],
    setup(p, { slots, emit }) {
      return () => render({ props: p, slots, emit })
    },
  })

const ElDialogStub = makeStub(
  'ElDialogStub',
  ({ props, slots }) =>
    props.modelValue
      ? h('div', { 'data-testid': 'dialog' }, [
          slots.default?.(),
          slots.footer ? h('div', { 'data-testid': 'dialog-footer' }, slots.footer()) : null,
        ])
      : null,
  ['modelValue', 'title', 'width'],
)

const ElFormStub = makeStub('ElFormStub', ({ slots }) => h('form', slots.default?.()))

const ElFormItemStub = makeStub(
  'ElFormItemStub',
  ({ slots }) => h('div', { class: 'el-form-item' }, slots.default?.()),
  ['label'],
)

const ElSelectStub = makeStub(
  'ElSelectStub',
  ({ props, slots, emit }) =>
    h(
      'select',
      {
        value: props.modelValue,
        onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLSelectElement).value),
      },
      slots.default?.(),
    ),
  ['modelValue', 'placeholder'],
)

const ElOptionStub = makeStub(
  'ElOptionStub',
  ({ props }) => h('option', { value: props.value }, props.label),
  ['value', 'label'],
)

const ElInputNumberStub = makeStub(
  'ElInputNumberStub',
  ({ props, emit }) =>
    h('input', {
      type: 'number',
      value: props.modelValue,
      onInput: (e: Event) =>
        emit('update:modelValue', Number((e.target as HTMLInputElement).value)),
    }),
  ['modelValue', 'min', 'max'],
)

const ElRadioGroupStub = makeStub(
  'ElRadioGroupStub',
  ({ props, slots, emit }) => {
    const children = slots.default?.() || []
    const renderWithForward = () =>
      children.map((child: any) => {
        if (child && child.type && child.type.name === 'ElRadioStub') {
          return h(child.type, {
            ...child.props,
            modelValue: props.modelValue,
            'onUpdate:modelValue': (v: unknown) => emit('update:modelValue', v),
          })
        }
        return child
      })
    return h('div', renderWithForward())
  },
  ['modelValue'],
)

const ElRadioStub = makeStub(
  'ElRadioStub',
  ({ props, emit }) =>
    h('label', [
      h('input', {
        type: 'radio',
        checked: props.modelValue === props.label,
        onChange: () => emit('update:modelValue', props.label),
      }),
      props.label,
    ]),
  ['label', 'modelValue'],
)

const ElDatePickerStub = makeStub(
  'ElDatePickerStub',
  ({ props, emit }) =>
    h('input', {
      type: 'date',
      value: props.modelValue,
      onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).valueAsDate),
    }),
  ['modelValue', 'type', 'placeholder'],
)

const ElAlertStub = makeStub(
  'ElAlertStub',
  ({ slots }) => h('div', { class: 'el-alert' }, slots.default?.()),
  ['title', 'type', 'closable', 'showIcon'],
)

const ElButtonStub = makeStub(
  'ElButtonStub',
  ({ props, slots, emit }) =>
    h('button', { disabled: props.loading, onClick: () => emit('click') }, slots.default?.()),
  ['type', 'loading', 'size'],
)

function mountDialog(
  props: { modelValue: boolean; taskId: number | null } = { modelValue: true, taskId: 1 },
) {
  return mount(RepeatRuleDialog, {
    props,
    global: {
      stubs: {
        'el-dialog': ElDialogStub,
        'el-form': ElFormStub,
        'el-form-item': ElFormItemStub,
        'el-select': ElSelectStub,
        'el-option': ElOptionStub,
        'el-input-number': ElInputNumberStub,
        'el-radio-group': ElRadioGroupStub,
        'el-radio': ElRadioStub,
        'el-date-picker': ElDatePickerStub,
        'el-alert': ElAlertStub,
        'el-button': ElButtonStub,
      },
    },
  })
}

describe('RepeatRuleDialog.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRepeatRuleMock.mockResolvedValue({} as any)
  })

  it('emits update:modelValue=false when dialog closes', async () => {
    const wrapper = mountDialog({ modelValue: true, taskId: 1 })
    await flushPromises()
    const cancelButton = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('取消'))
    expect(cancelButton).toBeTruthy()
    await cancelButton!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(false)
  })

  it('handleSubmit calls setRepeatRule with taskId and default DAILY/interval=1', async () => {
    const wrapper = mountDialog({ modelValue: true, taskId: 5 })
    await flushPromises()
    const buttons = wrapper.findAllComponents(ElButtonStub)
    const submitBtn = buttons.find((b) => b.text().includes('确定'))!
    await submitBtn.trigger('click')
    await flushPromises()
    expect(setRepeatRuleMock).toHaveBeenCalledWith(5, {
      type: 'DAILY',
      interval: 1,
    })
  })

  it('emits success after successful submit', async () => {
    const wrapper = mountDialog({ modelValue: true, taskId: 5 })
    await flushPromises()
    const submitBtn = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('确定'))!
    await submitBtn.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(false)
  })

  it('handleSubmit includes count when endType is "count"', async () => {
    const wrapper = mountDialog({ modelValue: true, taskId: 5 })
    await flushPromises()
    const radios = wrapper.findAllComponents(ElRadioStub)
    const countRadio = radios.find((r) => r.props('label') === 'count')!
    await countRadio.vm.$emit('update:modelValue', 'count')
    await wrapper.vm.$nextTick()
    const submitBtn = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('确定'))!
    await submitBtn.trigger('click')
    await flushPromises()
    const call = setRepeatRuleMock.mock.calls[0]
    expect(call[0]).toBe(5)
    expect(call[1]).toMatchObject({ type: 'DAILY', interval: 1, count: 10 })
  })

  it('handleSubmit does nothing when taskId is null', async () => {
    const wrapper = mountDialog({ modelValue: true, taskId: null })
    await flushPromises()
    const submitBtn = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('确定'))!
    await submitBtn.trigger('click')
    await flushPromises()
    expect(setRepeatRuleMock).not.toHaveBeenCalled()
  })

  it('handles API error gracefully (does not emit success)', async () => {
    setRepeatRuleMock.mockRejectedValue(new Error('network'))
    const wrapper = mountDialog({ modelValue: true, taskId: 5 })
    await flushPromises()
    const submitBtn = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('确定'))!
    await submitBtn.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('success')).toBeFalsy()
  })

  it('resets form when closed (handleClose emits update:modelValue=false)', async () => {
    const wrapper = mountDialog({ modelValue: true, taskId: 1 })
    await flushPromises()
    const radios = wrapper.findAllComponents(ElRadioStub)
    const countRadio = radios.find((r) => r.props('label') === 'count')!
    await countRadio.vm.$emit('update:modelValue', 'count')
    await wrapper.vm.$nextTick()
    const cancelBtn = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('取消'))!
    await cancelBtn.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(false)
    expect(wrapper.findComponent(ElDialogStub).props('modelValue')).toBe(false)
  })
})

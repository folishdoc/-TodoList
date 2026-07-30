import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ElMessage } from 'element-plus'

const parseTaskMock = vi.fn()
vi.mock('../api/ai', () => ({
  parseTask: (...args: unknown[]) => parseTaskMock(...args),
}))

import AiTaskInput from './AiTaskInput.vue'

/** Element Plus 组件 Stubs（参考 TaskEditPanel.test.ts 风格） */
const ElDialogStub = {
  name: 'ElDialogStub',
  template: '<div v-if="modelValue" class="el-dialog"><slot/></div>',
  props: ['modelValue', 'title', 'width', 'closeOnClickModal', 'destroyOnClose'],
}

const ElInputStub = {
  name: 'ElInputStub',
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder', 'type', 'rows'],
}

const ElButtonStub = {
  name: 'ElButtonStub',
  template: '<button type="button" class="el-button" :class="type ? \'el-button--\' + type : \'\'" @click="$emit(\'click\')"><slot/></button>',
  props: ['type', 'loading', 'disabled'],
}

const ElIconStub = {
  name: 'ElIconStub',
  template: '<i class="el-icon"><slot/></i>',
}

const ElTagStub = {
  name: 'ElTagStub',
  template: '<span class="el-tag" :data-type="type"><slot/></span>',
  props: ['type', 'size', 'color'],
}

describe('AiTaskInput.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createWrapper() {
    return mount(AiTaskInput, {
      global: {
        stubs: {
          'el-dialog': ElDialogStub,
          'el-input': ElInputStub,
          'el-button': ElButtonStub,
          'el-icon': ElIconStub,
          'el-tag': ElTagStub,
        },
      },
    })
  }

  it('renders dialog with input step when opened', async () => {
    const wrapper = createWrapper()
    wrapper.vm.open()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.ai-input-hint').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('.ai-input-actions').exists()).toBe(true)
  })

  it('shows parsing step while loading', async () => {
    parseTaskMock.mockImplementation(() => new Promise(() => {})) // never resolves
    const wrapper = createWrapper()
    wrapper.vm.open()
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input')
    await input.setValue('明天下午3点开会')

    // 点击"解析"按钮（第二个 button：取消, 解析）
    const buttons = wrapper.findAll('button')
    await buttons[buttons.length - 1].trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.parsing-animation').exists()).toBe(true)
    expect(wrapper.find('.parsing-icon').exists()).toBe(true)
  })

  it('shows preview step after successful parse', async () => {
    const mockResult = {
      title: '开会讨论Q3规划',
      description: '讨论下半年规划',
      priority: 3,
      dueDate: '2026-07-31 15:00',
      startDate: '',
      listName: '工作',
      tags: ['会议', '规划'],
    }
    parseTaskMock.mockResolvedValue(mockResult as any)

    const wrapper = createWrapper()
    wrapper.vm.open()
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input')
    await input.setValue('明天下午3点开会讨论Q3规划，高优先级')

    // 点击"解析"按钮
    const buttons = wrapper.findAll('button')
    await buttons[buttons.length - 1].trigger('click')
    await flushPromises()

    expect(wrapper.find('.preview-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('开会讨论Q3规划')
    expect(wrapper.text()).toContain('高')
    expect(wrapper.text()).toContain('2026-07-31 15:00')
    expect(wrapper.text()).toContain('工作')
    expect(wrapper.text()).toContain('会议')
    expect(wrapper.text()).toContain('规划')
  })

  it('shows repeat rule in preview when parsed', async () => {
    parseTaskMock.mockResolvedValue({
      title: '喝水',
      description: '',
      priority: 2,
      dueDate: '2026-08-01 09:00',
      startDate: '',
      listName: '',
      tags: [],
      repeatRule: { type: 'DAILY', interval: 1 },
    } as any)

    const wrapper = createWrapper()
    wrapper.vm.open()
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input')
    await input.setValue('每天喝水')

    const buttons = wrapper.findAll('button')
    await buttons[buttons.length - 1].trigger('click')
    await flushPromises()

    expect(wrapper.find('.preview-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('每天')
  })

  it('emits confirm with parsed data on confirmation', async () => {
    const mockResult = {
      title: '测试任务',
      description: '',
      priority: 2,
      dueDate: '2026-08-01 10:00',
      startDate: '',
      listName: '',
      tags: [],
    }
    parseTaskMock.mockResolvedValue(mockResult as any)

    const wrapper = createWrapper()
    wrapper.vm.open()
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input')
    await input.setValue('测试任务，中优先级')

    // 点击"解析"按钮 → 进入预览
    const buttons1 = wrapper.findAll('button')
    await buttons1[buttons1.length - 1].trigger('click')
    await flushPromises()

    // 预览步骤中有 "重新输入" 和 "确认并填充" 两个按钮，点最后一个
    const buttons2 = wrapper.findAll('button')
    await buttons2[buttons2.length - 1].trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')![0]).toEqual([mockResult])
  })

  it('shows error and goes back to input on parse failure', async () => {
    parseTaskMock.mockRejectedValue(new Error('AI 服务暂不可用'))
    const errorSpy = vi.spyOn(ElMessage, 'error')

    const wrapper = createWrapper()
    wrapper.vm.open()
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input')
    await input.setValue('test')

    // 点击"解析"按钮
    const buttons = wrapper.findAll('button')
    await buttons[buttons.length - 1].trigger('click')
    await flushPromises()

    expect(errorSpy).toHaveBeenCalled()
    expect(wrapper.find('.ai-input-hint').exists()).toBe(true) // back to input step
  })
})

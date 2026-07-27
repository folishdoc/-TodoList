import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { ElMessage } from 'element-plus'

const { mockLogin, mockRegister, mockPush } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockRegister: vi.fn(),
  mockPush: vi.fn(),
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    login: mockLogin,
    register: mockRegister,
    token: null,
    isAuthenticated: false,
  })),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ── Element Plus stubs ──
const ElInputStub = defineComponent({
  name: 'ElInput',
  props: ['modelValue', 'type', 'disabled', 'placeholder', 'size'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        'data-testid': 'el-input',
        type: props.type || 'text',
        value: props.modelValue,
        disabled: props.disabled,
        placeholder: props.placeholder,
        onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
      })
  },
})

const ElButtonStub = defineComponent({
  name: 'ElButton',
  props: ['type', 'size', 'loading', 'disabled', 'text'],
  setup(props, { slots }) {
    return () =>
      h(
        'button',
        {
          'data-testid': 'el-button',
          disabled: props.disabled || props.loading,
        },
        slots.default?.(),
      )
  },
})

const ElFormStub = defineComponent({
  name: 'ElForm',
  setup(_, { slots }) {
    return () => h('form', { 'data-testid': 'el-form' }, slots.default?.())
  },
})

const ElFormItemStub = defineComponent({
  name: 'ElFormItem',
  props: ['label'],
  setup(_, { slots }) {
    return () => h('div', { 'data-testid': 'el-form-item' }, slots.default?.())
  },
})

const ElDividerStub = defineComponent({
  name: 'ElDivider',
  setup(_, { slots }) {
    return () => h('div', { 'data-testid': 'el-divider' }, slots.default?.())
  },
})

const stubs = {
  'el-input': ElInputStub,
  'el-button': ElButtonStub,
  'el-form': ElFormStub,
  'el-form-item': ElFormItemStub,
  'el-divider': ElDividerStub,
}

import Login from './Login.vue'

// Helper: find all input elements by type
function findInputs(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('[data-testid="el-input"]')
}

// Helper: find submit button (the primary one in the form)
function findSubmitButton(wrapper: ReturnType<typeof mount>) {
  const buttons = wrapper.findAll('[data-testid="el-button"]')
  return buttons.find((b) => b.text() === '登录' || b.text() === '注册')!
}

describe('views/Login.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  // ── Rendering ──
  it('renders the login form by default', () => {
    const wrapper = mount(Login, { global: { stubs } })
    expect(wrapper.find('.login-title').text()).toContain('Todolist')
    const inputs = findInputs(wrapper)
    // username + password (confirmPassword and displayName hidden in login mode)
    expect(inputs.length).toBe(2)
    expect(findSubmitButton(wrapper).text()).toContain('登录')
    expect(wrapper.text()).toContain('没有账号？去注册')
  })

  // ── Login validation ──
  it('shows error when username is empty', async () => {
    const wrapper = mount(Login, { global: { stubs } })
    await findSubmitButton(wrapper).trigger('click')
    expect(wrapper.find('.error-message').text()).toBe('请输入用户名')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('shows error when password is empty', async () => {
    const wrapper = mount(Login, { global: { stubs } })
    const inputs = findInputs(wrapper)
    await inputs[0].setValue('testuser') // username
    await findSubmitButton(wrapper).trigger('click')
    expect(wrapper.find('.error-message').text()).toBe('请输入密码')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('calls login and navigates on success', async () => {
    mockLogin.mockResolvedValue(undefined)
    const wrapper = mount(Login, { global: { stubs } })
    const inputs = findInputs(wrapper)
    await inputs[0].setValue('testuser') // username
    await inputs[1].setValue('password123') // password
    await findSubmitButton(wrapper).trigger('click')

    expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
    await flushPromises()
    expect(mockPush).toHaveBeenCalledWith('/')
    expect(ElMessage.success).toHaveBeenCalledWith('登录成功')
  })

  it('displays error message on login failure', async () => {
    mockLogin.mockRejectedValue({ message: '用户名或密码错误' })
    const wrapper = mount(Login, { global: { stubs } })
    const inputs = findInputs(wrapper)
    await inputs[0].setValue('testuser')
    await inputs[1].setValue('wrong')
    await findSubmitButton(wrapper).trigger('click')

    expect(mockLogin).toHaveBeenCalled()
    await flushPromises()
    expect(wrapper.find('.error-message').text()).toBe('用户名或密码错误')
  })

  // ── Register mode ──
  it('switches to register mode', async () => {
    const wrapper = mount(Login, { global: { stubs } })
    // Click "没有账号？去注册"
    const switchBtn = wrapper.findAll('button').find((b) => b.text().includes('去注册'))!
    await switchBtn.trigger('click')

    expect(wrapper.text()).toContain('已有账号？去登录')
    expect(findSubmitButton(wrapper).text()).toContain('注册')
    // confirm password + display name inputs appear
    expect(findInputs(wrapper).length).toBe(4)
  })

  it('validates password match in register mode', async () => {
    const wrapper = mount(Login, { global: { stubs } })
    // Switch to register
    await wrapper.findAll('button').find((b) => b.text().includes('去注册'))!.trigger('click')

    const inputs = findInputs(wrapper)
    await inputs[0].setValue('newuser') // username
    await inputs[1].setValue('password123') // password
    await inputs[2].setValue('different') // confirm password - mismatch
    await findSubmitButton(wrapper).trigger('click')

    expect(wrapper.find('.error-message').text()).toBe('两次输入的密码不一致')
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('validates minimum password length in register mode', async () => {
    const wrapper = mount(Login, { global: { stubs } })
    await wrapper.findAll('button').find((b) => b.text().includes('去注册'))!.trigger('click')

    const inputs = findInputs(wrapper)
    await inputs[0].setValue('newuser')
    await inputs[1].setValue('12345')
    await inputs[2].setValue('12345')
    await findSubmitButton(wrapper).trigger('click')

    expect(wrapper.find('.error-message').text()).toBe('密码长度不能少于 6 位')
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('calls register and navigates on success', async () => {
    mockRegister.mockResolvedValue(undefined)
    const wrapper = mount(Login, { global: { stubs } })
    await wrapper.findAll('button').find((b) => b.text().includes('去注册'))!.trigger('click')

    const inputs = findInputs(wrapper)
    await inputs[0].setValue('newuser')
    await inputs[1].setValue('password123')
    await inputs[2].setValue('password123')
    await inputs[3].setValue('New User') // displayName
    await findSubmitButton(wrapper).trigger('click')

    expect(mockRegister).toHaveBeenCalledWith('newuser', 'password123', 'New User')
    await flushPromises()
    expect(mockPush).toHaveBeenCalledWith('/')
    expect(ElMessage.success).toHaveBeenCalledWith('注册成功')
  })

})

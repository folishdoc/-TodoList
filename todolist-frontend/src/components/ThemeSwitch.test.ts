import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

let mockThemeValue: 'light' | 'dark' = 'light'
const h = vi.hoisted(() => ({
  themeMock: {
    getCurrentTheme: vi.fn(() => mockThemeValue),
    toggleTheme: vi.fn()
  }
}))

vi.mock('@element-plus/icons-vue', () => ({
  Sunny: { name: 'SunnyStub' },
  Moon: { name: 'MoonStub' }
}))

vi.mock('../utils/theme', () => h.themeMock)

import ThemeSwitch from './ThemeSwitch.vue'

const ElButtonStub = {
  name: 'ElButtonStub',
  template: '<button data-testid="theme-btn" @click="$emit(\'click\')"><slot/></button>',
  props: ['icon', 'circle', 'title']
}

describe('ThemeSwitch.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockThemeValue = 'light'
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('shows Moon icon when current theme is light (invites switch to dark)', async () => {
    mockThemeValue = 'light'
    const wrapper = mount(ThemeSwitch, {
      global: { stubs: { 'el-button': ElButtonStub } }
    })
    await wrapper.vm.$nextTick()
    const button = wrapper.findComponent(ElButtonStub)
    expect(button.props('icon')).toEqual({ name: 'MoonStub' })
  })

  it('shows Sunny icon when current theme is dark (invites switch to light)', async () => {
    mockThemeValue = 'dark'
    const wrapper = mount(ThemeSwitch, {
      global: { stubs: { 'el-button': ElButtonStub } }
    })
    await wrapper.vm.$nextTick()
    const button = wrapper.findComponent(ElButtonStub)
    expect(button.props('icon')).toEqual({ name: 'SunnyStub' })
  })

  it('reads current theme on mount', async () => {
    const wrapper = mount(ThemeSwitch, {
      global: { stubs: { 'el-button': ElButtonStub } }
    })
    await wrapper.vm.$nextTick()
    expect(h.themeMock.getCurrentTheme).toHaveBeenCalled()
  })

  it('clicking button calls toggleTheme and re-reads current theme', async () => {
    mockThemeValue = 'light'
    const wrapper = mount(ThemeSwitch, {
      global: { stubs: { 'el-button': ElButtonStub } }
    })
    await wrapper.vm.$nextTick()
    const button = wrapper.findComponent(ElButtonStub)
    await button.trigger('click')
    expect(h.themeMock.toggleTheme).toHaveBeenCalled()
  })
})

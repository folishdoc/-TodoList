import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const mockMinimize = vi.fn()
const mockToggleMaximize = vi.fn()
const mockClose = vi.fn()
const mockIsMaximized = vi.fn()
const mockOnResizedUnlisten = vi.fn()
const mockOnResized = vi.fn().mockResolvedValue(mockOnResizedUnlisten)

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    minimize: mockMinimize,
    toggleMaximize: mockToggleMaximize,
    close: mockClose,
    isMaximized: mockIsMaximized,
    onResized: mockOnResized,
  }),
}))

import TitleBar from './TitleBar.vue'

describe('TitleBar.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as any).__TAURI_INTERNALS__
    document.documentElement.style.removeProperty('--titlebar-height')
  })

  describe('when not in Tauri environment', () => {
    it('does not render the titlebar', () => {
      const wrapper = mount(TitleBar)
      expect(wrapper.find('.titlebar').exists()).toBe(false)
    })

    it('sets --titlebar-height to 0px', () => {
      mount(TitleBar)
      expect(document.documentElement.style.getPropertyValue('--titlebar-height')).toBe('0px')
    })

    it('mounts without errors', () => {
      expect(() => mount(TitleBar)).not.toThrow()
    })
  })

  describe('when in Tauri environment', () => {
    beforeEach(() => {
      ;(window as any).__TAURI_INTERNALS__ = true
      mockIsMaximized.mockResolvedValue(false)
    })

    it('renders the titlebar', async () => {
      const wrapper = mount(TitleBar)
      await flushPromises()
      expect(wrapper.find('.titlebar').exists()).toBe(true)
    })

    it('displays the app title', async () => {
      const wrapper = mount(TitleBar)
      await flushPromises()
      expect(wrapper.text()).toContain('Todolist')
    })

    it('sets --titlebar-height to 32px', async () => {
      mount(TitleBar)
      await flushPromises()
      expect(document.documentElement.style.getPropertyValue('--titlebar-height')).toBe('32px')
    })

    it('renders three control buttons', async () => {
      const wrapper = mount(TitleBar)
      await flushPromises()
      const buttons = wrapper.findAll('.ctrl-btn')
      expect(buttons).toHaveLength(3)
    })

    it('renders minimize, maximize/restore, and close buttons', async () => {
      const wrapper = mount(TitleBar)
      await flushPromises()
      const buttons = wrapper.findAll('.ctrl-btn')
      expect(buttons[0].attributes('title')).toBe('最小化')
      expect(buttons[1].attributes('title')).toBe('最大化')
      expect(buttons[2].attributes('title')).toBe('关闭')
    })

    it('shows "还原" when isMaximized is true', async () => {
      mockIsMaximized.mockResolvedValue(true)
      const wrapper = mount(TitleBar)
      await flushPromises()
      const buttons = wrapper.findAll('.ctrl-btn')
      expect(buttons[1].attributes('title')).toBe('还原')
    })

    it('shows "最大化" when isMaximized is false', async () => {
      mockIsMaximized.mockResolvedValue(false)
      const wrapper = mount(TitleBar)
      await flushPromises()
      const buttons = wrapper.findAll('.ctrl-btn')
      expect(buttons[1].attributes('title')).toBe('最大化')
    })

    it('minimize button calls appWindow.minimize', async () => {
      const wrapper = mount(TitleBar)
      await flushPromises()
      const buttons = wrapper.findAll('.ctrl-btn')
      await buttons[0].trigger('click')
      expect(mockMinimize).toHaveBeenCalled()
    })

    it('maximize button calls appWindow.toggleMaximize', async () => {
      const wrapper = mount(TitleBar)
      await flushPromises()
      const buttons = wrapper.findAll('.ctrl-btn')
      await buttons[1].trigger('click')
      expect(mockToggleMaximize).toHaveBeenCalled()
    })

    it('close button calls appWindow.close', async () => {
      const wrapper = mount(TitleBar)
      await flushPromises()
      const buttons = wrapper.findAll('.ctrl-btn')
      await buttons[2].trigger('click')
      expect(mockClose).toHaveBeenCalled()
    })

    it('calls appWindow.isMaximized on mount', async () => {
      mount(TitleBar)
      await flushPromises()
      expect(mockIsMaximized).toHaveBeenCalled()
    })

    it('registers onResized listener on mount', async () => {
      mount(TitleBar)
      await flushPromises()
      expect(mockOnResized).toHaveBeenCalled()
    })

    it('unregisters onResized listener on unmount', async () => {
      const wrapper = mount(TitleBar)
      await flushPromises()
      expect(mockOnResizedUnlisten).not.toHaveBeenCalled()
      wrapper.unmount()
      expect(mockOnResizedUnlisten).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('mounts without error even when Tauri APIs are mocked', async () => {
      const wrapper = mount(TitleBar)
      await flushPromises()
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('close button has close-btn class for styling', async () => {
      ;(window as any).__TAURI_INTERNALS__ = true
      const wrapper = mount(TitleBar)
      await flushPromises()
      const buttons = wrapper.findAll('.ctrl-btn')
      expect(buttons[2].classes()).toContain('close-btn')
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import {
  registerShortcut,
  unregisterShortcut,
  useKeyboardShortcuts,
  CommonShortcuts
} from './keyboard'

function dispatchKey(key: string, target: EventTarget = document.body) {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  Object.defineProperty(ev, 'target', { value: target })
  window.dispatchEvent(ev)
  return ev
}

const Host = defineComponent({
  setup() {
    useKeyboardShortcuts()
    return () => null
  }
})

describe('utils/keyboard.ts', () => {
  let wrapper: ReturnType<typeof mount> | null = null

  beforeEach(() => {
    Object.values(CommonShortcuts).forEach((k) => unregisterShortcut(k))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    Object.values(CommonShortcuts).forEach((k) => unregisterShortcut(k))
  })

  it('registerShortcut + keydown triggers handler', () => {
    wrapper = mount(Host)
    const handler = vi.fn()
    registerShortcut('k', handler)
    const ev = dispatchKey('k')
    expect(handler).toHaveBeenCalledWith(ev)
  })

  it('unregisterShortcut removes handler', () => {
    wrapper = mount(Host)
    const handler = vi.fn()
    registerShortcut('k', handler)
    unregisterShortcut('k')
    dispatchKey('k')
    expect(handler).not.toHaveBeenCalled()
  })

  it('is case-insensitive: uppercase K normalizes to k', () => {
    wrapper = mount(Host)
    const handler = vi.fn()
    registerShortcut('K', handler)
    dispatchKey('k')
    expect(handler).toHaveBeenCalled()
  })

  it('ignores keydown on input fields', () => {
    wrapper = mount(Host)
    const handler = vi.fn()
    registerShortcut('k', handler)
    const input = document.createElement('input')
    dispatchKey('k', input)
    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores keydown on textarea fields', () => {
    wrapper = mount(Host)
    const handler = vi.fn()
    registerShortcut('k', handler)
    const ta = document.createElement('textarea')
    dispatchKey('k', ta)
    expect(handler).not.toHaveBeenCalled()
  })

  it('unregistered keys do not throw', () => {
    wrapper = mount(Host)
    expect(() => dispatchKey('z')).not.toThrow()
  })

  it('useKeyboardShortcuts adds listener on mount and removes on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const w = mount(Host)
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    w.unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('CommonShortcuts exports expected keys', () => {
    expect(CommonShortcuts.NEW_TASK).toBe('n')
    expect(CommonShortcuts.SEARCH).toBe('/')
    expect(CommonShortcuts.COMPLETE).toBe('c')
    expect(CommonShortcuts.DELETE).toBe('d')
    expect(CommonShortcuts.EDIT).toBe('e')
    expect(CommonShortcuts.REFRESH).toBe('r')
    expect(CommonShortcuts.THEME).toBe('t')
  })
})

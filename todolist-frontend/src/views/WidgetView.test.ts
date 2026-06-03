import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<any>('element-plus')
  return {
    ...actual,
    ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
    ElMessageBox: { confirm: vi.fn().mockResolvedValue('confirm') },
  }
})

const setOpacityMock = vi.fn().mockResolvedValue(undefined)
const hideMock = vi.fn().mockResolvedValue(undefined)
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    setOpacity: setOpacityMock,
    hide: hideMock,
  }),
}))

vi.mock('../api/task', () => ({
  getTasks: vi.fn().mockResolvedValue({ data: { content: [] }, code: 200, message: 'success' }),
  getTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  createTask: vi.fn().mockResolvedValue({ data: { id: 1 }, code: 200, message: 'success' }),
  updateTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  deleteTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  completeTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  uncompleteTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  postponeTask: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  updateTaskTime: vi.fn().mockResolvedValue({ data: null, code: 200, message: 'success' }),
  getSubtasks: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  getTodayTasks: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  getUpcomingTasks: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  searchTasks: vi.fn().mockResolvedValue({ data: { content: [] }, code: 200, message: 'success' }),
}))
vi.mock('../api/list', () => ({
  getLists: vi.fn().mockResolvedValue({ data: [], code: 200, message: 'success' }),
  createList: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  updateList: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  deleteList: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
}))

const stubElDialog = defineComponent({
  name: 'ElDialog',
  props: ['modelValue'],
  setup(_props, { slots }) {
    return () => _props.modelValue
      ? h('div', { 'data-testid': 'el-dialog' }, [slots.default?.(), slots.footer ? h('div', { 'data-testid': 'dialog-footer' }, slots.footer()) : null])
      : null
  },
})

const stubTaskEditPanel = defineComponent({
  name: 'TaskEditPanel',
  props: ['task', 'taskForm', 'taskLists', 'allTags', 'mode', 'visible'],
  emits: ['update:task', 'update:taskForm', 'save', 'close', 'delete'],
  setup(_props, { emit }) {
    return () => h('div', { 'data-testid': 'task-edit-panel' }, [
      h('button', { 'data-testid': 'panel-close', onClick: () => emit('close') }, '关闭'),
    ])
  },
})

const stubs = {
  'el-dialog': stubElDialog,
  TaskEditPanel: stubTaskEditPanel,
}

const setTauriEnv = (enabled: boolean) => {
  if (enabled) {
    ;(window as any).__TAURI_INTERNALS__ = {}
  } else {
    delete (window as any).__TAURI_INTERNALS__
  }
}

const clearStorage = () => {
  localStorage.clear()
  document.documentElement.classList.remove('widget-light')
  document.documentElement.style.opacity = ''
}

const setupStorage = (data: any) => {
  localStorage.setItem('todolist-widget-settings', JSON.stringify(data))
}

let activeWrapper: any = null
const trackWrapper = (w: any) => { activeWrapper = w; return w }

async function mountWidget(opts: { withTauri?: boolean; initialStorage?: any; corruptStorage?: boolean } = {}) {
  setTauriEnv(!!opts.withTauri)
  clearStorage()
  if (opts.corruptStorage) {
    localStorage.setItem('todolist-widget-settings', '{not valid json')
  } else if (opts.initialStorage) {
    setupStorage(opts.initialStorage)
  }
  setOpacityMock.mockClear()
  hideMock.mockClear()
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const WidgetView = (await import('./WidgetView.vue')).default
  const wrapper = mount(WidgetView, {
    global: { stubs },
    attachTo: document.body,
  })
  trackWrapper(wrapper)
  await flushPromises()
  await nextTick()
  return { wrapper, warnSpy, errorSpy }
}

describe('WidgetView.vue - 设置面板修复', () => {
  afterEach(() => {
    if (activeWrapper) {
      try { activeWrapper.unmount() } catch {}
      activeWrapper = null
    }
    document.body.innerHTML = ''
    document.documentElement.classList.remove('widget-light')
    document.documentElement.style.opacity = ''
  })

  describe('Bug 1: opacity 应调用 Tauri setOpacity 而非 CSS opacity', () => {
    it('Tauri 环境下 opacity 变化调用 setOpacity(正确比例)', async () => {
      const { wrapper } = await mountWidget({ withTauri: true })
      const setupState = (wrapper.vm as any).$.setupState

      setupState.settings.opacity = 50
      await nextTick()
      await flushPromises()

      expect(setOpacityMock).toHaveBeenCalledWith(0.5)
    })

    it('非 Tauri 环境下 opacity 变化不调用 setOpacity、不污染 documentElement.style.opacity', async () => {
      const { wrapper } = await mountWidget({ withTauri: false })
      const setupState = (wrapper.vm as any).$.setupState

      setupState.settings.opacity = 60
      await nextTick()
      await flushPromises()

      expect(setOpacityMock).not.toHaveBeenCalled()
      expect(document.documentElement.style.opacity).toBe('')
    })

    it('挂载时使用 localStorage 中的 opacity 调用 setOpacity', async () => {
      await mountWidget({ withTauri: true, initialStorage: { theme: 'dark', opacity: 70 } })
      await nextTick()
      await flushPromises()

      expect(setOpacityMock).toHaveBeenCalledWith(0.7)
    })

    it('setOpacity 抛错时 console.warn 被调用且不中断 UI', async () => {
      setOpacityMock.mockRejectedValueOnce(new Error('Tauri 权限不足'))
      const { wrapper, warnSpy } = await mountWidget({ withTauri: true })
      const setupState = (wrapper.vm as any).$.setupState

      setupState.settings.opacity = 80
      await nextTick()
      await flushPromises()

      expect(warnSpy).toHaveBeenCalled()
      const msg = warnSpy.mock.calls.map((c) => String(c[0])).join(' ')
      expect(msg).toMatch(/setOpacity/)
    })
  })

  describe('Bug 2: 顶置开关删除 + 移除 settings.alwaysOnTop 字段', () => {
    it('settings 对象不含 alwaysOnTop 字段', async () => {
      const { wrapper } = await mountWidget()
      const setupState = (wrapper.vm as any).$.setupState

      expect('alwaysOnTop' in setupState.settings).toBe(false)
      expect(Object.keys(setupState.settings).sort()).toEqual(['opacity', 'theme'])
    })

    it('设置面板不包含窗口置顶 toggle', async () => {
      const { wrapper } = await mountWidget()
      const setupState = (wrapper.vm as any).$.setupState

      setupState.showSettings = true
      await nextTick()

      const html = wrapper.html()
      expect(html).not.toContain('窗口置顶')
      expect(wrapper.find('.toggle-switch').exists()).toBe(false)
    })

    it('设置面板保留不透明度滑块并显示当前值', async () => {
      const { wrapper } = await mountWidget()
      const setupState = (wrapper.vm as any).$.setupState

      setupState.showSettings = true
      await nextTick()

      const range = wrapper.find('input[type="range"]')
      expect(range.exists()).toBe(true)
      expect((range.element as HTMLInputElement).value).toBe('100')
      expect(wrapper.html()).toContain('不透明度: 100%')
    })

    it('设置面板提示"小组件窗口始终置顶"', async () => {
      const { wrapper } = await mountWidget()
      const setupState = (wrapper.vm as any).$.setupState

      setupState.showSettings = true
      await nextTick()

      expect(wrapper.find('.settings-hint').exists()).toBe(true)
      expect(wrapper.find('.settings-hint').text()).toContain('始终置顶')
    })
  })

  describe('localStorage 持久化', () => {
    it('调整 opacity 后写入 localStorage', async () => {
      const { wrapper } = await mountWidget()
      const setupState = (wrapper.vm as any).$.setupState

      setupState.settings.opacity = 65
      await nextTick()
      await flushPromises()

      const stored = JSON.parse(localStorage.getItem('todolist-widget-settings') || '{}')
      expect(stored.opacity).toBe(65)
      expect(stored.theme).toBe('dark')
    })

    it('调整 theme 后写入 localStorage', async () => {
      const { wrapper } = await mountWidget()
      const setupState = (wrapper.vm as any).$.setupState

      setupState.settings.theme = 'light'
      await nextTick()
      await flushPromises()

      const stored = JSON.parse(localStorage.getItem('todolist-widget-settings') || '{}')
      expect(stored.theme).toBe('light')
    })

    it('启动时从 localStorage 读取设置（opacity 优先于默认值）', async () => {
      const { wrapper } = await mountWidget({ initialStorage: { theme: 'light', opacity: 45 } })
      const setupState = (wrapper.vm as any).$.setupState

      expect(setupState.settings.opacity).toBe(45)
      expect(setupState.settings.theme).toBe('light')
    })

    it('localStorage 为空时使用默认值', async () => {
      const { wrapper } = await mountWidget()
      const setupState = (wrapper.vm as any).$.setupState

      expect(setupState.settings.opacity).toBe(100)
      expect(setupState.settings.theme).toBe('dark')
    })

    it('localStorage 内容损坏时回退默认值且 console.warn 被调用', async () => {
      const { wrapper, warnSpy } = await mountWidget({ corruptStorage: true })
      const setupState = (wrapper.vm as any).$.setupState

      expect(setupState.settings.opacity).toBe(100)
      expect(setupState.settings.theme).toBe('dark')
      expect(warnSpy).toHaveBeenCalled()
    })

    it('localStorage 中 opacity 越界时 clamp 到 [30,100]', async () => {
      const { wrapper } = await mountWidget({ initialStorage: { theme: 'dark', opacity: 200 } })
      const setupState = (wrapper.vm as any).$.setupState

      expect(setupState.settings.opacity).toBe(100)
    })

    it('localStorage 中 opacity 低于 30 时 clamp 到 30', async () => {
      const { wrapper } = await mountWidget({ initialStorage: { theme: 'dark', opacity: 10 } })
      const setupState = (wrapper.vm as any).$.setupState

      expect(setupState.settings.opacity).toBe(30)
    })

    it('localStorage 中 theme 非法值时回退 dark', async () => {
      const { wrapper } = await mountWidget({ initialStorage: { theme: 'pink', opacity: 80 } })
      const setupState = (wrapper.vm as any).$.setupState

      expect(setupState.settings.theme).toBe('dark')
    })
  })

  describe('主题切换', () => {
    it('theme=dark 不添加 widget-light class', async () => {
      document.documentElement.classList.add('widget-light')
      const { wrapper } = await mountWidget()
      const setupState = (wrapper.vm as any).$.setupState

      setupState.settings.theme = 'dark'
      await nextTick()
      await flushPromises()

      expect(document.documentElement.classList.contains('widget-light')).toBe(false)
    })

    it('theme=light 添加 widget-light class', async () => {
      const { wrapper } = await mountWidget()
      const setupState = (wrapper.vm as any).$.setupState

      setupState.settings.theme = 'light'
      await nextTick()
      await flushPromises()

      expect(document.documentElement.classList.contains('widget-light')).toBe(true)
    })
  })

  describe('生命周期', () => {
    it('onMounted 调用 applySettings（Tauri 环境触发 setOpacity(1)）', async () => {
      await mountWidget({ withTauri: true })
      await nextTick()
      await flushPromises()

      expect(setOpacityMock).toHaveBeenCalledWith(1)
    })

    it('onMounted 调用 applySettings（非 Tauri 环境不触发 setOpacity）', async () => {
      await mountWidget({ withTauri: false })
      await nextTick()
      await flushPromises()

      expect(setOpacityMock).not.toHaveBeenCalled()
    })
  })
})

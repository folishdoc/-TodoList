/**
 * useTaskSync — Tauri 事件同步逻辑
 *
 * 在 Tauri 桌面环境中，跨窗口同步任务变更：
 * 1. 发射 `task-changed` 事件通知其他窗口
 * 2. 监听 `task-changed` 事件和窗口焦点变化，自动刷新任务列表
 *
 * 在纯浏览器环境中不执行任何操作。
 */
import { onMounted, onUnmounted } from 'vue'

/** 检测是否运行在 Tauri 桌面环境 */
function isTauri() {
  return '__TAURI_INTERNALS__' in window
}

export function useTaskSync(onTaskChanged: () => void) {
  let unlistens: Array<() => void> = []

  // ── 方法 ──

  /** 发射 `task-changed` 事件通知其他 Tauri 窗口数据已变更 */
  const emitTaskChanged = async () => {
    if (!isTauri()) return
    try {
      const { emit } = await import('@tauri-apps/api/event')
      await emit('task-changed', null)
    } catch (e) { console.error('Tauri emit failed', e) }
  }

  /** 注册 Tauri 事件监听器（task-changed + 窗口焦点变化），在 onMounted 中调用 */
  const setupListeners = async () => {
    if (!isTauri()) return
    try {
      const { listen } = await import('@tauri-apps/api/event')
      const unlisten = await listen('task-changed', () => onTaskChanged())
      unlistens.push(unlisten)
    } catch (e) { console.error('Tauri listen failed', e) }

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const unlisten = await getCurrentWindow().onFocusChanged((event: any) => {
        if (event.payload) onTaskChanged()
      })
      unlistens.push(unlisten)
    } catch (e) { console.error('Tauri focus listen failed', e) }
  }

  onMounted(() => {
    setupListeners()
  })

  onUnmounted(() => {
    unlistens.forEach((fn) => {
      try {
        fn()
      } catch (e) { console.error('Tauri unlisten failed', e) }
    })
    unlistens = []
  })

  return { emitTaskChanged }
}

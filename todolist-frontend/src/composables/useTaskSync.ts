// 共享 Tauri 事件同步逻辑
import { onMounted, onUnmounted } from 'vue'

const isTauri = !!(window as any).__TAURI_INTERNALS__

export function useTaskSync(onTaskChanged: () => void) {
  let unlistens: Array<() => void> = []

  const emitTaskChanged = async () => {
    if (!isTauri) return
    try {
      const { emit } = await import('@tauri-apps/api/event')
      await emit('task-changed', null)
    } catch {}
  }

  const setupListeners = async () => {
    if (!isTauri) return
    try {
      const { listen } = await import('@tauri-apps/api/event')
      const unlisten = await listen('task-changed', () => onTaskChanged())
      unlistens.push(unlisten)
    } catch {}

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const unlisten = await getCurrentWindow().onFocusChanged((event: any) => {
        if (event.payload) onTaskChanged()
      })
      unlistens.push(unlisten)
    } catch {}
  }

  onMounted(() => {
    setupListeners()
  })

  onUnmounted(() => {
    unlistens.forEach(fn => { try { fn() } catch {} })
    unlistens = []
  })

  return { emitTaskChanged }
}

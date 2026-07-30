/**
 * 页面关闭/隐藏时发送关闭通知
 *
 * 当浏览器标签页关闭或隐藏时，通过 navigator.sendBeacon 通知后端释放资源。
 * 使用 sendBeacon 确保请求在页面卸载后仍能送达。
 *
 * 机制：
 * - beforeunload → 立即发送（页面关闭/刷新）
 * - visibilitychange to hidden → 等 5s 再发（用户切标签但可能回来）
 * - 两者互斥：任一发送后标记已发，另一不再重复
 */
let shutdownSent = false
let visibilityTimer: ReturnType<typeof setTimeout> | null = null
let beforeunloadHandler: ((e: BeforeUnloadEvent) => void) | null = null
let visibilityHandler: (() => void) | null = null

const getBaseUrl = (): string => {
  try {
    return (import.meta as any).env?.VITE_API_BASE_URL || ''
  } catch {
    return ''
  }
}

const sendShutdownRequest = () => {
  if (shutdownSent) return
  shutdownSent = true
  const baseUrl = getBaseUrl()
  const blob = new Blob([JSON.stringify({ action: 'shutdown' })], { type: 'application/json' })
  navigator.sendBeacon(`${baseUrl}/api/system/shutdown`, blob)
}

/** 注册页面关闭/隐藏监听器 */
export const registerShutdownListener = () => {
  beforeunloadHandler = () => {
    if (visibilityTimer) {
      clearTimeout(visibilityTimer)
      visibilityTimer = null
    }
    sendShutdownRequest()
  }
  window.addEventListener('beforeunload', beforeunloadHandler)

  visibilityHandler = () => {
    if (document.visibilityState === 'hidden') {
      if (!shutdownSent) {
        visibilityTimer = setTimeout(() => {
          sendShutdownRequest()
        }, 5000)
      }
    } else if (document.visibilityState === 'visible' && visibilityTimer) {
      clearTimeout(visibilityTimer)
      visibilityTimer = null
    }
  }
  document.addEventListener('visibilitychange', visibilityHandler)
}

/** 取消注册页面关闭/隐藏监听器 */
export const unregisterShutdownListener = () => {
  if (beforeunloadHandler) {
    window.removeEventListener('beforeunload', beforeunloadHandler)
    beforeunloadHandler = null
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
    visibilityHandler = null
  }
  if (visibilityTimer) {
    clearTimeout(visibilityTimer)
    visibilityTimer = null
  }
}

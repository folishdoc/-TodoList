// 标记是否已经发送过关闭请求
let shutdownSent = false

/**
 * 注册页面关闭监听器
 * 在用户关闭浏览器标签页时自动停止后端服务
 */
export const registerShutdownListener = () => {
  // 监听页面卸载事件
  window.addEventListener('beforeunload', handleBeforeUnload)

  // 监听页面隐藏（切换标签页也会触发，所以需要配合visibilitychange）
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

/**
 * 处理页面即将卸载
 */
const handleBeforeUnload = async () => {
  if (!shutdownSent) {
    shutdownSent = true
    // 使用sendBeacon确保请求能发送出去
    sendShutdownRequest()
  }
}

/**
 * 处理页面可见性变化
 */
const handleVisibilityChange = () => {
  // 只在页面完全关闭时触发，不是切换标签
  if (document.visibilityState === 'hidden') {
    // 设置一个定时器，如果页面没有重新可见，则发送关闭请求
    setTimeout(() => {
      if (document.visibilityState === 'hidden' && !shutdownSent) {
        shutdownSent = true
        sendShutdownRequest()
      }
    }, 5000) // 5秒后如果还是hidden状态，认为是要关闭
  }
}

/**
 * 发送关闭请求
 */
const sendShutdownRequest = () => {
  try {
    // 使用navigator.sendBeacon，即使页面关闭也能发送
    const blob = new Blob([JSON.stringify({ action: 'shutdown' })], {
      type: 'application/json',
    })
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/i, '') || 'http://localhost:8080'
    navigator.sendBeacon(`${apiBase}/api/system/shutdown`, blob)
  } catch (error) {
    console.error('Failed to send shutdown request:', error)
  }
}

/**
 * 移除监听器
 */
export const unregisterShutdownListener = () => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
}

import { onMounted, onUnmounted } from 'vue'

// 键盘快捷键映射
const shortcuts: Record<string, (e: KeyboardEvent) => void> = {}

// 注册快捷键
export const registerShortcut = (key: string, handler: (e: KeyboardEvent) => void) => {
  shortcuts[key.toLowerCase()] = handler
}

// 注销快捷键
export const unregisterShortcut = (key: string) => {
  delete shortcuts[key.toLowerCase()]
}

// 键盘事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  // 忽略输入框中的按键
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return
  }

  const key = e.key.toLowerCase()
  
  // 检查是否有注册的快捷键
  if (shortcuts[key]) {
    e.preventDefault()
    shortcuts[key](e)
  }
}

// 快捷键Hook
export const useKeyboardShortcuts = () => {
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
}

// 常用快捷键
export const CommonShortcuts = {
  NEW_TASK: 'n',        // 新建任务
  SEARCH: '/',          // 搜索
  COMPLETE: 'c',        // 完成任务
  DELETE: 'd',          // 删除任务
  EDIT: 'e',            // 编辑任务
  REFRESH: 'r',         // 刷新
  THEME: 't',           // 切换主题
}

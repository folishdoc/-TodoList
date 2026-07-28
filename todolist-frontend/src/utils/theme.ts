/**
 * 主题管理工具
 *
 * 支持 light / dark 双主题切换。
 * 主题偏好持久化到 localStorage，通过给 `<html>` 添加/移除 `dark-theme` class 控制样式切换。
 */
import { ref } from 'vue'

// ── 类型 ──
export type ThemeType = 'light' | 'dark'

// ── 响应式状态 ──
const currentTheme = ref<ThemeType>('light')

/**
 * 初始化主题：从 localStorage 读取已保存的主题偏好并应用
 */
export const initTheme = () => {
  const savedTheme = localStorage.getItem('theme') as ThemeType
  if (savedTheme) {
    currentTheme.value = savedTheme
    applyTheme(savedTheme)
  }
}

/**
 * 应用主题：切换 `dark-theme` CSS class
 */
const applyTheme = (theme: ThemeType) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-theme')
  } else {
    document.documentElement.classList.remove('dark-theme')
  }
}



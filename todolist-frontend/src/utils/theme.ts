import { ref } from 'vue'

// 主题类型
export type ThemeType = 'light' | 'dark'

// 当前主题
const currentTheme = ref<ThemeType>('light')

// 初始化主题
export const initTheme = () => {
  const savedTheme = localStorage.getItem('theme') as ThemeType
  if (savedTheme) {
    currentTheme.value = savedTheme
    applyTheme(savedTheme)
  }
}

// 应用主题
const applyTheme = (theme: ThemeType) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-theme')
  } else {
    document.documentElement.classList.remove('dark-theme')
  }
}



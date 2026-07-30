/**
 * Vue 应用入口文件
 *
 * 初始化 Vue 3 应用：注册 Pinia（状态管理）、Vue Router、Element Plus（UI 库）、
 * 所有 Element Plus 图标为全局组件，并初始化主题。
 */
// ── 依赖导入 ──
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import App from './App.vue'
import { initTheme } from './utils/theme'
import './styles/dark-theme.css'

// ── 应用初始化 ──
const app = createApp(App)
const pinia = createPinia()

// 从 localStorage 读取并应用已保存的主题（light/dark）
initTheme()

// 将所有 Element Plus 图标注册为全局组件，以便在模板中直接通过 <icon-name> 使用
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.mount('#app')

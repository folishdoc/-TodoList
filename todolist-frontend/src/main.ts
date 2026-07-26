import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import App from './App.vue'
import { initTheme } from './utils/theme'
import './styles/dark-theme.css'

const app = createApp(App)
const pinia = createPinia()

// 初始化主题
initTheme()

// 注册页面关闭监听器（开发环境）- 已禁用以避免意外关闭
// if (import.meta.env.DEV) {
//   registerShutdownListener()
// }

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.mount('#app')

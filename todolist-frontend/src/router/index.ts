/**
 * Vue Router 路由配置
 *
 * 使用 Hash 历史模式（兼容无服务端配置的静态部署）。
 * 两个路由：
 * - `/` → Dashboard.vue（主应用界面）
 * - `/widget` → WidgetView.vue（嵌入式 widget，供 iframe 嵌入）
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import WidgetView from '../views/WidgetView.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/widget',
    name: 'Widget',
    component: WidgetView,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router

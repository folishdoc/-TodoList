/**
 * Vue Router 路由配置
 *
 * 使用 Hash 历史模式（兼容无服务端配置的静态部署）。
 *
 * 路由守卫逻辑：
 * - 已登录（auth store 有 token）或配置了 VITE_PERSONAL_TOKEN → 可访问 Dashboard
 * - 未登录且未配置个人 Token → 重定向到 /login
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import WidgetView from '../views/WidgetView.vue'
import LoginView from '../views/Login.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
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

/**
 * 导航守卫 — 未登录时重定向到 /login
 *
 * 两种免登录场景：
 * 1. auth store 中已有 JWT token（localStorage 恢复）
 * 2. 配置了 VITE_PERSONAL_TOKEN 环境变量（单用户模式）
 */
router.beforeEach((to, _from, next) => {
  if (to.name === 'Login' || to.name === 'Widget') {
    next()
    return
  }

  const token = localStorage.getItem('jwt_token') || import.meta.env.VITE_PERSONAL_TOKEN
  if (!token) {
    next({ name: 'Login' })
    return
  }

  next()
})

export default router

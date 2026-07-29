/**
 * Vue Router 路由配置
 *
 * 使用 Hash 历史模式（兼容无服务端配置的静态部署）。
 *
 * 路由守卫逻辑：
 * - 初始页面为登录页
 * - 若 localStorage 存在未过期的 JWT token → 跳转 Dashboard
 * - token 过期或不存在 → 清除 token 并重定向到登录页
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import { isJwtExpired } from '../utils/jwt'
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
 * 导航守卫 — JWT 过期检查
 *
 * - Login/Widget 页面始终可访问
 * - 访问 Dashboard 前检查 token 是否存在且未过期
 * - token 过期 → 清除本地会话 → 重定向登录
 */
router.beforeEach((to, _from, next) => {
  if (to.name === 'Login' || to.name === 'Widget') {
    next()
    return
  }

  const token = localStorage.getItem('jwt_token')
  if (!token || isJwtExpired(token)) {
    // token 不存在或已过期 → 清除残留数据 → 跳登录
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('username')
    localStorage.removeItem('display_name')
    next({ name: 'Login' })
    return
  }

  next()
})

export default router

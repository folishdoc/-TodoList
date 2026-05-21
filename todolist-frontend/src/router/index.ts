import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 简单的token检查
router.beforeEach(() => {
  // 个人使用版本，始终允许访问
  // 如果需要登录，可以在这里添加token检查
  // Vue Router 5.x: 直接返回 true 或 undefined，不再使用 next()
  return true
})

export default router

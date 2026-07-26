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

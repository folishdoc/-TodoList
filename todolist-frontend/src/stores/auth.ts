/**
 * Pinia 认证状态管理
 *
 * 管理用户登录/注册/登出流程。状态持久化到 localStorage，
 * 刷新后自动恢复会话（JWT token）。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi } from '../api/auth'
import { isJwtExpired } from '../utils/jwt'

export const useAuthStore = defineStore('auth', () => {
  // ── 持久化状态（从 localStorage 初始化） ──
  const token = ref<string | null>(localStorage.getItem('jwt_token'))
  const userId = ref<number | null>(localStorage.getItem('user_id') ? Number(localStorage.getItem('user_id')) : null)
  const username = ref<string | null>(localStorage.getItem('username'))
  const displayName = ref<string | null>(localStorage.getItem('display_name'))

  /** 是否已登录（token 存在且未过期） */
  const isAuthenticated = computed(() => !!token.value && !isJwtExpired(token.value))

  /** 将登录/注册响应保存到内存和 localStorage */
  function saveSession(res: { token: string; userId: number; username: string; displayName: string }) {
    token.value = res.token
    userId.value = res.userId
    username.value = res.username
    displayName.value = res.displayName
    localStorage.setItem('jwt_token', res.token)
    localStorage.setItem('user_id', String(res.userId))
    localStorage.setItem('username', res.username)
    localStorage.setItem('display_name', res.displayName)
  }

  /** 用户名+密码登录 */
  async function login(usernameVal: string, password: string) {
    const res = await loginApi(usernameVal, password)
    saveSession(res)
  }

  /** 注册新用户 */
  async function register(usernameVal: string, password: string, displayNameVal?: string) {
    const res = await registerApi(usernameVal, password, displayNameVal)
    saveSession(res)
  }

  /** 登出：清除内存和 localStorage 中的会话 */
  function logout() {
    token.value = null
    userId.value = null
    username.value = null
    displayName.value = null
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('username')
    localStorage.removeItem('display_name')
  }

  return { token, userId, username, displayName, isAuthenticated, login, register, logout }
})

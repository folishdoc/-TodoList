import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('jwt_token'))
  const userId = ref<number | null>(localStorage.getItem('user_id') ? Number(localStorage.getItem('user_id')) : null)
  const username = ref<string | null>(localStorage.getItem('username'))
  const displayName = ref<string | null>(localStorage.getItem('display_name'))

  const isAuthenticated = computed(() => !!token.value)

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

  async function login(usernameVal: string, password: string) {
    const res = await loginApi(usernameVal, password)
    saveSession(res)
  }

  async function register(usernameVal: string, password: string, displayNameVal?: string) {
    const res = await registerApi(usernameVal, password, displayNameVal)
    saveSession(res)
  }

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

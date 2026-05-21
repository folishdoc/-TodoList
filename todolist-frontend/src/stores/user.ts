import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 默认用户信息（个人使用，无需登录）
const DEFAULT_USER = {
  id: 1,
  username: '用户',
  email: 'local@user.com'
}

export const useUserStore = defineStore('user', () => {
  // 直接使用默认用户，不需要token
  const token = ref('default-token')
  const userInfo = ref(DEFAULT_USER)

  const isAuthenticated = computed(() => true)

  function setToken(newToken: string) {
    token.value = newToken
  }

  function setUserInfo(info: any) {
    userInfo.value = info
  }

  function logout() {
    // 个人使用，不需要退出功能
    console.log('个人版本无需退出')
  }

  return {
    token,
    userInfo,
    isAuthenticated,
    setToken,
    setUserInfo,
    logout
  }
})

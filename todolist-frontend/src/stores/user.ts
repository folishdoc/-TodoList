import { defineStore } from 'pinia'
import { ref } from 'vue'

// 默认用户信息（个人使用，无需登录）
const DEFAULT_USER = {
  id: 1,
  username: '用户',
  email: 'local@user.com',
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(DEFAULT_USER)

  return {
    userInfo,
  }
})

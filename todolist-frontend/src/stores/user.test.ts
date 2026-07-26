import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from './user'

describe('stores/user.ts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default user info', () => {
    const store = useUserStore()
    expect(store.userInfo).toEqual({ id: 1, username: '用户', email: 'local@user.com' })
  })
})

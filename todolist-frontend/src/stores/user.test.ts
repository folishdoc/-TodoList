import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from './user'

describe('stores/user.ts', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default token and user info', () => {
    const store = useUserStore()
    expect(store.token).toBe('default-token')
    expect(store.userInfo).toEqual({ id: 1, username: '用户', email: 'local@user.com' })
  })

  it('isAuthenticated is always true (personal-use mode)', () => {
    const store = useUserStore()
    expect(store.isAuthenticated).toBe(true)
  })

  it('setToken updates token', () => {
    const store = useUserStore()
    store.setToken('abc123')
    expect(store.token).toBe('abc123')
  })

  it('setUserInfo replaces user info', () => {
    const store = useUserStore()
    store.setUserInfo({ id: 99, username: 'alice', email: 'a@b.com' })
    expect(store.userInfo).toEqual({ id: 99, username: 'alice', email: 'a@b.com' })
  })

  it('logout logs a message but does not clear data', () => {
    const store = useUserStore()
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    store.logout()
    expect(spy).toHaveBeenCalledWith('个人版本无需退出')
    expect(store.token).toBe('default-token')
    expect(store.userInfo).toEqual({ id: 1, username: '用户', email: 'local@user.com' })
  })
})

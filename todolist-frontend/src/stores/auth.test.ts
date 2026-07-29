import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

/**
 * 生成测试用 JWT 格式 token（header.payload.signature）。
 * payload 包含 exp 声明（未来 1 小时），使 isJwtExpired 返回 false。
 */
function makeToken(payload: Record<string, unknown>): string {
  const enc = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${enc({ alg: 'HS384' })}.${enc(payload)}.dummy-sig`
}

const validToken = makeToken({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 })

// Mock the auth API module
vi.mock('../api/auth', () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
}))

describe('stores/auth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('starts with no token when localStorage is empty', () => {
    const store = useAuthStore()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('reads token from localStorage on init', () => {
    localStorage.setItem('jwt_token', validToken)
    const store = useAuthStore()
    expect(store.token).toBe(validToken)
    expect(store.isAuthenticated).toBe(true)
  })

  it('considers token without exp as non-expired (backward compat)', () => {
    const tokenNoExp = makeToken({ sub: '1' })
    localStorage.setItem('jwt_token', tokenNoExp)
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(true)
  })

  it('considers expired token as not authenticated', () => {
    const expiredToken = makeToken({ sub: '1', exp: Math.floor(Date.now() / 1000) - 3600 })
    localStorage.setItem('jwt_token', expiredToken)
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
  })

  it('login() stores token and user info', async () => {
    const { loginApi } = await import('../api/auth')
    vi.mocked(loginApi).mockResolvedValue({
      token: validToken,
      userId: 2,
      username: 'testuser',
      displayName: 'Test User',
    })

    const store = useAuthStore()
    await store.login('testuser', 'password123')

    expect(store.token).toBe(validToken)
    expect(store.userId).toBe(2)
    expect(store.username).toBe('testuser')
    expect(store.displayName).toBe('Test User')
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('jwt_token')).toBe(validToken)
    expect(localStorage.getItem('user_id')).toBe('2')
    expect(localStorage.getItem('username')).toBe('testuser')
    expect(localStorage.getItem('display_name')).toBe('Test User')
    expect(loginApi).toHaveBeenCalledWith('testuser', 'password123')
  })

  it('register() stores token and user info', async () => {
    const { registerApi } = await import('../api/auth')
    vi.mocked(registerApi).mockResolvedValue({
      token: validToken,
      userId: 3,
      username: 'newuser',
      displayName: 'New User',
    })

    const store = useAuthStore()
    await store.register('newuser', 'password123', 'New User')

    expect(store.token).toBe(validToken)
    expect(store.userId).toBe(3)
    expect(store.username).toBe('newuser')
    expect(store.displayName).toBe('New User')
    expect(localStorage.getItem('jwt_token')).toBe(validToken)
    expect(registerApi).toHaveBeenCalledWith('newuser', 'password123', 'New User')
  })

  it('register() uses username as displayName when not provided', async () => {
    const { registerApi } = await import('../api/auth')
    vi.mocked(registerApi).mockResolvedValue({
      token: validToken,
      userId: 3,
      username: 'newuser',
      displayName: 'newuser',
    })

    const store = useAuthStore()
    await store.register('newuser', 'password123')

    expect(registerApi).toHaveBeenCalledWith('newuser', 'password123', undefined)
  })

  it('logout() clears all user info from store and localStorage', () => {
    localStorage.setItem('jwt_token', validToken)
    localStorage.setItem('user_id', '1')
    localStorage.setItem('username', 'testuser')
    localStorage.setItem('display_name', 'Test User')
    const store = useAuthStore()
    store.token = validToken
    store.userId = 1
    store.username = 'testuser'
    store.displayName = 'Test User'

    store.logout()

    expect(store.token).toBeNull()
    expect(store.userId).toBeNull()
    expect(store.username).toBeNull()
    expect(store.displayName).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('jwt_token')).toBeNull()
    expect(localStorage.getItem('user_id')).toBeNull()
    expect(localStorage.getItem('username')).toBeNull()
    expect(localStorage.getItem('display_name')).toBeNull()
  })
})

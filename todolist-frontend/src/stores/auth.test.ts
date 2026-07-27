import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

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
    localStorage.setItem('jwt_token', 'existing-jwt')
    const store = useAuthStore()
    expect(store.token).toBe('existing-jwt')
    expect(store.isAuthenticated).toBe(true)
  })

  it('login() stores token and user info', async () => {
    const { loginApi } = await import('../api/auth')
    vi.mocked(loginApi).mockResolvedValue({
      token: 'new-jwt',
      userId: 2,
      username: 'testuser',
      displayName: 'Test User',
    })

    const store = useAuthStore()
    await store.login('testuser', 'password123')

    expect(store.token).toBe('new-jwt')
    expect(store.userId).toBe(2)
    expect(store.username).toBe('testuser')
    expect(store.displayName).toBe('Test User')
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('jwt_token')).toBe('new-jwt')
    expect(localStorage.getItem('user_id')).toBe('2')
    expect(localStorage.getItem('username')).toBe('testuser')
    expect(localStorage.getItem('display_name')).toBe('Test User')
    expect(loginApi).toHaveBeenCalledWith('testuser', 'password123')
  })

  it('register() stores token and user info', async () => {
    const { registerApi } = await import('../api/auth')
    vi.mocked(registerApi).mockResolvedValue({
      token: 'register-jwt',
      userId: 3,
      username: 'newuser',
      displayName: 'New User',
    })

    const store = useAuthStore()
    await store.register('newuser', 'password123', 'New User')

    expect(store.token).toBe('register-jwt')
    expect(store.userId).toBe(3)
    expect(store.username).toBe('newuser')
    expect(store.displayName).toBe('New User')
    expect(localStorage.getItem('jwt_token')).toBe('register-jwt')
    expect(registerApi).toHaveBeenCalledWith('newuser', 'password123', 'New User')
  })

  it('register() uses username as displayName when not provided', async () => {
    const { registerApi } = await import('../api/auth')
    vi.mocked(registerApi).mockResolvedValue({
      token: 'register-jwt',
      userId: 3,
      username: 'newuser',
      displayName: 'newuser',
    })

    const store = useAuthStore()
    await store.register('newuser', 'password123')

    expect(registerApi).toHaveBeenCalledWith('newuser', 'password123', undefined)
  })

  it('logout() clears all user info from store and localStorage', () => {
    localStorage.setItem('jwt_token', 'some-jwt')
    localStorage.setItem('user_id', '1')
    localStorage.setItem('username', 'testuser')
    localStorage.setItem('display_name', 'Test User')
    const store = useAuthStore()
    store.token = 'some-jwt'
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

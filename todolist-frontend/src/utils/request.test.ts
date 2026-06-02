import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ElMessage } from 'element-plus'

// Build a mock request instance with interceptors that record the callbacks.
const requestInterceptor = vi.fn((config) => config)
const requestErrorInterceptor = vi.fn((err) => Promise.reject(err))
const responseInterceptor = vi.fn((response) => response)
const responseErrorInterceptor = vi.fn((err) => Promise.reject(err))

const mockRequestInstance = {
  interceptors: {
    request: { use: vi.fn((ok, err) => { requestInterceptor.mockImplementation(ok); requestErrorInterceptor.mockImplementation(err) }) },
    response: { use: vi.fn((ok, err) => { responseInterceptor.mockImplementation(ok); responseErrorInterceptor.mockImplementation(err) }) }
  }
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockRequestInstance)
  }
}))

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() }
}))

describe('utils/request.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses correct baseURL and timeout', async () => {
    await import('./request')
    const axios = (await import('axios')).default
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://localhost:18080/api',
        timeout: 10000
      })
    )
  })

  it('injects Authorization header with personal token', async () => {
    await import('./request')
    const config: any = { headers: {} }
    const result = requestInterceptor(config)
    expect(result.headers.Authorization).toBe('Bearer dev-personal-token-2026-secure-key')
  })

  it('rejects request interceptor errors', async () => {
    await import('./request')
    const error = new Error('config fail')
    await expect(requestErrorInterceptor(error)).rejects.toBe(error)
  })

  it('returns data directly for blob responses', async () => {
    await import('./request')
    const response: any = { data: new Blob(['x']), config: { responseType: 'blob' } }
    expect(responseInterceptor(response)).toEqual(new Blob(['x']))
  })

  it('returns data directly for arraybuffer responses', async () => {
    await import('./request')
    const response: any = { data: new ArrayBuffer(8), config: { responseType: 'arraybuffer' } }
    expect(responseInterceptor(response)).toEqual(new ArrayBuffer(8))
  })

  it('returns res.data when code is 200', async () => {
    await import('./request')
    const response: any = { data: { code: 200, message: 'ok', data: { id: 1 } }, config: {} }
    expect(responseInterceptor(response)).toEqual({ code: 200, message: 'ok', data: { id: 1 } })
  })

  it('rejects with Error and shows ElMessage when code is non-200', async () => {
    await import('./request')
    const response: any = { data: { code: 500, message: '服务器炸了' }, config: {} }
    await expect(responseInterceptor(response)).rejects.toThrow('服务器炸了')
    expect(ElMessage.error).toHaveBeenCalledWith('服务器炸了')
  })

  it('uses default failure message when no message provided', async () => {
    await import('./request')
    const response: any = { data: { code: 400 }, config: {} }
    await expect(responseInterceptor(response)).rejects.toThrow('请求失败')
    expect(ElMessage.error).toHaveBeenCalledWith('请求失败')
  })

  it('shows "认证失败" on 401 network error', async () => {
    await import('./request')
    const error: any = { response: { status: 401 }, message: 'Unauthorized' }
    await expect(responseErrorInterceptor(error)).rejects.toBe(error)
    expect(ElMessage.error).toHaveBeenCalledWith('认证失败，请检查后端服务')
  })

  it('shows generic error message on other network errors', async () => {
    await import('./request')
    const error: any = { response: { status: 500 }, message: 'Server exploded' }
    try {
      await responseErrorInterceptor(error)
    } catch {
      // expected to reject
    }
    expect(ElMessage.error).toHaveBeenCalledWith('Server exploded')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args)
}))

import { getUserInfo } from './user'

describe('api/user.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('getUserInfo: GET /auth/profile', async () => {
    requestMock.mockResolvedValue({ id: 1, username: 'alice' } as any)
    await getUserInfo()
    expect(requestMock).toHaveBeenCalledWith({ url: '/auth/profile', method: 'get' })
  })
})

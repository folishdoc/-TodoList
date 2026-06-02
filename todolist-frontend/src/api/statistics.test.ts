import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args)
}))

import { getOverview, getByList, getByPriority, getTrend } from './statistics'

describe('api/statistics.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('getOverview: GET /statistics/overview', async () => {
    requestMock.mockResolvedValue({} as any)
    await getOverview()
    expect(requestMock).toHaveBeenCalledWith({ url: '/statistics/overview', method: 'get' })
  })

  it('getByList: GET /statistics/by-list', async () => {
    requestMock.mockResolvedValue([] as any)
    await getByList()
    expect(requestMock).toHaveBeenCalledWith({ url: '/statistics/by-list', method: 'get' })
  })

  it('getByPriority: GET /statistics/by-priority', async () => {
    requestMock.mockResolvedValue([] as any)
    await getByPriority()
    expect(requestMock).toHaveBeenCalledWith({ url: '/statistics/by-priority', method: 'get' })
  })

  it('getTrend: GET /statistics/trend with default days=7', async () => {
    requestMock.mockResolvedValue([] as any)
    await getTrend()
    expect(requestMock).toHaveBeenCalledWith({
      url: '/statistics/trend',
      method: 'get',
      params: { days: 7 }
    })
  })

  it('getTrend: GET /statistics/trend with custom days', async () => {
    requestMock.mockResolvedValue([] as any)
    await getTrend(30)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/statistics/trend',
      method: 'get',
      params: { days: 30 }
    })
  })
})

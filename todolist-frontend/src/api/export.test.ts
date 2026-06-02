import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args)
}))

import { exportTasksCsv, exportTasksJson } from './export'

describe('api/export.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('exportTasksCsv: GET /export/tasks/csv with blob responseType', async () => {
    requestMock.mockResolvedValue(new Blob(['csv']) as any)
    await exportTasksCsv()
    expect(requestMock).toHaveBeenCalledWith({
      url: '/export/tasks/csv',
      method: 'get',
      responseType: 'blob'
    })
  })

  it('exportTasksJson: GET /export/tasks/json with blob responseType', async () => {
    requestMock.mockResolvedValue(new Blob(['{}']) as any)
    await exportTasksJson()
    expect(requestMock).toHaveBeenCalledWith({
      url: '/export/tasks/json',
      method: 'get',
      responseType: 'blob'
    })
  })
})

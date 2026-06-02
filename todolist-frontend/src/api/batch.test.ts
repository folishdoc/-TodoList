import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args)
}))

import {
  executeBatchOperation,
  batchComplete,
  batchDelete,
  batchMove,
  batchSetPriority
} from './batch'

describe('api/batch.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('executeBatchOperation: POST /tasks/batch/execute with payload', async () => {
    const payload = { operation: 'COMPLETE', taskIds: [1, 2, 3] }
    requestMock.mockResolvedValue({} as any)
    await executeBatchOperation(payload)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks/batch/execute',
      method: 'post',
      data: payload
    })
  })

  it('batchComplete: POST /tasks/batch/complete with {taskIds}', async () => {
    requestMock.mockResolvedValue({} as any)
    await batchComplete([1, 2, 3])
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks/batch/complete',
      method: 'post',
      data: { taskIds: [1, 2, 3] }
    })
  })

  it('batchDelete: POST /tasks/batch/delete with {taskIds}', async () => {
    requestMock.mockResolvedValue({} as any)
    await batchDelete([10, 20])
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks/batch/delete',
      method: 'post',
      data: { taskIds: [10, 20] }
    })
  })

  it('batchMove: POST /tasks/batch/move with {taskIds, targetListId}', async () => {
    requestMock.mockResolvedValue({} as any)
    await batchMove([1, 2], 5)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks/batch/move',
      method: 'post',
      data: { taskIds: [1, 2], targetListId: 5 }
    })
  })

  it('batchSetPriority: POST /tasks/batch/set-priority with {taskIds, priority}', async () => {
    requestMock.mockResolvedValue({} as any)
    await batchSetPriority([1, 2, 3], 2)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks/batch/set-priority',
      method: 'post',
      data: { taskIds: [1, 2, 3], priority: 2 }
    })
  })
})

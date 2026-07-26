import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args),
}))

import { setRepeatRule, cancelRepeatRule, generateRepeatTasks } from './repeat'

describe('api/repeat.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('setRepeatRule: POST /tasks/repeat/{taskId} with rule data', async () => {
    const rule = { type: 'DAILY', interval: 1 }
    requestMock.mockResolvedValue({} as any)
    await setRepeatRule(3, rule)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks/repeat/3',
      method: 'post',
      data: rule,
    })
  })

  it('cancelRepeatRule: DELETE /tasks/repeat/{taskId}', async () => {
    requestMock.mockResolvedValue({} as any)
    await cancelRepeatRule(5)
    expect(requestMock).toHaveBeenCalledWith({ url: '/tasks/repeat/5', method: 'delete' })
  })

  it('generateRepeatTasks: POST /tasks/repeat/generate', async () => {
    requestMock.mockResolvedValue({ generated: 5 } as any)
    await generateRepeatTasks()
    expect(requestMock).toHaveBeenCalledWith({ url: '/tasks/repeat/generate', method: 'post' })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args),
}))

import { parseTask } from './ai'

describe('api/ai.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('parseTask: POST /ai/parse-task with input', async () => {
    const mockResult = {
      title: '开会讨论Q3规划',
      description: '',
      priority: 3,
      dueDate: '2026-07-31 15:00',
      startDate: '',
      listName: '',
      tags: ['会议', '规划'],
    }
    requestMock.mockResolvedValue(mockResult as any)
    const result = await parseTask('明天下午3点开会讨论Q3规划，高优先级，标签：会议、规划')
    expect(requestMock).toHaveBeenCalledWith({
      url: '/ai/parse-task',
      method: 'post',
      data: { input: '明天下午3点开会讨论Q3规划，高优先级，标签：会议、规划' },
    })
    expect(result).toEqual(mockResult)
  })

  it('parseTask: throws when AI unavailable (503)', async () => {
    const err = new Error('AI 服务暂不可用，请稍后重试')
    requestMock.mockRejectedValue(err)
    await expect(parseTask('test')).rejects.toThrow('AI 服务暂不可用，请稍后重试')
    expect(requestMock).toHaveBeenCalledWith({
      url: '/ai/parse-task',
      method: 'post',
      data: { input: 'test' },
    })
  })
})

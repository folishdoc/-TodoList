import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args)
}))

import {
  createTag,
  getTags,
  updateTag,
  deleteTag,
  addTagToTask,
  removeTagFromTask,
  getTaskTags
} from './tag'

describe('api/tag.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('createTag: POST /tags with data', async () => {
    const payload = { name: '工作', color: '#1890ff' }
    requestMock.mockResolvedValue({ id: 1 } as any)
    await createTag(payload)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tags',
      method: 'post',
      data: payload
    })
  })

  it('getTags: GET /tags', async () => {
    requestMock.mockResolvedValue({ data: [] } as any)
    await getTags()
    expect(requestMock).toHaveBeenCalledWith({ url: '/tags', method: 'get' })
  })

  it('updateTag: PUT /tags/{id} with data', async () => {
    const payload = { name: '新名' }
    requestMock.mockResolvedValue({} as any)
    await updateTag(3, payload)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tags/3',
      method: 'put',
      data: payload
    })
  })

  it('deleteTag: DELETE /tags/{id}', async () => {
    requestMock.mockResolvedValue({} as any)
    await deleteTag(8)
    expect(requestMock).toHaveBeenCalledWith({ url: '/tags/8', method: 'delete' })
  })

  it('addTagToTask: POST /tags/tasks/{taskId} with tagId param', async () => {
    requestMock.mockResolvedValue({} as any)
    await addTagToTask(1, 5)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tags/tasks/1',
      method: 'post',
      params: { tagId: 5 }
    })
  })

  it('removeTagFromTask: DELETE /tags/tasks/{taskId} with tagId param', async () => {
    requestMock.mockResolvedValue({} as any)
    await removeTagFromTask(2, 6)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tags/tasks/2',
      method: 'delete',
      params: { tagId: 6 }
    })
  })

  it('getTaskTags: GET /tags/tasks/{taskId}', async () => {
    requestMock.mockResolvedValue([] as any)
    await getTaskTags(1)
    expect(requestMock).toHaveBeenCalledWith({ url: '/tags/tasks/1', method: 'get' })
  })
})

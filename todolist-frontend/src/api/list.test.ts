import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args)
}))

import { getLists, getListById, createList, updateList, deleteList } from './list'

describe('api/list.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('getLists: GET /lists', async () => {
    requestMock.mockResolvedValue({ data: [] } as any)
    await getLists()
    expect(requestMock).toHaveBeenCalledWith({ url: '/lists', method: 'get' })
  })

  it('getListById: GET /lists/{id}', async () => {
    requestMock.mockResolvedValue({ id: 1 } as any)
    await getListById(1)
    expect(requestMock).toHaveBeenCalledWith({ url: '/lists/1', method: 'get' })
  })

  it('createList: POST /lists with data', async () => {
    const payload = { name: '工作', color: '#fff' }
    requestMock.mockResolvedValue({ id: 1 } as any)
    await createList(payload)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/lists',
      method: 'post',
      data: payload
    })
  })

  it('updateList: PUT /lists/{id} with data', async () => {
    const payload = { name: '新名' }
    requestMock.mockResolvedValue({} as any)
    await updateList(2, payload)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/lists/2',
      method: 'put',
      data: payload
    })
  })

  it('deleteList: DELETE /lists/{id}', async () => {
    requestMock.mockResolvedValue({} as any)
    await deleteList(3)
    expect(requestMock).toHaveBeenCalledWith({ url: '/lists/3', method: 'delete' })
  })
})

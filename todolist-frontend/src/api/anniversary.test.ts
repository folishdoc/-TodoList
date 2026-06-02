import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args)
}))

import {
  getAnniversaries,
  getAnniversaryById,
  createAnniversary,
  updateAnniversary,
  deleteAnniversary,
  generateTodo,
  getPendingReminders,
  markReminderRead
} from './anniversary'

describe('api/anniversary.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('getAnniversaries: GET /anniversaries with optional params', async () => {
    requestMock.mockResolvedValue({ data: [] } as any)
    await getAnniversaries({ year: 2026 })
    expect(requestMock).toHaveBeenCalledWith({
      url: '/anniversaries',
      method: 'get',
      params: { year: 2026 }
    })
  })

  it('getAnniversaries: works without params', async () => {
    requestMock.mockResolvedValue({ data: [] } as any)
    await getAnniversaries()
    expect(requestMock).toHaveBeenCalledWith({
      url: '/anniversaries',
      method: 'get',
      params: undefined
    })
  })

  it('getAnniversaryById: GET /anniversaries/{id}', async () => {
    requestMock.mockResolvedValue({ id: 1 } as any)
    await getAnniversaryById(1)
    expect(requestMock).toHaveBeenCalledWith({ url: '/anniversaries/1', method: 'get' })
  })

  it('createAnniversary: POST /anniversaries', async () => {
    const payload = { name: '生日', date: '2026-06-15' }
    requestMock.mockResolvedValue({ id: 1 } as any)
    await createAnniversary(payload)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/anniversaries',
      method: 'post',
      data: payload
    })
  })

  it('updateAnniversary: PUT /anniversaries/{id}', async () => {
    const payload = { name: '新名字' }
    requestMock.mockResolvedValue({} as any)
    await updateAnniversary(3, payload)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/anniversaries/3',
      method: 'put',
      data: payload
    })
  })

  it('deleteAnniversary: DELETE /anniversaries/{id}', async () => {
    requestMock.mockResolvedValue({} as any)
    await deleteAnniversary(7)
    expect(requestMock).toHaveBeenCalledWith({ url: '/anniversaries/7', method: 'delete' })
  })

  it('generateTodo: POST /anniversaries/{id}/generate-todo', async () => {
    requestMock.mockResolvedValue({ taskId: 100 } as any)
    await generateTodo(5)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/anniversaries/5/generate-todo',
      method: 'post'
    })
  })

  it('getPendingReminders: GET /anniversaries/pending-reminders', async () => {
    requestMock.mockResolvedValue([] as any)
    await getPendingReminders()
    expect(requestMock).toHaveBeenCalledWith({
      url: '/anniversaries/pending-reminders',
      method: 'get'
    })
  })

  it('markReminderRead: PUT /anniversaries/reminders/{logId}/read', async () => {
    requestMock.mockResolvedValue({} as any)
    await markReminderRead(99)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/anniversaries/reminders/99/read',
      method: 'put'
    })
  })
})

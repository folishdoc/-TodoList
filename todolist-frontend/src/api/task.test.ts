import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args),
}))

import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  uncompleteTask,
  getTodayTasks,
  getUpcomingTasks,
  searchTasks,
  updateTaskTime,
  getTasksByDateRange,
} from './task'

describe('api/task.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('getTasks: GET /tasks with params', async () => {
    requestMock.mockResolvedValue({ data: { content: [] } } as any)
    await getTasks({ page: 0, size: 20, status: 0 })
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks',
      method: 'get',
      params: { page: 0, size: 20, status: 0 },
    })
  })

  it('getTaskById: GET /tasks/{id}', async () => {
    requestMock.mockResolvedValue({ id: 1 } as any)
    await getTaskById(1)
    expect(requestMock).toHaveBeenCalledWith({ url: '/tasks/1', method: 'get' })
  })

  it('createTask: POST /tasks', async () => {
    const payload = { title: 'Test', priority: 1 }
    requestMock.mockResolvedValue({ id: 1 } as any)
    await createTask(payload as any)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks',
      method: 'post',
      data: payload,
    })
  })

  it('updateTask: PUT /tasks/{id}', async () => {
    const payload = { title: 'Updated' }
    requestMock.mockResolvedValue({} as any)
    await updateTask(5, payload as any)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks/5',
      method: 'put',
      data: payload,
    })
  })

  it('deleteTask: DELETE /tasks/{id}', async () => {
    requestMock.mockResolvedValue({} as any)
    await deleteTask(7)
    expect(requestMock).toHaveBeenCalledWith({ url: '/tasks/7', method: 'delete' })
  })

  it('completeTask: PATCH /tasks/{id}/complete', async () => {
    requestMock.mockResolvedValue({} as any)
    await completeTask(3)
    expect(requestMock).toHaveBeenCalledWith({ url: '/tasks/3/complete', method: 'patch' })
  })

  it('uncompleteTask: PATCH /tasks/{id}/uncomplete', async () => {
    requestMock.mockResolvedValue({} as any)
    await uncompleteTask(3)
    expect(requestMock).toHaveBeenCalledWith({ url: '/tasks/3/uncomplete', method: 'patch' })
  })

  it('getTodayTasks: GET /tasks/today', async () => {
    requestMock.mockResolvedValue([] as any)
    await getTodayTasks()
    expect(requestMock).toHaveBeenCalledWith({ url: '/tasks/today', method: 'get' })
  })

  it('getUpcomingTasks: GET /tasks/upcoming', async () => {
    requestMock.mockResolvedValue([] as any)
    await getUpcomingTasks()
    expect(requestMock).toHaveBeenCalledWith({ url: '/tasks/upcoming', method: 'get' })
  })

  it('searchTasks: GET /tasks/search with params', async () => {
    requestMock.mockResolvedValue({ data: { content: [] } } as any)
    await searchTasks({ keyword: 'milk' })
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks/search',
      method: 'get',
      params: { keyword: 'milk' },
    })
  })

  it('updateTaskTime: PATCH /tasks/{id}/time', async () => {
    const data = { startDate: '2026-06-15', dueDate: '2026-06-16' }
    requestMock.mockResolvedValue({} as any)
    await updateTaskTime(3, data)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks/3/time',
      method: 'patch',
      data,
    })
  })

  it('getTasksByDateRange: GET /tasks/range with start/end params', async () => {
    requestMock.mockResolvedValue([] as any)
    await getTasksByDateRange('2026-06-01', '2026-06-30')
    expect(requestMock).toHaveBeenCalledWith({
      url: '/tasks/range',
      method: 'get',
      params: { start: '2026-06-01', end: '2026-06-30' },
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args),
}))

import {
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  checkIn,
  cancelCheckIn,
  getRecords,
  getRecordsByRange,
  getTodayRecords,
} from './habit'

describe('api/habit.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('getHabits: GET /habits', async () => {
    requestMock.mockResolvedValue({ data: [] } as any)
    await getHabits()
    expect(requestMock).toHaveBeenCalledWith({ url: '/habits', method: 'get' })
  })

  it('getHabitById: GET /habits/{id}', async () => {
    requestMock.mockResolvedValue({ id: 1 } as any)
    await getHabitById(1)
    expect(requestMock).toHaveBeenCalledWith({ url: '/habits/1', method: 'get' })
  })

  it('createHabit: POST /habits', async () => {
    const payload = { name: '跑步', frequency: 'DAILY' }
    requestMock.mockResolvedValue({ id: 1 } as any)
    await createHabit(payload)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/habits',
      method: 'post',
      data: payload,
    })
  })

  it('updateHabit: PUT /habits/{id}', async () => {
    const payload = { name: '晨跑' }
    requestMock.mockResolvedValue({} as any)
    await updateHabit(2, payload)
    expect(requestMock).toHaveBeenCalledWith({
      url: '/habits/2',
      method: 'put',
      data: payload,
    })
  })

  it('deleteHabit: DELETE /habits/{id}', async () => {
    requestMock.mockResolvedValue({} as any)
    await deleteHabit(9)
    expect(requestMock).toHaveBeenCalledWith({ url: '/habits/9', method: 'delete' })
  })

  it('checkIn: POST /habits/{id}/checkin with params', async () => {
    requestMock.mockResolvedValue({} as any)
    await checkIn(1, { date: '2026-06-15' })
    expect(requestMock).toHaveBeenCalledWith({
      url: '/habits/1/checkin',
      method: 'post',
      params: { date: '2026-06-15' },
    })
  })

  it('cancelCheckIn: DELETE /habits/{id}/checkin with checkDate param', async () => {
    requestMock.mockResolvedValue({} as any)
    await cancelCheckIn(1, '2026-06-15')
    expect(requestMock).toHaveBeenCalledWith({
      url: '/habits/1/checkin',
      method: 'delete',
      params: { checkDate: '2026-06-15' },
    })
  })

  it('getRecords: GET /habits/{id}/records', async () => {
    requestMock.mockResolvedValue([] as any)
    await getRecords(1)
    expect(requestMock).toHaveBeenCalledWith({ url: '/habits/1/records', method: 'get' })
  })

  it('getRecordsByRange: GET /habits/{id}/records/range with startDate/endDate', async () => {
    requestMock.mockResolvedValue([] as any)
    await getRecordsByRange(1, '2026-06-01', '2026-06-30')
    expect(requestMock).toHaveBeenCalledWith({
      url: '/habits/1/records/range',
      method: 'get',
      params: { startDate: '2026-06-01', endDate: '2026-06-30' },
    })
  })

  it('getTodayRecords: GET /habits/records/today', async () => {
    requestMock.mockResolvedValue([] as any)
    await getTodayRecords()
    expect(requestMock).toHaveBeenCalledWith({ url: '/habits/records/today', method: 'get' })
  })
})

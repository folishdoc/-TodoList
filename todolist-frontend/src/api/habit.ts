/**
 * 习惯打卡 API
 *
 * 习惯（Habit）模块的后端接口封装。支持习惯 CRUD、每日打卡/取消打卡、
 * 打卡记录查询（单习惯/日期范围/今日全局）。
 */
import request from '../utils/request'

// ── 习惯 CRUD ──

/** 获取所有习惯列表 */
export const getHabits = () => {
  return request({
    url: '/habits',
    method: 'get',
  })
}

/** 获取习惯详情 */
export const getHabitById = (id: number) => {
  return request({
    url: `/habits/${id}`,
    method: 'get',
  })
}

/** 创建习惯 */
export const createHabit = (data: any) => {
  return request({
    url: '/habits',
    method: 'post',
    data,
  })
}

/** 更新习惯信息 */
export const updateHabit = (id: number, data: any) => {
  return request({
    url: `/habits/${id}`,
    method: 'put',
    data,
  })
}

/** 删除习惯 */
export const deleteHabit = (id: number) => {
  return request({
    url: `/habits/${id}`,
    method: 'delete',
  })
}

// ── 打卡操作 ──

/** 打卡（创建一条当天的打卡记录） */
export const checkIn = (id: number, params: any) => {
  return request({
    url: `/habits/${id}/checkin`,
    method: 'post',
    params,
  })
}

/** 取消指定日期的打卡记录 */
export const cancelCheckIn = (id: number, checkDate: string) => {
  return request({
    url: `/habits/${id}/checkin`,
    method: 'delete',
    params: { checkDate },
  })
}

// ── 记录查询 ──

/** 获取习惯的全部打卡记录 */
export const getRecords = (id: number) => {
  return request({
    url: `/habits/${id}/records`,
    method: 'get',
  })
}

/** 获取日期范围内的打卡记录 */
export const getRecordsByRange = (id: number, startDate: string, endDate: string) => {
  return request({
    url: `/habits/${id}/records/range`,
    method: 'get',
    params: { startDate, endDate },
  })
}

/** 获取今日所有习惯的打卡记录 */
export const getTodayRecords = () => {
  return request({
    url: '/habits/records/today',
    method: 'get',
  })
}

/**
 * 纪念日 API
 *
 * 纪念日（Anniversary）模块所有后端接口封装。
 * 纪念日支持重复类型（每年/每月/每周/不重复）、提醒配置、标签、关联待办生成。
 *
 * 接口前缀：/anniversaries
 */
import request from '../utils/request'

// ── 基础 CRUD ──

/** 获取纪念日列表，支持搜索、标签筛选、排序 */
export const getAnniversaries = (params?: any) => {
  return request({
    url: '/anniversaries',
    method: 'get',
    params,
  })
}

/** 获取纪念日详情 */
export const getAnniversaryById = (id: number) => {
  return request({
    url: `/anniversaries/${id}`,
    method: 'get',
  })
}

/** 创建纪念日 */
export const createAnniversary = (data: any) => {
  return request({
    url: '/anniversaries',
    method: 'post',
    data,
  })
}

/** 更新纪念日 */
export const updateAnniversary = (id: number, data: any) => {
  return request({
    url: `/anniversaries/${id}`,
    method: 'put',
    data,
  })
}

/** 删除纪念日 */
export const deleteAnniversary = (id: number) => {
  return request({
    url: `/anniversaries/${id}`,
    method: 'delete',
  })
}

// ── 扩展功能 ──

/** 为纪念日生成关联待办任务（提前 remindDaysBefore 天） */
export const generateTodo = (id: number) => {
  return request({
    url: `/anniversaries/${id}/generate-todo`,
    method: 'post',
  })
}

/** 获取所有未读的纪念日提醒 */
export const getPendingReminders = () => {
  return request({
    url: '/anniversaries/pending-reminders',
    method: 'get',
  })
}

/** 标记提醒为已读 */
export const markReminderRead = (logId: number) => {
  return request({
    url: `/anniversaries/reminders/${logId}/read`,
    method: 'put',
  })
}

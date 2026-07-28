/**
 * 重复规则 API
 *
 * 任务循环重复规则的设置/取消/手动生成接口。
 * 支持 DAILY / WEEKLY / MONTHLY / YEARLY 四种循环类型。
 */
import request from '../utils/request'

/** 设置任务的循环规则（重复规则 JSON 对象） */
export const setRepeatRule = (taskId: number, rule: any) => {
  return request({
    url: `/tasks/repeat/${taskId}`,
    method: 'post',
    data: rule,
  })
}

/** 取消任务的循环规则 */
export const cancelRepeatRule = (taskId: number) => {
  return request({
    url: `/tasks/repeat/${taskId}`,
    method: 'delete',
  })
}

/** 手动触发重复任务生成（通常由后端定时任务自动执行，此接口仅供测试用） */
export const generateRepeatTasks = () => {
  return request({
    url: '/tasks/repeat/generate',
    method: 'post',
  })
}

import request from '../utils/request'

// 设置重复规则
export const setRepeatRule = (taskId: number, rule: any) => {
  return request({
    url: `/tasks/repeat/${taskId}`,
    method: 'post',
    data: rule,
  })
}

// 取消重复规则
export const cancelRepeatRule = (taskId: number) => {
  return request({
    url: `/tasks/repeat/${taskId}`,
    method: 'delete',
  })
}

// 手动生成重复任务（测试用）
export const generateRepeatTasks = () => {
  return request({
    url: '/tasks/repeat/generate',
    method: 'post',
  })
}

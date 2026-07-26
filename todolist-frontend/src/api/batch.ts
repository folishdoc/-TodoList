import request from '../utils/request'

// 执行批量操作
export const executeBatchOperation = (data: any) => {
  return request({
    url: '/tasks/batch/execute',
    method: 'post',
    data,
  })
}

// 批量完成
export const batchComplete = (taskIds: number[]) => {
  return request({
    url: '/tasks/batch/complete',
    method: 'post',
    data: { taskIds },
  })
}

// 批量删除
export const batchDelete = (taskIds: number[]) => {
  return request({
    url: '/tasks/batch/delete',
    method: 'post',
    data: { taskIds },
  })
}

// 批量移动
export const batchMove = (taskIds: number[], targetListId: number) => {
  return request({
    url: '/tasks/batch/move',
    method: 'post',
    data: { taskIds, targetListId },
  })
}

// 批量设置优先级
export const batchSetPriority = (taskIds: number[], priority: number) => {
  return request({
    url: '/tasks/batch/set-priority',
    method: 'post',
    data: { taskIds, priority },
  })
}

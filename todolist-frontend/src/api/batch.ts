import request from '../utils/request'

// 批量删除
export const batchDelete = (taskIds: number[]) => {
  return request({
    url: '/tasks/batch/delete',
    method: 'post',
    data: { taskIds },
  })
}



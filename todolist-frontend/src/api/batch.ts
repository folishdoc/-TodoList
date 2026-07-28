/**
 * 批量操作 API
 *
 * 任务批量操作的后端接口封装。支持批量删除（物理删除，不可恢复）。
 * 接口前缀：/tasks/batch
 */
import request from '../utils/request'

/** 批量删除任务（物理删除） */
export const batchDelete = (taskIds: number[]) => {
  return request({
    url: '/tasks/batch/delete',
    method: 'post',
    data: { taskIds },
  })
}



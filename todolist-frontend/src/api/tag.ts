/**
 * 标签 API
 *
 * 标签（Tag）模块的后端接口封装。支持标签 CRUD，
 * 以及任务与标签的多对多关系管理（添加/移除/查询）。
 */
import request from '../utils/request'

// ── 标签 CRUD ──

/** 创建标签 */
export const createTag = (data: any) => {
  return request({
    url: '/tags',
    method: 'post',
    data,
  })
}

/** 获取所有标签列表 */
export const getTags = () => {
  return request({
    url: '/tags',
    method: 'get',
  })
}

/** 更新标签名称或颜色 */
export const updateTag = (id: number, data: any) => {
  return request({
    url: `/tags/${id}`,
    method: 'put',
    data,
  })
}

/** 删除标签 */
export const deleteTag = (id: number) => {
  return request({
    url: `/tags/${id}`,
    method: 'delete',
  })
}

// ── 任务-标签关联 ──

/** 为任务添加标签 */
export const addTagToTask = (taskId: number, tagId: number) => {
  return request({
    url: `/tags/tasks/${taskId}`,
    method: 'post',
    params: { tagId },
  })
}

/** 移除任务的某个标签 */
export const removeTagFromTask = (taskId: number, tagId: number) => {
  return request({
    url: `/tags/tasks/${taskId}`,
    method: 'delete',
    params: { tagId },
  })
}

/** 获取任务的标签列表 */
export const getTaskTags = (taskId: number) => {
  return request({
    url: `/tags/tasks/${taskId}`,
    method: 'get',
  })
}

import request from '../utils/request'

// 创建标签
export const createTag = (data: any) => {
  return request({
    url: '/tags',
    method: 'post',
    data
  })
}

// 获取所有标签
export const getTags = () => {
  return request({
    url: '/tags',
    method: 'get'
  })
}

// 更新标签
export const updateTag = (id: number, data: any) => {
  return request({
    url: `/tags/${id}`,
    method: 'put',
    data
  })
}

// 删除标签
export const deleteTag = (id: number) => {
  return request({
    url: `/tags/${id}`,
    method: 'delete'
  })
}

// 为任务添加标签
export const addTagToTask = (taskId: number, tagId: number) => {
  return request({
    url: `/tags/tasks/${taskId}`,
    method: 'post',
    params: { tagId }
  })
}

// 移除任务标签
export const removeTagFromTask = (taskId: number, tagId: number) => {
  return request({
    url: `/tags/tasks/${taskId}`,
    method: 'delete',
    params: { tagId }
  })
}

// 获取任务的标签
export const getTaskTags = (taskId: number) => {
  return request({
    url: `/tags/tasks/${taskId}`,
    method: 'get'
  })
}

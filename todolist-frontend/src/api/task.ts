import request from '../utils/request'

// 获取任务列表
export const getTasks = (params: any) => {
  return request({
    url: '/tasks',
    method: 'get',
    params
  })
}

// 获取任务详情
export const getTaskById = (id: number) => {
  return request({
    url: `/tasks/${id}`,
    method: 'get'
  })
}

// 创建任务
export const createTask = (data: any) => {
  return request({
    url: '/tasks',
    method: 'post',
    data
  })
}

// 更新任务
export const updateTask = (id: number, data: any) => {
  return request({
    url: `/tasks/${id}`,
    method: 'put',
    data
  })
}

// 删除任务
export const deleteTask = (id: number) => {
  return request({
    url: `/tasks/${id}`,
    method: 'delete'
  })
}

// 完成任务
export const completeTask = (id: number) => {
  return request({
    url: `/tasks/${id}/complete`,
    method: 'patch'
  })
}

// 取消完成任务
export const uncompleteTask = (id: number) => {
  return request({
    url: `/tasks/${id}/uncomplete`,
    method: 'patch'
  })
}

// 获取今日任务
export const getTodayTasks = () => {
  return request({
    url: '/tasks/today',
    method: 'get'
  })
}

// 获取未来任务
export const getUpcomingTasks = () => {
  return request({
    url: '/tasks/upcoming',
    method: 'get'
  })
}

// 搜索任务
export const searchTasks = (params: any) => {
  return request({
    url: '/tasks/search',
    method: 'get',
    params
  })
}

// 获取子任务列表
export const getSubtasks = (id: number) => {
  return request({
    url: `/tasks/${id}/subtasks`,
    method: 'get'
  })
}

// 获取带子任务的任务列表
export const getTasksWithSubtasks = (params: any) => {
  return request({
    url: '/tasks/with-subtasks',
    method: 'get',
    params
  })
}

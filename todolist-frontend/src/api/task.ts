import request from '../utils/request'

// 获取任务列表
export const getTasks = (params: Record<string, any>) => {
  return request({
    url: '/tasks',
    method: 'get',
    params,
  })
}

// 创建任务
export const createTask = (data: Record<string, any>) => {
  return request({
    url: '/tasks',
    method: 'post',
    data,
  })
}

// 更新任务
export const updateTask = (id: number, data: Record<string, any>) => {
  return request({
    url: `/tasks/${id}`,
    method: 'put',
    data,
  })
}

// 删除任务
export const deleteTask = (id: number) => {
  return request({
    url: `/tasks/${id}`,
    method: 'delete',
  })
}

// 完成任务
export const completeTask = (id: number) => {
  return request({
    url: `/tasks/${id}/complete`,
    method: 'patch',
  })
}

// 取消完成任务
export const uncompleteTask = (id: number) => {
  return request({
    url: `/tasks/${id}/uncomplete`,
    method: 'patch',
  })
}

// 获取今日任务
export const getTodayTasks = () => {
  return request({
    url: '/tasks/today',
    method: 'get',
  })
}

// 获取未来任务
export const getUpcomingTasks = () => {
  return request({
    url: '/tasks/upcoming',
    method: 'get',
  })
}

// 获取子任务列表
export const getSubtasks = (id: number) => {
  return request({
    url: `/tasks/${id}/subtasks`,
    method: 'get',
  })
}

// 更新时间（拖拽修改开始/截止时间）
export const updateTaskTime = (id: number, data: Record<string, any>) => {
  return request({
    url: `/tasks/${id}/time`,
    method: 'patch',
    data,
  })
}

// 获取日期范围内的任务（日历视图用）
export const getTasksByDateRange = (start: string, end: string) => {
  return request({
    url: '/tasks/range',
    method: 'get',
    params: { start, end },
  })
}

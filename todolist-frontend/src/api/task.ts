/**
 * 任务 API
 *
 * 任务（Task）模块的后端接口封装。为核心模块，支持完整的 CRUD、
 * 完成/取消完成、今日/未来任务筛选、子任务查询、时间更新、日期范围查询。
 */
import request from '../utils/request'

// ── 基础 CRUD ──

/** 获取任务列表，支持分页、关键字搜索等参数 */
export const getTasks = (params: Record<string, any>) => {
  return request({
    url: '/tasks',
    method: 'get',
    params,
  })
}

/** 创建任务 */
export const createTask = (data: Record<string, any>) => {
  return request({
    url: '/tasks',
    method: 'post',
    data,
  })
}

/** 更新任务（标题、描述、优先级、时间等） */
export const updateTask = (id: number, data: Record<string, any>) => {
  return request({
    url: `/tasks/${id}`,
    method: 'put',
    data,
  })
}

/** 删除任务 */
export const deleteTask = (id: number) => {
  return request({
    url: `/tasks/${id}`,
    method: 'delete',
  })
}

// ── 状态操作 ──

/** 完成任务 */
export const completeTask = (id: number) => {
  return request({
    url: `/tasks/${id}/complete`,
    method: 'patch',
  })
}

/** 取消完成任务 */
export const uncompleteTask = (id: number) => {
  return request({
    url: `/tasks/${id}/uncomplete`,
    method: 'patch',
  })
}

// ── 筛选查询 ──

/** 获取今日截止的任务 */
export const getTodayTasks = () => {
  return request({
    url: '/tasks/today',
    method: 'get',
  })
}

/** 获取未来（今日之后）的任务 */
export const getUpcomingTasks = () => {
  return request({
    url: '/tasks/upcoming',
    method: 'get',
  })
}

// ── 子任务 ──

/** 获取某任务的子任务列表（parentId = taskId） */
export const getSubtasks = (id: number) => {
  return request({
    url: `/tasks/${id}/subtasks`,
    method: 'get',
  })
}

// ── 时间操作 ──

/** 更新时间（日历拖拽操作时调用） */
export const updateTaskTime = (id: number, data: Record<string, any>) => {
  return request({
    url: `/tasks/${id}/time`,
    method: 'patch',
    data,
  })
}

/** 获取日期范围内的任务（日历视图用） */
export const getTasksByDateRange = (start: string, end: string) => {
  return request({
    url: '/tasks/range',
    method: 'get',
    params: { start, end },
  })
}

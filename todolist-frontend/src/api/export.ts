import request from '../utils/request'

// 导出CSV
export const exportTasksCsv = () => {
  return request({
    url: '/export/tasks/csv',
    method: 'get',
    responseType: 'blob'
  })
}

// 导出JSON
export const exportTasksJson = () => {
  return request({
    url: '/export/tasks/json',
    method: 'get',
    responseType: 'blob'
  })
}

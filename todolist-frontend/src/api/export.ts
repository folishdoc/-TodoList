/**
 * 导出 API
 *
 * 任务数据导出接口封装。支持 CSV 和 JSON 两种格式，
 * 后端返回文件（Blob）供浏览器下载。
 * 接口前缀：/export/tasks
 */
import request from '../utils/request'

/** 导出全量任务为 CSV 文件（blob） */
export const exportTasksCsv = () => {
  return request({
    url: '/export/tasks/csv',
    method: 'get',
    responseType: 'blob',
  })
}

/** 导出全量任务为 JSON 文件（blob） */
export const exportTasksJson = () => {
  return request({
    url: '/export/tasks/json',
    method: 'get',
    responseType: 'blob',
  })
}

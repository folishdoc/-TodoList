/**
 * 统计 API
 *
 * 数据统计模块的后端接口封装。提供任务总体统计、按清单/优先级分布、日维度趋势数据。
 */
import request from '../utils/request'

/** 获取总体统计概览（总数、已完成、待完成、完成率等） */
export const getOverview = () => {
  return request({
    url: '/statistics/overview',
    method: 'get',
  })
}

/** 获取按清单分布的任务数 */
export const getByList = () => {
  return request({
    url: '/statistics/by-list',
    method: 'get',
  })
}

/** 获取按优先级分布的任务数 */
export const getByPriority = () => {
  return request({
    url: '/statistics/by-priority',
    method: 'get',
  })
}

/** 获取近 N 天的任务创建/完成趋势数据 */
export const getTrend = (days: number = 7) => {
  return request({
    url: '/statistics/trend',
    method: 'get',
    params: { days },
  })
}

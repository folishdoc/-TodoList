import request from '../utils/request'

// 获取总体统计
export const getOverview = () => {
  return request({
    url: '/statistics/overview',
    method: 'get',
  })
}

// 获取按清单分布
export const getByList = () => {
  return request({
    url: '/statistics/by-list',
    method: 'get',
  })
}

// 获取按优先级分布
export const getByPriority = () => {
  return request({
    url: '/statistics/by-priority',
    method: 'get',
  })
}

// 获取任务趋势
export const getTrend = (days: number = 7) => {
  return request({
    url: '/statistics/trend',
    method: 'get',
    params: { days },
  })
}

import request from '../utils/request'

// 获取清单列表
export const getLists = () => {
  return request({
    url: '/lists',
    method: 'get'
  })
}

// 获取清单详情
export const getListById = (id: number) => {
  return request({
    url: `/lists/${id}`,
    method: 'get'
  })
}

// 创建清单
export const createList = (data: any) => {
  return request({
    url: '/lists',
    method: 'post',
    data
  })
}

// 更新清单
export const updateList = (id: number, data: any) => {
  return request({
    url: `/lists/${id}`,
    method: 'put',
    data
  })
}

// 删除清单
export const deleteList = (id: number) => {
  return request({
    url: `/lists/${id}`,
    method: 'delete'
  })
}

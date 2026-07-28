/**
 * 清单 API
 *
 * 任务清单（List）模块的后端接口封装。
 * 清单仅用于分类任务（不存储具体任务），支持 CRUD。
 */
import request from '../utils/request'

/** 获取所有清单列表 */
export const getLists = () => {
  return request({
    url: '/lists',
    method: 'get',
  })
}

/** 创建清单 */
export const createList = (data: any) => {
  return request({
    url: '/lists',
    method: 'post',
    data,
  })
}

/** 更新清单信息 */
export const updateList = (id: number, data: any) => {
  return request({
    url: `/lists/${id}`,
    method: 'put',
    data,
  })
}

/** 删除清单（该清单下任务不会被删除，仅 listId 置空） */
export const deleteList = (id: number) => {
  return request({
    url: `/lists/${id}`,
    method: 'delete',
  })
}

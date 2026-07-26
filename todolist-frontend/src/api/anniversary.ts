import request from '../utils/request'

// 获取纪念日列表
export const getAnniversaries = (params?: any) => {
  return request({
    url: '/anniversaries',
    method: 'get',
    params,
  })
}

// 获取纪念日详情
export const getAnniversaryById = (id: number) => {
  return request({
    url: `/anniversaries/${id}`,
    method: 'get',
  })
}

// 创建纪念日
export const createAnniversary = (data: any) => {
  return request({
    url: '/anniversaries',
    method: 'post',
    data,
  })
}

// 更新纪念日
export const updateAnniversary = (id: number, data: any) => {
  return request({
    url: `/anniversaries/${id}`,
    method: 'put',
    data,
  })
}

// 删除纪念日
export const deleteAnniversary = (id: number) => {
  return request({
    url: `/anniversaries/${id}`,
    method: 'delete',
  })
}

// 生成关联待办
export const generateTodo = (id: number) => {
  return request({
    url: `/anniversaries/${id}/generate-todo`,
    method: 'post',
  })
}

// 获取未读提醒
export const getPendingReminders = () => {
  return request({
    url: '/anniversaries/pending-reminders',
    method: 'get',
  })
}

// 标记提醒已读
export const markReminderRead = (logId: number) => {
  return request({
    url: `/anniversaries/reminders/${logId}/read`,
    method: 'put',
  })
}

import request from '../utils/request'

// 获取用户信息（个人版本可选）
export const getUserInfo = () => {
  return request({
    url: '/auth/profile',
    method: 'get'
  })
}

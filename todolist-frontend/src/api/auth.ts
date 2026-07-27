import request from '../utils/request'

export interface LoginResponse {
  token: string
  userId: number
  username: string
  displayName: string
}

/** 用户名+密码登录 */
export async function loginApi(username: string, password: string) {
  const res = await request.post('/auth/login', { username, password })
  return (res as any).data as LoginResponse
}

/** 注册 */
export async function registerApi(username: string, password: string, displayName?: string) {
  const res = await request.post('/auth/register', { username, password, displayName })
  return (res as any).data as LoginResponse
}

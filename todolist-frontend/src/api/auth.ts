/**
 * 认证 API
 *
 * 登录/注册接口封装。后端返回 `LoginResponse`（含 JWT token、用户信息）。
 * 当前为单用户模式，但保留了完整的登录注册流程。
 */
import request from '../utils/request'

/** 登录成功后端返回的数据结构 */
export interface LoginResponse {
  token: string
  userId: number
  username: string
  displayName: string
}

/** 用户名+密码登录，返回 token 和用户信息 */
export async function loginApi(username: string, password: string) {
  const res = await request.post('/auth/login', { username, password })
  return (res as any).data as LoginResponse
}

/** 注册新用户，可选 displayName */
export async function registerApi(username: string, password: string, displayName?: string) {
  const res = await request.post('/auth/register', { username, password, displayName })
  return (res as any).data as LoginResponse
}

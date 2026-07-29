/**
 * Axios HTTP 请求实例
 *
 * 封装统一的前端 HTTP 客户端：
 * - baseURL 从 `VITE_API_BASE_URL` 环境变量读取
 * - 请求拦截器自动注入 Bearer token（来源：localStorage）
 * - 响应拦截器自动解包 `Result<T>` 统一响应格式（检查 res.code === 200）
 * - blob/arraybuffer 响应直接返回原始 data
 * - 401 时自动清除过期 token 并重定向到 /login
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

/**
 * 重定向到登录页
 * 使用 window.location.hash 避免直接依赖 router 实例（防止循环依赖）
 * 已在登录页时跳过，防止反复跳转
 */
function redirectToLogin() {
  if (window.location.hash.startsWith('#/login')) return
  window.location.hash = '#/login'
}

/** 清除 localStorage 中的会话数据 */
function clearSession() {
  localStorage.removeItem('jwt_token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('username')
  localStorage.removeItem('display_name')
}

// ── 请求拦截器 — 注入 Bearer token ────────────────────
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── 响应拦截器 — 解包 Result<T> / 处理 401 ────────────
request.interceptors.response.use(
  (response: import('axios').AxiosResponse) => {
    // 非 JSON 响应（文件下载等），直接返回二进制数据
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response.data
    }
    const res = response.data
    // 业务状态码非 200 视为失败
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error?.response?.status === 401) {
      clearSession()
      redirectToLogin()
      ElMessage.error('登录已过期，请重新登录')
      return Promise.reject(error)
    }
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  },
)

export default request

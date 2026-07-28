/**
 * Axios HTTP 请求实例
 *
 * 封装统一的前端 HTTP 客户端：
 * - baseURL 从 `VITE_API_BASE_URL` 环境变量读取
 * - 响应拦截器自动解包 `Result<T>` 统一响应格式（检查 res.code === 200）
 * - blob/arraybuffer 响应直接返回原始 data
 * - 请求/响应异常时通过 Element Plus 的 ElMessage 弹出提示
 *
 * 当前为单用户模式，请求头无需携带认证信息（后端通过个人 Token 拦截器注入 userId=1）。
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

// 请求拦截器 — 单用户模式，无需携带认证 token
request.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器 — 自动解包 Result<T> 或返回二进制数据
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
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  },
)

export default request

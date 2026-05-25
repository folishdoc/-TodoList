import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: 'http://localhost:18080/api',
  timeout: 10000
})

// 请求拦截器 - 个人使用，使用固定token
request.interceptors.request.use(
  (config) => {
    // 使用配置的personal token（与后端app.personal.token保持一致）
    config.headers.Authorization = `Bearer dev-personal-token-2026-secure-key`
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: any) => {
    // 对于 blob 等非 JSON 响应，直接返回 data
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response.data
    }
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      ElMessage.error('认证失败，请检查后端服务')
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request

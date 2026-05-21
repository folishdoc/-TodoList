import { ElMessage } from 'element-plus'
import axios from 'axios'

/**
 * 统一错误处理
 */
export const handleError = (error: any, defaultMessage: string = '操作失败') => {
  // 取消操作不显示错误
  if (error === 'cancel') {
    return
  }
  
  // Axios错误
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = error.response?.data?.message
    
    switch (status) {
      case 400:
        ElMessage.error(message || '请求参数错误')
        break
      case 401:
        ElMessage.error('认证失败，请检查后端服务')
        break
      case 403:
        ElMessage.error('没有权限执行此操作')
        break
      case 404:
        ElMessage.error('资源不存在')
        break
      case 500:
        ElMessage.error(message || '服务器内部错误')
        break
      default:
        ElMessage.error(message || defaultMessage)
    }
  } else if (error instanceof Error) {
    ElMessage.error(error.message || defaultMessage)
  } else {
    ElMessage.error(defaultMessage)
  }
  
  console.error('Error:', error)
}

/**
 * 成功提示
 */
export const handleSuccess = (message: string = '操作成功') => {
  ElMessage.success(message)
}

/**
 * 警告提示
 */
export const handleWarning = (message: string = '请注意') => {
  ElMessage.warning(message)
}

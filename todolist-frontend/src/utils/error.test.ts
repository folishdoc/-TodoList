import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ElMessage } from 'element-plus'
import { handleError, handleSuccess, handleWarning } from './error'

// Mock axios.isAxiosError as a configurable function
const isAxiosErrorMock = vi.fn()
vi.mock('axios', () => ({
  default: { isAxiosError: (...args: unknown[]) => isAxiosErrorMock(...args) },
  isAxiosError: (...args: unknown[]) => isAxiosErrorMock(...args),
}))

describe('utils/error.ts', () => {
  beforeEach(() => {
    isAxiosErrorMock.mockReset()
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('handleError', () => {
    it('skips "cancel" silently', () => {
      handleError('cancel')
      expect(ElMessage.error).not.toHaveBeenCalled()
    })

    it('shows "请求参数错误" on 400', () => {
      isAxiosErrorMock.mockReturnValue(true)
      const err: any = { response: { status: 400, data: { message: '参数错误' } } }
      handleError(err)
      expect(ElMessage.error).toHaveBeenCalledWith('参数错误')
    })

    it('falls back to generic 400 message', () => {
      isAxiosErrorMock.mockReturnValue(true)
      const err: any = { response: { status: 400, data: {} } }
      handleError(err)
      expect(ElMessage.error).toHaveBeenCalledWith('请求参数错误')
    })

    it('shows "认证失败" on 401', () => {
      isAxiosErrorMock.mockReturnValue(true)
      const err: any = { response: { status: 401, data: {} } }
      handleError(err)
      expect(ElMessage.error).toHaveBeenCalledWith('认证失败，请检查后端服务')
    })

    it('shows "没有权限" on 403', () => {
      isAxiosErrorMock.mockReturnValue(true)
      const err: any = { response: { status: 403, data: {} } }
      handleError(err)
      expect(ElMessage.error).toHaveBeenCalledWith('没有权限执行此操作')
    })

    it('shows "资源不存在" on 404', () => {
      isAxiosErrorMock.mockReturnValue(true)
      const err: any = { response: { status: 404, data: {} } }
      handleError(err)
      expect(ElMessage.error).toHaveBeenCalledWith('资源不存在')
    })

    it('shows server error on 500 with message', () => {
      isAxiosErrorMock.mockReturnValue(true)
      const err: any = { response: { status: 500, data: { message: 'DB down' } } }
      handleError(err)
      expect(ElMessage.error).toHaveBeenCalledWith('DB down')
    })

    it('falls back to default for unknown status', () => {
      isAxiosErrorMock.mockReturnValue(true)
      const err: any = { response: { status: 418, data: { message: 'I am a teapot' } } }
      handleError(err)
      expect(ElMessage.error).toHaveBeenCalledWith('I am a teapot')
    })

    it('uses default message for unknown axios status', () => {
      isAxiosErrorMock.mockReturnValue(true)
      const err: any = { response: { status: 418, data: {} } }
      handleError(err, '自定义默认')
      expect(ElMessage.error).toHaveBeenCalledWith('自定义默认')
    })

    it('falls back to err.message for non-axios Error', () => {
      isAxiosErrorMock.mockReturnValue(false)
      handleError(new Error('boom'))
      expect(ElMessage.error).toHaveBeenCalledWith('boom')
    })

    it('falls back to default for non-Error, non-axios input', () => {
      isAxiosErrorMock.mockReturnValue(false)
      handleError('something else')
      expect(ElMessage.error).toHaveBeenCalledWith('操作失败')
    })
  })

  describe('handleSuccess', () => {
    it('shows default success message', () => {
      handleSuccess()
      expect(ElMessage.success).toHaveBeenCalledWith('操作成功')
    })

    it('shows custom success message', () => {
      handleSuccess('任务已创建')
      expect(ElMessage.success).toHaveBeenCalledWith('任务已创建')
    })
  })

  describe('handleWarning', () => {
    it('shows default warning', () => {
      handleWarning()
      expect(ElMessage.warning).toHaveBeenCalledWith('请注意')
    })

    it('shows custom warning', () => {
      handleWarning('小心')
      expect(ElMessage.warning).toHaveBeenCalledWith('小心')
    })
  })
})

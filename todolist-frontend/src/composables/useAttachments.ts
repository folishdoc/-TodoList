/**
 * useAttachments — 附件管理逻辑
 *
 * 封装任务附件的上传、下载、删除操作。
 * 上传限制 10MB，上传后自动刷新附件列表。
 */
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as attachmentApi from '../api/attachment'
import { formatFileSize } from './useTimeUtils'

export function useAttachments() {
  // ── 状态 ──
  const taskAttachments = ref<any[]>([])
  const attachmentUploading = ref(false)
  const fileInputRef = ref<HTMLInputElement>()

  // ── 方法 ──

  /** 触发隐藏 file input 的点击事件 */
  const triggerFileUpload = () => {
    fileInputRef.value?.click()
  }

  /** 处理文件选择（上传后刷新列表） */
  const handleFileSelect = async (event: Event, editingTask: any) => {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0 || !editingTask) return
    const file = input.files[0]
    // 限制 10MB
    if (file.size > 10 * 1024 * 1024) {
      ElMessage.warning('文件大小不能超过 10MB')
      return
    }
    attachmentUploading.value = true
    try {
      await attachmentApi.uploadFile(editingTask.id, file)
      ElMessage.success('上传成功')
      const res = await attachmentApi.getTaskAttachments(editingTask.id)
      taskAttachments.value = res.data || []
    } catch {
      ElMessage.error('上传失败')
    } finally {
      attachmentUploading.value = false
      input.value = ''
    }
  }

  /** 通过创建隐藏的 <a> 标签触发浏览器下载 */
  const downloadAttachment = (att: any) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:18080/api'
    const url = `${baseUrl}/attachments/${encodeURIComponent(att.fileName)}`
    const a = document.createElement('a')
    a.href = url
    a.download = att.fileName
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  /** 确认后删除附件，并从列表中移除 */
  const handleDeleteAttachment = async (att: any, editingTask: any) => {
    if (!editingTask) return
    try {
      await ElMessageBox.confirm('确定要删除这个附件吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await attachmentApi.deleteAttachment(att.id)
      taskAttachments.value = taskAttachments.value.filter((a: any) => a.id !== att.id)
      ElMessage.success('附件已删除')
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除附件失败:', error)
      }
    }
  }

  return {
    taskAttachments,
    attachmentUploading,
    fileInputRef,
    triggerFileUpload,
    handleFileSelect,
    downloadAttachment,
    handleDeleteAttachment,
  }
}

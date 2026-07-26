import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as attachmentApi from '../api/attachment'
import { formatFileSize } from './useTimeUtils'

export function useAttachments() {
  const taskAttachments = ref<any[]>([])
  const attachmentUploading = ref(false)
  const fileInputRef = ref<HTMLInputElement>()

  const triggerFileUpload = () => {
    fileInputRef.value?.click()
  }

  const handleFileSelect = async (event: Event, editingTask: any) => {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0 || !editingTask) return
    const file = input.files[0]
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

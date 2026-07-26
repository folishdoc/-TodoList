import request from '../utils/request'

// 上传文件
export const uploadFile = (taskId: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return request({
    url: `/attachments/tasks/${taskId}`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// 获取任务附件列表
export const getTaskAttachments = (taskId: number) => {
  return request({
    url: `/attachments/tasks/${taskId}`,
    method: 'get',
  })
}

// 删除附件
export const deleteAttachment = (attachmentId: number) => {
  return request({
    url: `/attachments/${attachmentId}`,
    method: 'delete',
  })
}

// 下载附件
export const downloadAttachment = (fileName: string) => {
  return request({
    url: `/attachments/${fileName}`,
    method: 'get',
    responseType: 'blob',
  })
}

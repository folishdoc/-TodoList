/**
 * 附件 API
 *
 * 任务附件（Attachment）模块的后端接口封装。
 * 支持文件上传、列表查询、删除、下载。上传后后端将文件存储到指定目录。
 */
import request from '../utils/request'

/** 上传文件到指定任务（仅支持单文件，最大 10MB） */
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

/** 获取任务的附件列表 */
export const getTaskAttachments = (taskId: number) => {
  return request({
    url: `/attachments/tasks/${taskId}`,
    method: 'get',
  })
}

/** 删除指定附件 */
export const deleteAttachment = (attachmentId: number) => {
  return request({
    url: `/attachments/${attachmentId}`,
    method: 'delete',
  })
}

/** 下载附件（返回 blob 二进制数据） */
export const downloadAttachment = (fileName: string) => {
  return request({
    url: `/attachments/${fileName}`,
    method: 'get',
    responseType: 'blob',
  })
}

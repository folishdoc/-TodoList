import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestMock = vi.fn()
vi.mock('../utils/request', () => ({
  default: (...args: unknown[]) => requestMock(...args),
}))

import { uploadFile, getTaskAttachments, deleteAttachment, downloadAttachment } from './attachment'

describe('api/attachment.ts', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('uploadFile: POST /attachments/tasks/{id} with FormData and multipart header', async () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    requestMock.mockResolvedValue({ id: 1, url: 'uploads/test.txt' } as any)
    await uploadFile(7, file)
    const [config] = requestMock.mock.calls[0]
    expect(config.url).toBe('/attachments/tasks/7')
    expect(config.method).toBe('post')
    expect(config.data).toBeInstanceOf(FormData)
    expect((config.data as FormData).get('file')).toBe(file)
    expect(config.headers).toEqual({ 'Content-Type': 'multipart/form-data' })
  })

  it('getTaskAttachments: GET /attachments/tasks/{id}', async () => {
    requestMock.mockResolvedValue([] as any)
    await getTaskAttachments(3)
    expect(requestMock).toHaveBeenCalledWith({ url: '/attachments/tasks/3', method: 'get' })
  })

  it('deleteAttachment: DELETE /attachments/{attachmentId}', async () => {
    requestMock.mockResolvedValue({} as any)
    await deleteAttachment(42)
    expect(requestMock).toHaveBeenCalledWith({ url: '/attachments/42', method: 'delete' })
  })

  it('downloadAttachment: GET /attachments/{fileName} with blob responseType', async () => {
    requestMock.mockResolvedValue(new Blob(['data']) as any)
    await downloadAttachment('report.pdf')
    expect(requestMock).toHaveBeenCalledWith({
      url: '/attachments/report.pdf',
      method: 'get',
      responseType: 'blob',
    })
  })
})

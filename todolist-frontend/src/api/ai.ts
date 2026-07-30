/**
 * AI 智能任务解析 API
 *
 * 将自然语言描述解析为结构化任务字段。
 * 后端 POST /api/ai/parse-task，返回 ParsedTask。
 */
import request from '../utils/request'

/** AI 解析返回的结构化任务 */
export interface ParsedTask {
  title: string
  description: string
  priority: number
  dueDate: string
  startDate: string
  listName: string
  tags: string[]
}

/**
 * 解析自然语言为任务字段
 * @param input 自然语言描述
 * @returns 解析后的结构化任务
 */
export const parseTask = (input: string): Promise<ParsedTask> => {
  return request({
    url: '/ai/parse-task',
    method: 'post',
    data: { input },
  }).then((res: any) => res.data)
}

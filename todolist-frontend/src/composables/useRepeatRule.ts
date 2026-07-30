/**
 * useRepeatRule — 共享循环规则逻辑
 *
 * 提供循环规则的文本描述生成（如"每天"、"每2周"等）和类型翻译。
 * 循环规则以 JSON 字符串形式存在 Task.repeatRule 字段中。
 */
import type { Task } from '../types'

/**
 * 将 JSON 格式的循环规则解析为可读文本
 * 支持 DAILY / WEEKLY / MONTHLY / YEARLY 四种类型
 * 可选显示本次实例的截止日期和规则结束日期
 */
export function getRepeatLabel(repeatRuleJson: string, task?: Partial<Task>): string {
  try {
    const rule = JSON.parse(repeatRuleJson)
    const labels: Record<string, string> = {
      DAILY: '每天',
      WEEKLY: '每周',
      MONTHLY: '每月',
      YEARLY: '每年',
    }
    let label = labels[rule.type] || rule.type
    if (rule.interval > 1) label = `每${rule.interval}${getRepeatTypeText(rule.type)}`
    // 显示本次实例截止日期
    if (task?.dueDate) {
      const due = new Date(task.dueDate)
      const month = String(due.getMonth() + 1).padStart(2, '0')
      const day = String(due.getDate()).padStart(2, '0')
      const hasTime = due.getHours() !== 0 || due.getMinutes() !== 0
      if (hasTime) {
        label += ` · ${month}/${day} ${String(due.getHours()).padStart(2, '0')}:${String(due.getMinutes()).padStart(2, '0')}`
      } else {
        label += ` · ${month}/${day}`
      }
    }
    if (rule.endDate) {
      const end = new Date(rule.endDate)
      label += `（至${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}）`
    }
    return label
  } catch (e) { console.warn('解析循环规则失败', e); return '循环' }
}

export function getRepeatTypeText(type: string): string {
  const texts: Record<string, string> = { DAILY: '天', WEEKLY: '周', MONTHLY: '月', YEARLY: '年' }
  return texts[type] || ''
}

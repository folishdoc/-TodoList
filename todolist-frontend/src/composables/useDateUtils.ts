/**
 * useDateUtils — 共享日期工具函数
 *
 * 提供任务过期判断、日期格式化、时间值检查等通用日期相关功能。
 * 注意与 useCalendarGrid 中的 isOverdue 不同：此版本按天比较截止日（不含当天，仅严格早于今天视为过期），
 * 而 CalendarGrid 版本按精确时间比较。
 */

/**
 * 判断任务是否已过期
 * 规则：状态非已完成、有截止日、截止日 < 当天 00:00 则视为过期（当天截止不算过期）
 */
export function isOverdue(task: any): boolean {
  if (task.status === 1) return false
  if (!task.dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDay = new Date(task.dueDate)
  dueDay.setHours(0, 0, 0, 0)
  return dueDay < today
}

/** 格式化日期为 MM/DD 短格式 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

/** 格式化为 MM/DD 或 MM/DD HH:mm（含时间时） */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  if (hasTime) {
    return `${month}/${day} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${month}/${day}`
}

/** 检查日期字符串是否包含非零时间分量（HH:mm:ss 不全为零） */
export function hasTimeValue(dateStr: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0
}

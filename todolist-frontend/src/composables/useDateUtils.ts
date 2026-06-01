// 共享日期工具函数

export function isOverdue(task: any): boolean {
  if (task.status === 1) return false
  if (!task.dueDate) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dueDay = new Date(task.dueDate); dueDay.setHours(0, 0, 0, 0)
  return dueDay <= today
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

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

export function hasTimeValue(dateStr: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0
}

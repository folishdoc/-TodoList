// 共享优先级工具

export function getPriorityType(priority: number): string {
  const types: Record<number, string> = { 0: '', 1: 'info', 2: 'warning', 3: 'danger' }
  return types[priority] || ''
}

export function getPriorityText(priority: number): string {
  const texts: Record<number, string> = { 0: '无', 1: '低', 2: '中', 3: '高' }
  return texts[priority] || '无'
}

export function priorityClass(priority: number): string {
  if (priority === 3) return 'pri-high'
  if (priority === 1) return 'pri-low'
  return ''
}

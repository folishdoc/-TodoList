/**
 * usePriority — 共享优先级工具
 *
 * 提供优先级到 Element Plus 标签类型、中文文本、CSS 类名的映射。
 * 优先级值：0=无 1=低 2=中 3=高
 */

/** 优先级 → Element Plus tag type（用于 el-tag 颜色） */
export function getPriorityType(priority: number): string {
  const types: Record<number, string> = { 0: '', 1: 'info', 2: 'warning', 3: 'danger' }
  return types[priority] || ''
}

/** 优先级 → 中文文本 */
export function getPriorityText(priority: number): string {
  const texts: Record<number, string> = { 0: '无', 1: '低', 2: '中', 3: '高' }
  return texts[priority] || '无'
}

/** 优先级 → CSS class（用于 Widget 视图的优先级样式） */
export function priorityClass(priority: number): string {
  if (priority === 3) return 'pri-high'
  if (priority === 1) return 'pri-low'
  return ''
}

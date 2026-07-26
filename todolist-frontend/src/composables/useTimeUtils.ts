import { marked } from 'marked'
import type { Task } from '../types'
import { formatDateShort, hasTimeValue } from './useDateUtils'
import { getRepeatLabel } from './useRepeatRule'

export function getTimeStatus(task: Partial<Task>) {
  if (!task.startDate && !task.dueDate) return ''
  if (task.status === 1) return ''

  // 循环任务：startDate = dueDate（周期基准日期），仅基于 dueDate 显示循环进度
  if (task.repeatRule) {
    if (!task.dueDate) return ''
    const dueDate = new Date(task.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDay = new Date(dueDate)
    dueDay.setHours(0, 0, 0, 0)
    const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return '循环 · 过期'
    if (diffDays === 0) return '循环 · 今天'
    return `循环 · 还剩 ${diffDays} 天`
  }

  const now = new Date()
  const startDate = task.startDate ? new Date(task.startDate) : null
  const dueDate = task.dueDate ? new Date(task.dueDate) : null

  const dueHasTime = dueDate && (dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0)
  const startHasTime = startDate && (startDate.getHours() !== 0 || startDate.getMinutes() !== 0)
  const isCrossDay = startDate && dueDate && startDate.toDateString() !== dueDate.toDateString()

  if (!dueHasTime && !startHasTime) return ''

  if (startDate && now < startDate) {
    const diff = startDate.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return `${days}天后开始`
  }

  if (dueDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDay = new Date(dueDate)
    dueDay.setHours(0, 0, 0, 0)
    const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (isCrossDay || !dueHasTime) {
      if (diffDays === 0) return '今天'
      if (diffDays > 0) return `${diffDays}天后结束`
      return `过期${Math.abs(diffDays)}天`
    }

    const diffMs = now.getTime() - dueDate.getTime()
    const absMs = Math.abs(diffMs)
    const days = Math.floor(absMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60))
    if (diffMs > 0) {
      if (days > 0) return `过期${days}天${hours}小时`
      if (hours > 0) return `过期${hours}小时${mins}分钟`
      return `过期${mins}分钟`
    } else {
      if (days > 0) return `${days}天后结束`
      if (hours > 0) return `${hours}小时${mins}分钟后`
      return `${mins}分钟后`
    }
  }

  return ''
}

export function getTimeStatusClass(task: Partial<Task>) {
  if (!getTimeStatus(task)) return ''

  const now = new Date()
  const startDate = task.startDate ? new Date(task.startDate) : null
  const dueDate = task.dueDate ? new Date(task.dueDate) : null

  if (startDate && now < startDate) return 'time-status-upcoming'

  if (dueDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDay = new Date(dueDate)
    dueDay.setHours(0, 0, 0, 0)
    if (dueDay < today) return 'time-status-overdue'
    if (dueDay > today) return 'time-status-active'
    return 'time-status-today'
  }

  return ''
}

export function getDueDaysBadge(task: Partial<Task>) {
  if (!task.dueDate) return { text: '', type: 'empty' as const }
  if (task.status === 1) return { text: '', type: 'empty' as const }

  const now = new Date()
  const startDate = task.startDate ? new Date(task.startDate) : null
  if (startDate && now < startDate) return { text: '', type: 'empty' as const }

  const dueDate = new Date(task.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDay = new Date(dueDate)
  dueDay.setHours(0, 0, 0, 0)
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { text: `已过期 ${Math.abs(diffDays)} 天`, type: 'overdue' as const }
  if (diffDays === 0) return { text: '今天到期', type: 'today' as const }
  return { text: `还剩 ${diffDays} 天`, type: 'upcoming' as const }
}

export function getDueDaysClass(task: Partial<Task>) {
  const type = getDueDaysBadge(task).type
  return type === 'empty' ? '' : `due-days-badge-${type}`
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function renderMarkdown(text: string) {
  if (!text) return ''
  try {
    return marked(text, { breaks: true, gfm: true }) as string
  } catch (e) {
    console.warn('渲染 Markdown 失败', e)
    return text
  }
}

export function getTimeSummary(taskForm: Record<string, any>, editingTask: Record<string, any>) {
  const hasStart = taskForm.startDate
  const hasDue = taskForm.dueDate
  const hasRepeat = editingTask?.repeatRule

  if (!hasStart && !hasDue && !hasRepeat) return '时间'

  const parts: string[] = []
  if (hasStart) parts.push(formatDateShort(taskForm.startDate))
  if (hasDue) parts.push(formatDateShort(taskForm.dueDate))

  let summary = parts.join(' ~ ')

  if (hasRepeat) {
    const label = getRepeatLabel(editingTask.repeatRule, editingTask)
    summary = summary ? `${summary} · ${label}` : label
  }

  return summary || '时间'
}

export function getCreateTimeSummary(taskForm: Record<string, any>, repeatForm: Record<string, any>) {
  const hasStart = taskForm.startDate
  const hasDue = taskForm.dueDate
  const hasRepeat = repeatForm.type

  if (!hasStart && !hasDue && !hasRepeat) return '设置时间'

  const parts: string[] = []
  if (hasStart) parts.push(formatDateShort(taskForm.startDate))
  if (hasDue) parts.push(formatDateShort(taskForm.dueDate))
  let summary = parts.join(' ~ ')

  if (hasRepeat) {
    const labels: Record<string, string> = { DAILY: '每天', WEEKLY: '每周', MONTHLY: '每月', YEARLY: '每年' }
    const label = labels[repeatForm.type] || repeatForm.type
    summary = summary ? `${summary} · ${label}` : label
  }

  return summary || '设置时间'
}

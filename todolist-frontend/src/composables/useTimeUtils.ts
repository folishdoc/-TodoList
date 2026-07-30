/**
 * useTimeUtils — 时间状态、文件大小、Markdown 渲染等综合工具
 *
 * 提供任务的时间状态文本/CSS class/剩余天数徽章、文件大小格式化、
 * Markdown 渲染、时间摘要生成等函数。Dashboard 视图中的时间标签和过期间检查依赖此模块。
 */
import { marked } from 'marked'
import type { Task } from '../types'
import { formatDateShort, hasTimeValue } from './useDateUtils'
import { getRepeatLabel } from './useRepeatRule'

/**
 * 获取任务的时间状态文本
 * 综合考虑：循环任务状态、开始时间、截止时间、过期情况、精确到分钟的倒计时
 * 返回值示例："" | "循环 · 今天" | "2天后开始" | "过期1天3小时" | "30分钟后"
 */
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

/**
 * 获取时间状态的 CSS class 名称
 * - upcoming: 尚未开始
 * - overdue: 已过期
 * - active: 进行中
 * - today: 今天截止
 */
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

/**
 * 获取剩余天数徽章数据（文本 + 类型）
 * 类型用于 CSS 颜色控制：empty | overdue | today | upcoming
 * 徽章显示如："已过期 3 天" / "今天到期" / "还剩 5 天"
 */
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

/** 获取剩余天数徽章的 CSS class */
export function getDueDaysClass(task: Partial<Task>) {
  const type = getDueDaysBadge(task).type
  return type === 'empty' ? '' : `due-days-badge-${type}`
}

/** 将字节数格式化为可读文件大小（B / KB / MB） */
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/** 使用 marked 库渲染 Markdown 文本为 HTML */
export function renderMarkdown(text: string) {
  if (!text) return ''
  try {
    return marked(text, { breaks: true, gfm: true }) as string
  } catch (e) {
    console.warn('渲染 Markdown 失败', e)
    return text
  }
}

/**
 * 生成编辑面板中时间摘要文本
 * 组合开始时间、截止时间、循环规则为一行摘要
 * 如："03/15 ~ 03/20 · 每天"
 */
export function getTimeSummary(taskForm: Record<string, any> | undefined, editingTask: Record<string, any>) {
  const hasStart = taskForm?.startDate
  const hasDue = taskForm?.dueDate
  const hasRepeat = editingTask?.repeatRule

  if (!hasStart && !hasDue && !hasRepeat) return '时间'

  // 循环任务且起止日期相同时，只显示一个日期
  const parts: string[] = []
  if (hasStart && hasDue && taskForm!.startDate === taskForm!.dueDate && hasRepeat) {
    parts.push(formatDateShort(taskForm!.dueDate))
  } else {
    if (hasStart) parts.push(formatDateShort(taskForm!.startDate))
    if (hasDue) parts.push(formatDateShort(taskForm!.dueDate))
  }

  let summary = parts.join(' ~ ')

  if (hasRepeat) {
    const label = getRepeatLabel(editingTask.repeatRule, editingTask)
    summary = summary ? `${summary} · ${label}` : label
  }

  return summary || '时间'
}

/**
 * 生成新建任务对话框中的时间摘要文本
 * 组合开始时间、截止时间、循环规则为一行摘要
 */
export function getCreateTimeSummary(taskForm: Record<string, any> | undefined, repeatForm: Record<string, any>) {
  const hasStart = taskForm?.startDate
  const hasDue = taskForm?.dueDate
  const hasRepeat = repeatForm.type

  if (!hasStart && !hasDue && !hasRepeat) return '设置时间'

  const parts: string[] = []
  if (hasStart) parts.push(formatDateShort(taskForm!.startDate))
  if (hasDue) parts.push(formatDateShort(taskForm!.dueDate))
  let summary = parts.join(' ~ ')

  if (hasRepeat) {
    const labels: Record<string, string> = { DAILY: '每天', WEEKLY: '每周', MONTHLY: '每月', YEARLY: '每年' }
    const label = labels[repeatForm.type] || repeatForm.type
    summary = summary ? `${summary} · ${label}` : label
  }

  return summary || '设置时间'
}

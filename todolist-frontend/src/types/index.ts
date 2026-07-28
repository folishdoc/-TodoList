/**
 * 共享 TypeScript 类型定义
 *
 * 集中管理所有后端实体、请求体、响应体的接口定义，
 * 供前端各模块统一引用。
 */

// ── Task（任务） ──

/** 任务实体，对应后端 Task 实体 */
export interface Task {
  id: number
  title: string
  description?: string
  priority: number /** 0=无 1=低 2=中 3=高 */
  status: number /** 0=待办 1=已完成 */
  userId: number
  listId?: number
  parentId?: number /** 父任务 id（子任务关联） */
  startDate?: string
  dueDate?: string
  completedAt?: string
  createdAt: string
  reminderTime?: string
  repeatRule?: string /** JSON 字符串，描述循环规则 */
  sortOrder?: number
}

/** 创建/更新任务的请求体 */
export interface TaskRequest {
  title: string
  description?: string
  priority?: number
  status?: number
  listId?: number | null
  parentId?: number | null
  startDate?: string | null
  dueDate?: string | null
  reminderTime?: string | null
  repeatRule?: string | null
}

/** 仅更新开始/截止时间的请求体（日历拖拽用） */
export interface TaskTimeRequest {
  startDate?: string | null
  dueDate?: string | null
}

/** 带子任务列表的任务，前端树形渲染使用 */
export interface TaskWithSubtasks extends Task {
  subtasks: Task[]
}

// ── List（清单） ──

/** 任务清单实体 */
export interface TaskList {
  id: number
  name: string
  color?: string
  userId: number
  sortOrder?: number
  createdAt?: string
}

/** 创建/更新清单的请求体 */
export interface TaskListRequest {
  name: string
  color?: string
}

// ── Tag（标签） ──

/** 标签实体 */
export interface Tag {
  id: number
  name: string
  color?: string
  userId: number
  createdAt?: string
}

/** 创建/更新标签的请求体 */
export interface TagRequest {
  name: string
  color?: string
}

// ── Habit（习惯/打卡） ──

/** 习惯实体 */
export interface Habit {
  id: number
  name: string
  description?: string
  color?: string
  icon?: string
  userId: number
  createdAt?: string
}

/** 习惯打卡记录 */
export interface HabitRecord {
  id: number
  habitId: number
  date: string
  note?: string
  createdAt?: string
}

// ── Anniversary（纪念日） ──

/** 纪念日实体 */
export interface Anniversary {
  id: number
  name: string
  date: string
  type?: string
  remindEnabled?: boolean
  remindDaysBefore?: number
  remindTime?: string
}

/** 创建/更新纪念日的请求体 */
export interface AnniversaryRequest {
  name: string
  date: string
  type?: string
  remindEnabled?: boolean
  remindDaysBefore?: number
  remindTime?: string
}

// ── Attachment（附件） ──

/** 任务附件实体 */
export interface TaskAttachment {
  id: number
  taskId: number
  fileName: string
  fileSize: number
  fileUrl: string
  contentType?: string
  createdAt?: string
}

// ── Statistics（统计） ──

/** 任务统计概览数据 */
export interface TaskStatistics {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  completionRate: number
  highPriority: number
  mediumPriority: number
  lowPriority: number
  todayTasks: number
  upcomingTasks: number
}

/** 任务分布数据（按清单或优先级） */
export interface TaskDistribution {
  name: string
  count: number
  color: string
}

/** 日维度任务趋势数据 */
export interface DailyTaskStats {
  date: string
  created: number
  completed: number
}

// ── Batch（批量操作） ──

/** 批量操作请求体 */
export interface BatchOperationRequest {
  taskIds: number[]
  operation: 'complete' | 'delete' | 'move' | 'priority'
  listId?: number
  priority?: number
}

// ── Common（通用） ──

/** 后端统一响应格式 Result<T> */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/** 循环规则 */
export interface RepeatRule {
  type: string /** DAILY | WEEKLY | MONTHLY | YEARLY */
  interval?: number
  daysOfWeek?: number[] | null
  dayOfMonth?: number | null
  endDate?: string | null
  count?: number
}

/** 分页响应格式 */
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

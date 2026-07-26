// ============ Task ============
export interface Task {
  id: number
  title: string
  description?: string
  priority: number
  status: number
  userId: number
  listId?: number
  parentId?: number
  startDate?: string
  dueDate?: string
  completedAt?: string
  createdAt: string
  reminderTime?: string
  repeatRule?: string
  sortOrder?: number
}

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

export interface TaskTimeRequest {
  startDate?: string | null
  dueDate?: string | null
}

export interface TaskWithSubtasks extends Task {
  subtasks: Task[]
}

// ============ List ============
export interface TaskList {
  id: number
  name: string
  color?: string
  userId: number
  sortOrder?: number
  createdAt?: string
}

export interface TaskListRequest {
  name: string
  color?: string
}

// ============ Tag ============
export interface Tag {
  id: number
  name: string
  color?: string
  userId: number
  createdAt?: string
}

export interface TagRequest {
  name: string
  color?: string
}

// ============ Habit ============
export interface Habit {
  id: number
  name: string
  description?: string
  color?: string
  icon?: string
  userId: number
  createdAt?: string
}

export interface HabitRecord {
  id: number
  habitId: number
  date: string
  note?: string
  createdAt?: string
}

// ============ Anniversary ============
export interface Anniversary {
  id: number
  name: string
  date: string
  type?: string
  remindEnabled?: boolean
  remindDaysBefore?: number
  remindTime?: string
}

export interface AnniversaryRequest {
  name: string
  date: string
  type?: string
  remindEnabled?: boolean
  remindDaysBefore?: number
  remindTime?: string
}

// ============ Attachment ============
export interface TaskAttachment {
  id: number
  taskId: number
  fileName: string
  fileSize: number
  fileUrl: string
  contentType?: string
  createdAt?: string
}

// ============ Statistics ============
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

export interface TaskDistribution {
  name: string
  count: number
  color: string
}

export interface DailyTaskStats {
  date: string
  created: number
  completed: number
}

// ============ Batch ============
export interface BatchOperationRequest {
  taskIds: number[]
  operation: 'complete' | 'delete' | 'move' | 'priority'
  listId?: number
  priority?: number
}

// ============ Common ============
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface RepeatRule {
  type: string
  interval?: number
  daysOfWeek?: number[] | null
  dayOfMonth?: number | null
  endDate?: string | null
  count?: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

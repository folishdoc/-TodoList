import { computed, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as taskApi from '../api/task'
import { getWeekStart } from './useCalendarGrid'

export function useCalendarView(
  currentDate: Ref<Date>,
  viewMode: Ref<string>,
  barScale: Ref<'week' | 'month'>,
  dayBarDate: Ref<Date | string>,
  weekDays: string[],
  showCreateDialog: Ref<boolean>,
  newTaskForm: Ref<{
    title: string
    description: string
    dueDate: Date
    time: Date | null
    priority: number
  }>,
  loadTasks: () => Promise<void>,
  formatLocalDateTime: (d: Date) => string,
) {
  const periodText = computed(() => {
    if (viewMode.value === 'bar') return barScale.value === 'week' ? '周' : '月'
    if (viewMode.value === 'daybar') return '天'
    const texts: Record<string, string> = { day: '天', week: '周', month: '月' }
    return texts[viewMode.value] || '月'
  })

  const currentPeriodText = computed(() => {
    const date = currentDate.value
    if (viewMode.value === 'month' || (viewMode.value === 'bar' && barScale.value === 'month')) {
      return `${date.getFullYear()}年${date.getMonth() + 1}月`
    } else if (viewMode.value === 'week' || (viewMode.value === 'bar' && barScale.value === 'week')) {
      const start = getWeekStart(date)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`
    } else if (viewMode.value === 'daybar') {
      const d = dayBarDate.value instanceof Date ? dayBarDate.value : new Date(dayBarDate.value)
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
    } else {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    }
  })

  const prevPeriod = () => {
    if (viewMode.value === 'daybar') {
      const d = new Date(dayBarDate.value)
      d.setDate(d.getDate() - 1)
      dayBarDate.value = d
      return
    }
    const date = new Date(currentDate.value)
    if (viewMode.value === 'month' || (viewMode.value === 'bar' && barScale.value === 'month'))
      date.setMonth(date.getMonth() - 1)
    else if (viewMode.value === 'week' || (viewMode.value === 'bar' && barScale.value === 'week'))
      date.setDate(date.getDate() - 7)
    else date.setDate(date.getDate() - 1)
    currentDate.value = date
  }

  const nextPeriod = () => {
    if (viewMode.value === 'daybar') {
      const d = new Date(dayBarDate.value)
      d.setDate(d.getDate() + 1)
      dayBarDate.value = d
      return
    }
    const date = new Date(currentDate.value)
    if (viewMode.value === 'month' || (viewMode.value === 'bar' && barScale.value === 'month'))
      date.setMonth(date.getMonth() + 1)
    else if (viewMode.value === 'week' || (viewMode.value === 'bar' && barScale.value === 'week'))
      date.setDate(date.getDate() + 7)
    else date.setDate(date.getDate() + 1)
    currentDate.value = date
  }

  const goToToday = () => {
    currentDate.value = new Date()
    dayBarDate.value = new Date()
  }

  const openCreateWithTime = (date: Date, time: { h: number; m: number } | null = null) => {
    newTaskForm.value.dueDate = new Date(date)
    if (time) {
      const t = new Date()
      t.setHours(time.h, time.m, 0, 0)
      newTaskForm.value.time = t
    } else {
      newTaskForm.value.time = null
    }
    newTaskForm.value.title = ''
    newTaskForm.value.description = ''
    newTaskForm.value.priority = 2
    showCreateDialog.value = true
  }

  const handleDayClick = (day: any) => openCreateWithTime(new Date(day.date))

  const handleCompleteTask = async (task: any) => {
    try {
      if (task.status === 1) {
        await taskApi.uncompleteTask(task.id)
      } else {
        await taskApi.completeTask(task.id)
      }
      await loadTasks()
    } catch (err) {
      console.error('操作失败:', err)
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskForm.value.title.trim()) {
      ElMessage.warning('请输入任务标题')
      return
    }
    try {
      let dueDate = new Date(newTaskForm.value.dueDate)
      if (newTaskForm.value.time) {
        const time = new Date(newTaskForm.value.time)
        dueDate.setHours(time.getHours())
        dueDate.setMinutes(time.getMinutes())
      }
      const startDate = new Date(dueDate)
      startDate.setHours(0, 0, 0, 0)
      await taskApi.createTask({
        title: newTaskForm.value.title,
        description: newTaskForm.value.description,
        startDate: formatLocalDateTime(startDate),
        dueDate: formatLocalDateTime(dueDate),
        priority: newTaskForm.value.priority,
        status: 0,
      })
      ElMessage.success('创建成功')
      showCreateDialog.value = false
      await loadTasks()
    } catch (err) {
      console.error('创建任务失败:', err)
    }
  }

  return {
    periodText,
    currentPeriodText,
    prevPeriod,
    nextPeriod,
    goToToday,
    openCreateWithTime,
    handleDayClick,
    handleCompleteTask,
    handleCreateTask,
  }
}

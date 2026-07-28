/**
 * useCalendarTasks — 日历视图的任务加载与筛选
 *
 * 负责根据当前日历视图模式、日期范围从后端加载任务，
 * 并提供优先级筛选逻辑。视图切换时自动重新加载数据。
 */
import { ref, computed, watch, onMounted, type Ref } from 'vue'
import * as taskApi from '../api/task'
import { formatLocalDateTime } from '../utils/date'
import { getWeekStart } from './useCalendarGrid'

export function useCalendarTasks(
  allTasks: Ref<any[]>,
  filters: Ref<{ status: string; priority: string }>,
  viewMode: Ref<string>,
  barScale: Ref<'week' | 'month'>,
  currentDate: Ref<Date>,
  dayBarDate: Ref<Date | string>,
) {
  /** 根据筛选条件过滤已完成任务和优先级 */
  const filteredTasks = computed(() => {
    return allTasks.value.filter((task) => {
      if (task.status === 1) return false
      if (filters.value.priority === 'high' && task.priority !== 3) return false
      if (filters.value.priority === 'medium' && task.priority !== 2) return false
      if (filters.value.priority === 'low' && task.priority !== 1) return false
      return true
    })
  })

  /**
   * 根据当前视图模式和日期计算需要加载的日期范围
   * daybar：当天；month/bar(month)：当月±7天；week/bar(week)：当周±1天
   */
  const getVisibleDateRange = (): { start: string; end: string } => {
    if (viewMode.value === 'daybar') {
      const d = new Date(dayBarDate.value)
      d.setHours(0, 0, 0, 0)
      const start = formatLocalDateTime(d)
      const e = new Date(d)
      e.setHours(23, 59, 59, 999)
      const end = formatLocalDateTime(e)
      return { start, end }
    }
    if (viewMode.value === 'month' || (viewMode.value === 'bar' && barScale.value === 'month')) {
      const d = new Date(currentDate.value)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      start.setDate(start.getDate() - 7)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      end.setDate(end.getDate() + 7)
      return { start: formatLocalDateTime(start), end: formatLocalDateTime(end) }
    } else {
      const start = getWeekStart(currentDate.value)
      start.setDate(start.getDate() - 1)
      const end = new Date(start)
      end.setDate(end.getDate() + 8)
      end.setHours(23, 59, 59, 999)
      return { start: formatLocalDateTime(start), end: formatLocalDateTime(end) }
    }
  }

  /** 加载任务：优先使用日期范围接口，回退到全量分页加载 */
  const loadTasks = async () => {
    try {
      const { start, end } = getVisibleDateRange()
      const res = await taskApi.getTasksByDateRange(start, end)
      allTasks.value = res.data || []
    } catch {
      try {
        const res = await taskApi.getTasks({ page: 0, size: 1000 })
        allTasks.value = res.data.content || []
      } catch (e) {
        console.error('加载任务失败:', e)
      }
    }
  }

  /** 处理筛选命令（由筛选下拉菜单触发） */
  const handleFilterCommand = (command: string) => {
    if (command.startsWith('status-')) filters.value.status = command.replace('status-', '')
    else if (command.startsWith('priority-'))
      filters.value.priority = command.replace('priority-', '')
  }

  // ── 监听视图变化自动重新加载 ──
  watch(
    () => viewMode.value,
    () => {
      loadTasks()
    },
  )
  watch(barScale, () => {
    if (viewMode.value === 'bar') loadTasks()
  })
  watch(dayBarDate, () => {
    if (viewMode.value === 'daybar') loadTasks()
  })
  onMounted(() => {
    loadTasks()
  })

  return {
    filteredTasks,
    loadTasks,
    handleFilterCommand,
  }
}

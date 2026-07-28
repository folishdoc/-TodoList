/**
 * useCalendarState — 日历视图共享状态
 *
 * 管理日历视图的全局状态：视图模式、时间范围、任务列表、筛选条件、
 * 新建任务表单、日任务栏日期等。视图模式通过 URL query `calendarView` 持久化。
 */
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useCalendarState() {
  const route = useRoute()
  const router = useRouter()

  /** 中文星期名称 */
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  /** 日历视图模式：month / week / daybar（从 URL query 读写） */
  const viewMode = computed({
    get: () => {
      const val = (route.query.calendarView as any) || 'month'
      return val === 'day' ? 'daybar' : val
    },
    set: (val) => router.replace({ query: { ...route.query, calendarView: val } }),
  })

  /** 条形图的时间刻度：周视图 / 月视图 */
  const barScale = ref<'week' | 'month'>('week')
  /** 当前日历聚焦的日期（月/周视图的基准日期） */
  const currentDate = ref(new Date())
  /** 新建任务对话框是否显示 */
  const showCreateDialog = ref(false)
  /** 所有任务（扁平列表，由 useCalendarTasks 加载） */
  const allTasks = ref<any[]>([])
  /** 状态/优先级筛选条件 */
  const filters = ref<{ status: string; priority: string }>({ status: 'all', priority: 'all' })
  /** 悬浮的日期（用于高亮显示） */
  const hoveredDay = ref<string | null>(null)

  /** 新建任务的表单数据 */
  const newTaskForm = ref<{
    title: string
    description: string
    dueDate: Date
    time: Date | null
    priority: number
  }>({ title: '', description: '', dueDate: new Date(), time: null, priority: 2 })

  /** 日任务栏（daybar）聚焦的日期 */
  const dayBarDate = ref<Date | string>(new Date())

  /** 每 30 分钟槽的高度（px），用于计算 daybar 中任务块的定位 */
  const SLOT_HEIGHT = 30

  return {
    viewMode,
    barScale,
    currentDate,
    showCreateDialog,
    allTasks,
    filters,
    hoveredDay,
    newTaskForm,
    weekDays,
    dayBarDate,
    SLOT_HEIGHT,
  }
}

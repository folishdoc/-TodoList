import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useCalendarState() {
  const route = useRoute()
  const router = useRouter()

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const viewMode = computed({
    get: () => {
      const val = (route.query.calendarView as any) || 'month'
      return val === 'day' ? 'daybar' : val
    },
    set: (val) => router.replace({ query: { ...route.query, calendarView: val } }),
  })

  const barScale = ref<'week' | 'month'>('week')
  const currentDate = ref(new Date())
  const showCreateDialog = ref(false)
  const allTasks = ref<any[]>([])
  const filters = ref<{ status: string; priority: string }>({ status: 'all', priority: 'all' })
  const hoveredDay = ref<string | null>(null)

  const newTaskForm = ref<{
    title: string
    description: string
    dueDate: Date
    time: Date | null
    priority: number
  }>({ title: '', description: '', dueDate: new Date(), time: null, priority: 2 })

  const dayBarDate = ref<Date | string>(new Date())

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

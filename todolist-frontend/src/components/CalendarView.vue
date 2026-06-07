<template>
  <div class="calendar-container">
    <!-- 工具栏 -->
    <div class="calendar-toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button @click="prevPeriod">上一{{ periodText }}</el-button>
          <el-button @click="goToToday">今天</el-button>
          <el-button @click="nextPeriod">下一{{ periodText }}</el-button>
        </el-button-group>
        <h2 class="current-period">{{ currentPeriodText }}</h2>
      </div>
      <div class="toolbar-right">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="daybar">日</el-radio-button>
          <el-radio-button value="week">周</el-radio-button>
          <el-radio-button value="month">月</el-radio-button>
          <el-radio-button value="bar">条形</el-radio-button>
        </el-radio-group>
        <el-radio-group v-if="viewMode === 'bar'" v-model="barScale" size="small">
          <el-radio-button value="week">周</el-radio-button>
          <el-radio-button value="month">月</el-radio-button>
        </el-radio-group>
        <el-divider direction="vertical" />
        <el-dropdown @command="handleFilterCommand">
          <el-button size="small"><el-icon><Filter /></el-icon>筛选</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="status-all" :class="{ 'is-active': filters.status === 'all' }">
                <span class="check-mark">{{ filters.status === 'all' ? '✓' : '' }}</span>全部状态
              </el-dropdown-item>
              <el-dropdown-item command="status-pending" :class="{ 'is-active': filters.status === 'pending' }">
                <span class="check-mark">{{ filters.status === 'pending' ? '✓' : '' }}</span>未完成
              </el-dropdown-item>
              <el-dropdown-item command="status-completed" :class="{ 'is-active': filters.status === 'completed' }">
                <span class="check-mark">{{ filters.status === 'completed' ? '✓' : '' }}</span>已完成
              </el-dropdown-item>
              <el-dropdown-item divided command="priority-high" :class="{ 'is-active': filters.priority === 'high' }">
                <span class="check-mark">{{ filters.priority === 'high' ? '✓' : '' }}</span>高优先级
              </el-dropdown-item>
              <el-dropdown-item command="priority-medium" :class="{ 'is-active': filters.priority === 'medium' }">
                <span class="check-mark">{{ filters.priority === 'medium' ? '✓' : '' }}</span>中优先级
              </el-dropdown-item>
              <el-dropdown-item command="priority-low" :class="{ 'is-active': filters.priority === 'low' }">
                <span class="check-mark">{{ filters.priority === 'low' ? '✓' : '' }}</span>低优先级
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- ===== 月视图 ===== -->
    <div v-if="viewMode === 'month'" class="month-view">
      <div class="weekdays">
        <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
      </div>
      <div class="days-grid">
        <div v-for="day in calendarDays" :key="day.date"
          class="day-cell"
          :class="{ 'other-month': !day.isCurrentMonth, 'today': day.isToday, 'has-tasks': day.tasks.length > 0, 'expanded': hoveredDay === day.date }"
          @click="handleDayClick(day)"
          @mouseenter="hoveredDay = day.date"
          @mouseleave="hoveredDay = null"
        >
          <div class="day-header">
            <span class="day-number">{{ day.dayNumber }}</span>
            <span v-if="day.isToday" class="today-badge">今</span>
          </div>
          <div class="day-tasks">
            <div v-for="task in (hoveredDay === day.date ? day.tasks : day.tasks.slice(0, 2))"
              :key="task.id"
              class="task-chip"
              :class="['priority-' + (task.priority || 2), { 'completed': task.status === 1, 'overdue': isOverdue(task) }]"
              @click.stop="handleTaskClick(task)"
            >
              <span v-if="getTaskDateType(task, day.date) === 'start'" class="date-indicator start-indicator" title="开始日">&#9654;</span>
              <span v-else-if="getTaskDateType(task, day.date) === 'end'" class="date-indicator end-indicator" title="结束日">&#9632;</span>
              <span v-else-if="getTaskDateType(task, day.date) === 'both'" class="date-indicator both-indicator" title="开始&结束">&#9679;</span>
              <el-checkbox :model-value="task.status === 1" @click.stop @change="handleCompleteTask(task)" />
              <span class="task-title">{{ task.title }}</span>
            </div>
            <div v-if="!hoveredDay || hoveredDay !== day.date" v-show="day.tasks.length > 2" class="more-tasks">
              +{{ day.tasks.length - 2 }} 更多
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 周视图 ===== -->
    <div v-else-if="viewMode === 'week'" class="week-view">
      <div class="week-header">
        <div v-for="day in weekDaysData" :key="day.date" class="week-day-header" :class="{ 'last-col': day === weekDaysData[6] }">
          <div class="day-name">{{ day.weekDay }}</div>
          <div class="day-date" :class="{ 'today': day.isToday }">{{ day.dayNumber }}</div>
        </div>
      </div>
      <div class="week-content">
        <div v-for="day in weekDaysData" :key="day.date" class="week-day-column" :class="{ 'last-col': day === weekDaysData[6] }" @click="openCreateWithTime(new Date(day.date))">
          <div class="day-tasks-list">
            <div v-for="task in day.tasks" :key="task.id"
              class="week-task-item"
              :class="['priority-' + (task.priority || 2), { 'completed': task.status === 1, 'overdue': isOverdue(task) }]"
              @click.stop="handleTaskClick(task)"
            >
              <span v-if="getTaskDateType(task, day.date) === 'start'" class="date-indicator start-indicator" title="开始日">&#9654;</span>
              <span v-else-if="getTaskDateType(task, day.date) === 'end'" class="date-indicator end-indicator" title="结束日">&#9632;</span>
              <span v-else-if="getTaskDateType(task, day.date) === 'both'" class="date-indicator both-indicator" title="开始&结束">&#9679;</span>
              <el-checkbox :model-value="task.status === 1" @click.stop @change="handleCompleteTask(task)" />
              <div class="task-info">
                <div class="task-title">{{ task.title }}</div>
                <div v-if="task.dueDate" class="task-time">{{ formatTime(task.dueDate) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 日视图 ===== -->
    <div v-else-if="viewMode === 'day'" class="day-view">
      <div class="day-timeline">
        <div v-for="hour in 24" :key="hour" class="time-slot">
          <div class="time-label">{{ String(hour - 1).padStart(2, '0') }}:00</div>
          <div class="time-content">
            <div v-for="task in getTasksByHour(hour - 1)" :key="task.id"
              class="timeline-task"
              :class="['priority-' + (task.priority || 2), { 'completed': task.status === 1, 'overdue': isOverdue(task) }]"
              @click="handleTaskClick(task)"
            >
              <el-checkbox :model-value="task.status === 1" @click.stop @change="handleCompleteTask(task)" />
              <span class="task-title">{{ task.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 条形视图 ===== -->
    <div v-else-if="viewMode === 'bar'" class="bar-view"
      @pointermove="onBarPointerMove"
      @pointerup="onBarPointerUp"
      @pointerleave="onBarPointerUp"
    >
      <div class="bar-header" :style="barHeaderStyle" :class="{ 'bar-header-month': barScale === 'month' }">
        <div v-for="(day, i) in barDays" :key="day.date"
          class="bar-header-cell" :class="{ 'today': day.isToday, 'other-month': !day.isCurrentMonth, 'week-end': barScale === 'month' && (i + 1) % 7 === 0 }"
          @click.stop="openCreateWithTime(new Date(day.date))"
        >
          <div v-if="barScale === 'week'" class="bar-day-name">{{ day.weekDay }}</div>
          <div class="bar-day-num">{{ day.dayNumber }}</div>
        </div>
      </div>
      <div class="bar-rows">
        <div v-for="task in barTasks" :key="task.id" class="bar-row" :style="barRowStyle" @click.stop="handleTaskClick(task)">
          <el-tooltip placement="top" :show-after="500" :content="taskTooltipContent(task)">
            <div class="bar-item"
              :class="['priority-' + (task.priority || 2), { 'dragging': dragState?.task?.id === task.id }]"
              :style="dragState?.task?.id === task.id && dragPreviewStyle ? dragPreviewStyle : getBarStyle(task)"
              @pointerdown.prevent.stop="onBarPointerDown($event, task)"
            >
              <div class="resize-handle left" @pointerdown.prevent.stop="onResizeStart($event, task, 'left')"></div>
              <span class="bar-title">{{ task.title }}</span>
              <div class="resize-handle right" @pointerdown.prevent.stop="onResizeStart($event, task, 'right')"></div>
            </div>
          </el-tooltip>
        </div>
        <el-empty v-if="barTasks.length === 0" description="当前范围暂无任务" :image-size="60" />
      </div>
      <!-- 拖拽时间提示 -->
      <div v-if="dragHint" class="drag-hint">{{ dragHint }}</div>
    </div>

    <!-- ===== 日条形视图 (Day Bar) ===== -->
    <div v-else-if="viewMode === 'daybar'" class="daybar-view">
      <div class="daybar-header">
        <el-date-picker v-model="dayBarDate" type="date" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" @change="loadTasks" />
        <el-button @click="dayBarDate = new Date(); loadTasks()">今天</el-button>
        <span class="daybar-date-text">{{ dayBarDateText }}</span>
      </div>
      <div class="daybar-timeline"
        @pointermove="onDayBarPointerMove"
        @pointerup="onDayBarPointerUp"
        @pointerleave="onDayBarPointerUp"
      >
        <div class="daybar-scale">
          <div v-for="slot in timeSlots" :key="slot.label" class="time-slot-label" :class="{ 'hour': slot.isHour }">
            {{ slot.label }}
          </div>
        </div>
        <div class="daybar-track" :style="{ height: 48 * SLOT_HEIGHT + 'px' }" @click="onDayBarTrackClick">
          <div v-for="tick in timeTicks" :key="tick.top" class="time-tick" :style="{ top: tick.top + 'px' }" :class="{ 'hour': tick.isHour }"></div>
          <div v-for="task in dayBarTasks" :key="task.id"
            class="daybar-task"
            :class="['priority-' + (task.priority || 2), { 'dragging': dayBarDrag?.task?.id === task.id }]"
            :style="dayBarDrag?.task?.id === task.id && dayBarDragPreview ? dayBarDragPreview : getDayBarStyle(task)"
            @click.stop="handleTaskClick(task)"
            @pointerdown.prevent.stop="onDayBarPointerDown($event, task)"
          >
            <div class="daybar-resize top" @pointerdown.prevent.stop="onDayBarResizeStart($event, task, 'top')"></div>
            <span class="daybar-task-title">{{ task.title }}</span>
            <span class="daybar-task-time">{{ getDayBarTimeLabel(task) }}</span>
            <div class="daybar-resize bottom" @pointerdown.prevent.stop="onDayBarResizeStart($event, task, 'bottom')"></div>
          </div>
        </div>
      </div>
      <div v-if="dayBarDragHint" class="drag-hint">{{ dayBarDragHint }}</div>
    </div>

    <!-- 新建任务对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建任务" width="500px">
      <el-form :model="newTaskForm" label-width="80px">
        <el-form-item label="标题" required><el-input v-model="newTaskForm.title" placeholder="请输入任务标题" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="newTaskForm.description" type="textarea" :rows="2" placeholder="请输入任务描述" /></el-form-item>
        <el-form-item label="日期" required><el-date-picker v-model="newTaskForm.dueDate" type="date" placeholder="选择日期" style="width: 100%" /></el-form-item>
        <el-form-item label="时间"><el-time-picker v-model="newTaskForm.time" placeholder="选择时间（选填）" style="width: 100%" /></el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="newTaskForm.priority" placeholder="请选择优先级">
            <el-option label="低" :value="1" /><el-option label="中" :value="2" /><el-option label="高" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Filter } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import * as taskApi from '../api/task'
import { formatLocalDateTime } from '../utils/date'

const route = useRoute()
const router = useRouter()
const emit = defineEmits<{ 'task-click': [task: any] }>()

// ===== 状态 =====
const viewMode = computed({
  get: () => {
    const val = (route.query.calendarView as any) || 'month'
    return val === 'day' ? 'daybar' : val
  },
  set: (val) => router.replace({ query: { ...route.query, calendarView: val } })
})
const barScale = ref<'week' | 'month'>('week')
const currentDate = ref(new Date())
const showCreateDialog = ref(false)
const allTasks = ref<any[]>([])
const filters = ref({ status: 'all', priority: 'all' })
const hoveredDay = ref<string | null>(null) // Step 2: month view hover
const newTaskForm = ref<{ title: string; description: string; dueDate: Date; time: Date | null; priority: number }>({ title: '', description: '', dueDate: new Date(), time: null, priority: 2 })
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// ===== 条形视图拖拽状态 =====
const dragState = ref<any>(null)
const dragPreviewStyle = ref<any>(null)
const dragHint = ref('')

// ===== 日条形视图 =====
const dayBarDate = ref(new Date())
const SLOT_HEIGHT = 30 // px per 30 minutes
const dayBarDrag = ref<any>(null)
const dayBarDragPreview = ref<any>(null)
const dayBarDragHint = ref('')
const dayBarSuppressClick = ref(0) // timestamp of last drag end, suppresses next click within 200ms

// ===== 筛选 =====
const filteredTasks = computed(() => {
  return allTasks.value.filter(task => {
    if (filters.value.status === 'pending' && task.status === 1) return false
    if (filters.value.status === 'completed' && task.status !== 1) return false
    if (filters.value.priority === 'high' && task.priority !== 3) return false
    if (filters.value.priority === 'medium' && task.priority !== 2) return false
    if (filters.value.priority === 'low' && task.priority !== 1) return false
    return true
  })
})

const currentPeriodText = computed(() => {
  const date = currentDate.value
  if (viewMode.value === 'month' || (viewMode.value === 'bar' && barScale.value === 'month')) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  } else if (viewMode.value === 'week' || (viewMode.value === 'bar' && barScale.value === 'week')) {
    const start = getWeekStart(date)
    const end = new Date(start); end.setDate(end.getDate() + 6)
    return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`
  } else if (viewMode.value === 'daybar') {
    const d = dayBarDate.value instanceof Date ? dayBarDate.value : new Date(dayBarDate.value)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
  } else {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }
})

const periodText = computed(() => {
  if (viewMode.value === 'bar') return barScale.value === 'week' ? '周' : '月'
  if (viewMode.value === 'daybar') return '天'
  const texts: Record<string, string> = { day: '天', week: '周', month: '月' }
  return texts[viewMode.value] || '月'
})

// ===== 月视图 =====
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear(), month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay(), daysInMonth = lastDay.getDate()
  const days = []
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startPadding - 1; i >= 0; i--) days.push(createDayData(new Date(year, month - 1, prevMonthLastDay - i), false))
  for (let i = 1; i <= daysInMonth; i++) days.push(createDayData(new Date(year, month, i), true, weekDays[(startPadding + i - 1) % 7]))
  for (let i = 1; i <= 42 - days.length; i++) days.push(createDayData(new Date(year, month + 1, i), false))
  return days
})

const weekDaysData = computed(() => {
  const start = getWeekStart(currentDate.value), days = []
  for (let i = 0; i < 7; i++) { const date = new Date(start); date.setDate(date.getDate() + i); days.push(createDayData(date, true, weekDays[i])) }
  return days
})

const createDayData = (date: Date, isCurrentMonth: boolean, weekDay?: string) => {
  const today = new Date(), isToday = date.toDateString() === today.toDateString()
  const tasks = filteredTasks.value.filter(task => {
    if (!task.dueDate && !task.startDate) return false
    const cellDay = date.toDateString()
    if (task.dueDate && new Date(task.dueDate).toDateString() === cellDay) return true
    if (task.startDate && new Date(task.startDate).toDateString() === cellDay) return true
    if (task.startDate && task.dueDate) {
      const start = new Date(task.startDate), end = new Date(task.dueDate), cell = new Date(date)
      cell.setHours(0,0,0,0); start.setHours(0,0,0,0); end.setHours(0,0,0,0)
      return cell > start && cell < end
    }
    return false
  })
  return { date: date.toISOString(), dayNumber: date.getDate(), weekDay: weekDay || '', isCurrentMonth, isToday, tasks }
}

const getWeekStart = (date: Date) => { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); return d }
const getTasksByHour = (hour: number) => {
  const ds = currentDate.value.toDateString()
  return filteredTasks.value.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === ds && new Date(t.dueDate).getHours() === hour)
}

const getTaskDateType = (task: any, cellDateIso: string): 'start'|'end'|'both'|'middle'|'none' => {
  const cellDay = new Date(cellDateIso).toDateString()
  const startDay = task.startDate ? new Date(task.startDate).toDateString() : null
  const dueDay = task.dueDate ? new Date(task.dueDate).toDateString() : null
  if (!startDay && !dueDay) return 'none'
  if (startDay === cellDay && dueDay === cellDay) return 'both'
  if (startDay === cellDay) return 'start'
  if (dueDay === cellDay) return 'end'
  if (startDay && dueDay) { const c = new Date(cellDay).getTime(), s = new Date(startDay).getTime(), e = new Date(dueDay).getTime(); if (c > s && c < e) return 'middle' }
  return 'none'
}
const isOverdue = (task: any) => task.dueDate && task.status !== 1 && new Date(task.dueDate) < new Date()
const formatTime = (dateStr: string) => { const d = new Date(dateStr); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }

// ===== 条形视图 =====
const barDays = computed(() => barScale.value === 'week' ? weekDaysData.value : calendarDays.value)
const barHeaderStyle = computed(() => ({ gridTemplateColumns: `repeat(${barDays.value.length}, 1fr)` }))
const barRowStyle = computed(() => ({ gridTemplateColumns: `repeat(${barDays.value.length}, 1fr)` }))

const barTasks = computed(() => {
  return filteredTasks.value.filter(t => t.dueDate || t.startDate).filter(t => {
    if (barDays.value.length === 0) return false
    const firstCell = new Date(barDays.value[0].date), lastCell = new Date(barDays.value[barDays.value.length - 1].date)
    lastCell.setHours(23,59,59,999)
    const ts = t.startDate ? new Date(t.startDate) : new Date(t.dueDate), te = t.dueDate ? new Date(t.dueDate) : new Date(t.startDate)
    return ts <= lastCell && te >= firstCell
  }).sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    const aS = a.startDate ? new Date(a.startDate).getTime() : (a.dueDate ? new Date(a.dueDate).getTime() : 0)
    const bS = b.startDate ? new Date(b.startDate).getTime() : (b.dueDate ? new Date(b.dueDate).getTime() : 0)
    return aS - bS
  })
})

const findDayIndexInBar = (date: Date): number => {
  const td = new Date(date).toDateString()
  return barDays.value.findIndex(d => new Date(d.date).toDateString() === td)
}

const getBarStyle = (task: any) => {
  const sd = task.startDate ? new Date(task.startDate) : null, dd = task.dueDate ? new Date(task.dueDate) : null
  if (!sd && !dd) return { display: 'none' }
  let si = findDayIndexInBar(sd || dd!), ei = findDayIndexInBar(dd || sd!)
  if (si === -1 && ei === -1) return { display: 'none' }
  if (si === -1) si = 0; if (ei === -1) ei = barDays.value.length - 1
  return { gridColumn: `${si + 1} / span ${Math.max(ei - si + 1, 1)}` }
}

const taskTooltipContent = (task: any) => {
  const fmt = (d: string) => { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}` }
  const parts = [task.title]
  if (task.startDate) parts.push(`开始: ${fmt(task.startDate)}`)
  if (task.dueDate) parts.push(`截止: ${fmt(task.dueDate)}`)
  parts.push(`优先级: ${['无','低','中','高'][task.priority||0]}`)
  if (task.status === 1) parts.push('[已完成]')
  return parts.join('\n')
}

// ===== 条形视图拖拽 =====
const onBarPointerDown = (e: PointerEvent, task: any) => {
  if (dragState.value) return
  const sd = task.startDate ? new Date(task.startDate) : new Date(task.dueDate)
  const dd = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate)
  const si = findDayIndexInBar(sd), ei = findDayIndexInBar(dd)
  dragState.value = { task, mode: 'move', startX: e.clientX, origSi: si === -1 ? 0 : si, origEi: ei === -1 ? barDays.value.length - 1 : ei }
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

const onResizeStart = (e: PointerEvent, task: any, side: 'left' | 'right') => {
  if (dragState.value) return
  const sd = task.startDate ? new Date(task.startDate) : new Date(task.dueDate)
  const dd = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate)
  const si = findDayIndexInBar(sd), ei = findDayIndexInBar(dd)
  dragState.value = { task, mode: side === 'left' ? 'resize-left' : 'resize-right', startX: e.clientX, origSi: si === -1 ? 0 : si, origEi: ei === -1 ? barDays.value.length - 1 : ei }
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

const onBarPointerMove = (e: PointerEvent) => {
  if (!dragState.value) return
  const dx = e.clientX - dragState.value.startX
  const container = document.querySelector('.bar-header') as HTMLElement
  if (!container) return
  const colWidth = container.getBoundingClientRect().width / barDays.value.length
  const colDelta = Math.round(dx / colWidth)
  let si = dragState.value.origSi, ei = dragState.value.origEi
  if (dragState.value.mode === 'move') { si += colDelta; ei += colDelta }
  else if (dragState.value.mode === 'resize-left') { si += colDelta }
  else if (dragState.value.mode === 'resize-right') { ei += colDelta }
  si = Math.max(0, si); ei = Math.min(barDays.value.length - 1, ei)
  if (dragState.value.mode !== 'move' && si >= ei) return // prevent collapse
  dragPreviewStyle.value = { gridColumn: `${si + 1} / span ${ei - si + 1}`, opacity: 0.7, background: 'rgba(64,158,255,0.3)' }
  // update hint
  const startDay = new Date(barDays.value[si].date), endDay = new Date(barDays.value[ei].date)
  const fmtD = (d: Date) => `${d.getMonth()+1}/${d.getDate()}`
  dragHint.value = `${fmtD(startDay)} → ${fmtD(endDay)}`
}

const onBarPointerUp = async () => {
  if (!dragState.value) return
  const { task, mode, origSi, origEi } = dragState.value
  const style = dragPreviewStyle.value
  dragState.value = null; dragPreviewStyle.value = null; dragHint.value = ''
  if (!style) { handleTaskClick(task); return }
  // Parse new column span
  const m = style.gridColumn.match(/(\d+)\s*\/\s*span\s*(\d+)/)
  if (!m) return
  const newSi = parseInt(m[1]) - 1, newSpan = parseInt(m[2]), newEi = newSi + newSpan - 1
  if (newSi === origSi && newEi === origEi) return // no change
  const startDate = barDays.value[newSi] ? new Date(barDays.value[newSi].date) : null
  const endDate = barDays.value[newEi] ? new Date(barDays.value[newEi].date) : null
  if (endDate) endDate.setHours(23, 59, 59, 999)
  try {
    const update: any = {}
    if (mode === 'resize-left' || mode === 'move') {
      if (startDate) {
        if (task.startDate) { const orig = new Date(task.startDate); startDate.setHours(orig.getHours(), orig.getMinutes(), 0, 0) }
        update.startDate = formatLocalDateTime(startDate)
      }
    }
    if (mode === 'resize-right' || mode === 'move') {
      if (endDate) {
        if (task.dueDate) { const orig = new Date(task.dueDate); endDate.setHours(orig.getHours(), orig.getMinutes(), 0, 0) }
        update.dueDate = formatLocalDateTime(endDate)
      }
    }
    if (Object.keys(update).length > 0) {
      await taskApi.updateTaskTime(task.id, update)
      ElMessage.success('时间已更新')
      await loadTasks()
    }
  } catch (err) { console.error('更新任务时间失败:', err); ElMessage.error('时间更新失败') }
}

// ===== 日条形视图 =====
const dayBarDateText = computed(() => {
  const d = dayBarDate.value instanceof Date ? dayBarDate.value : new Date(dayBarDate.value)
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
})

const timeSlots = computed(() => {
  const slots = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push({ label: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, isHour: m === 0 })
    }
  }
  return slots
})

const timeTicks = computed(() => {
  const ticks = []
  for (let i = 0; i < 48; i++) {
    ticks.push({ top: i * SLOT_HEIGHT, isHour: i % 2 === 0 })
  }
  return ticks
})

const hasTimeComponent = (dateStr: string | null): boolean => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime()) && (d.getHours() !== 0 || d.getMinutes() !== 0)
}

const dayBarTasks = computed(() => {
  const targetDate = new Date(dayBarDate.value).toDateString()
  let dateOnlyOffset = 0

  return filteredTasks.value.filter(t => {
    if (!t.dueDate && !t.startDate) return false
    if (t.dueDate && new Date(t.dueDate).toDateString() === targetDate) return true
    if (t.startDate && new Date(t.startDate).toDateString() === targetDate) return true
    if (t.startDate && t.dueDate) {
      const s = new Date(t.startDate), e = new Date(t.dueDate)
      s.setHours(0,0,0,0); e.setHours(0,0,0,0)
      const c = new Date(targetDate); c.setHours(0,0,0,0)
      return c >= s && c <= e
    }
    return false
  }).sort((a, b) => {
    const aS = a.startDate ? new Date(a.startDate).getTime() : (a.dueDate ? new Date(a.dueDate).getTime() : 0)
    const bS = b.startDate ? new Date(b.startDate).getTime() : (b.dueDate ? new Date(b.dueDate).getTime() : 0)
    return aS - bS
  }).map(task => {
    let startH = 0, startM = 0, endH = 0, endM = 0

    const hasStartOnTarget = task.startDate && new Date(task.startDate).toDateString() === targetDate
    const hasEndOnTarget = task.dueDate && new Date(task.dueDate).toDateString() === targetDate

    if (hasStartOnTarget) {
      const sd = new Date(task.startDate); startH = sd.getHours(); startM = sd.getMinutes()
    }
    if (hasEndOnTarget) {
      const dd = new Date(task.dueDate); endH = dd.getHours(); endM = dd.getMinutes()
    } else if (!task.dueDate || new Date(task.dueDate).toDateString() !== targetDate) {
      endH = 23; endM = 59
    }
    if (!task.startDate || new Date(task.startDate).toDateString() !== targetDate) {
      startH = 0; startM = 0
    }

    const startHasTime = hasStartOnTarget && hasTimeComponent(task.startDate)
    const endHasTime = hasEndOnTarget && hasTimeComponent(task.dueDate)
    const hasTimeOnTarget = startHasTime || endHasTime

    let isDateOnly = false

    if (task.dueDate === task.startDate || (!task.startDate && task.dueDate)) {
      if (hasTimeOnTarget) {
        const dd = new Date(task.dueDate); endH = dd.getHours(); endM = dd.getMinutes()
        startH = Math.max(0, endH - 1); startM = endM
      } else {
        // Date-only task: stack in 1-hour slots starting from 00:00
        isDateOnly = true
        startH = dateOnlyOffset; startM = 0
        endH = startH + 1; endM = 0
        dateOnlyOffset++
      }
    } else if (!hasTimeOnTarget && endH - startH >= 12) {
      // Cross-day task without time: show compactly
      isDateOnly = true
      startH = dateOnlyOffset; startM = 0
      endH = startH + 1; endM = 0
      dateOnlyOffset++
    }

    const startMin = startH * 60 + startM, endMin = endH * 60 + endM
    const top = (startMin / 30) * SLOT_HEIGHT
    const height = Math.max(((endMin - startMin) / 30) * SLOT_HEIGHT, 24)
    return {
      ...task,
      _barStyle: { top: top + 'px', height: height + 'px', width: isDateOnly ? 'calc(100% - 72px)' : 'calc(100% - 12px)', left: isDateOnly ? '60px' : '6px' },
      _hasTimeOnTarget: hasTimeOnTarget,
      _isDateOnly: isDateOnly,
      _startMin: startMin,
      _endMin: endMin
    }
  })
})

const getDayBarStyle = (task: any) => {
  return task._barStyle || { top: '0px', height: '24px', width: 'calc(100% - 12px)' }
}

const getDayBarTimeLabel = (task: any) => {
  if (!task._hasTimeOnTarget) return ''
  const targetDate = new Date(dayBarDate.value).toDateString()
  let s = '', e = ''
  if (task.startDate && new Date(task.startDate).toDateString() === targetDate && hasTimeComponent(task.startDate)) s = formatTime(task.startDate)
  if (task.dueDate && new Date(task.dueDate).toDateString() === targetDate && hasTimeComponent(task.dueDate)) e = formatTime(task.dueDate)
  if (s && e) return `${s} - ${e}`
  if (s) return `${s} 起`
  if (e) return `${e} 止`
  return ''
}

// ===== 日条形视图拖拽 =====
const getMinuteFromY = (clientY: number): number => {
  const track = document.querySelector('.daybar-track') as HTMLElement
  if (!track) return -1
  const rect = track.getBoundingClientRect()
  const relY = clientY - rect.top + track.scrollTop
  const minute = Math.round((relY / SLOT_HEIGHT) * 30 / 15) * 15 // snap to 15 min
  return Math.max(0, Math.min(24 * 60, minute))
}

// Get start/end minutes from task for the target date
const getDayBarMinutes = (task: any) => {
  // Use stored actual minutes when available (avoids height-clamping inaccuracy)
  if (task._startMin !== undefined && task._endMin !== undefined) {
    return { startMin: task._startMin, endMin: task._endMin }
  }
  const targetDate = new Date(dayBarDate.value).toDateString()
  let startMin = 0, endMin = 24 * 60
  if (task.startDate && new Date(task.startDate).toDateString() === targetDate) {
    const sd = new Date(task.startDate); startMin = sd.getHours() * 60 + sd.getMinutes()
  }
  if (task.dueDate && new Date(task.dueDate).toDateString() === targetDate) {
    const dd = new Date(task.dueDate); endMin = dd.getHours() * 60 + dd.getMinutes()
  }
  if (endMin <= startMin) endMin = startMin + 60
  return { startMin, endMin }
}

const onDayBarPointerDown = (e: PointerEvent, task: any) => {
  if (dayBarDrag.value) return
  const { startMin, endMin } = getDayBarMinutes(task)
  const curMin = getMinuteFromY(e.clientY)
  dayBarDrag.value = { task, mode: 'move', startMin, endMin, grabMin: curMin, startY: e.clientY, moved: false }
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

const onDayBarResizeStart = (e: PointerEvent, task: any, side: 'top' | 'bottom') => {
  if (dayBarDrag.value) return
  const { startMin, endMin } = getDayBarMinutes(task)
  const curMin = getMinuteFromY(e.clientY)
  dayBarDrag.value = { task, mode: side === 'top' ? 'resize-top' : 'resize-bottom', startMin, endMin, grabMin: curMin, startY: e.clientY, moved: false }
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

const onDayBarPointerMove = (e: PointerEvent) => {
  if (!dayBarDrag.value) return
  if (!dayBarDrag.value.moved && Math.abs(e.clientY - dayBarDrag.value.startY) > 4) {
    dayBarDrag.value.moved = true
  }
  const curMin = getMinuteFromY(e.clientY)
  if (curMin < 0) return
  const dMin = curMin - dayBarDrag.value.grabMin
  let sm = dayBarDrag.value.startMin, em = dayBarDrag.value.endMin
  if (dayBarDrag.value.mode === 'move') {
    sm = Math.max(0, dayBarDrag.value.startMin + dMin)
    em = Math.min(24 * 60, dayBarDrag.value.endMin + dMin)
    if (sm < 0) { em -= sm; sm = 0 }
    if (em > 24 * 60) { sm -= (em - 24 * 60); em = 24 * 60 }
  } else if (dayBarDrag.value.mode === 'resize-top') {
    sm = Math.max(0, Math.min(em - 15, dayBarDrag.value.startMin + dMin))
  } else if (dayBarDrag.value.mode === 'resize-bottom') {
    em = Math.max(sm + 15, Math.min(24 * 60, dayBarDrag.value.endMin + dMin))
  }
  const top = (sm / 30) * SLOT_HEIGHT
  const h = Math.max(24, ((em - sm) / 30) * SLOT_HEIGHT)
  dayBarDragPreview.value = { top: top + 'px', height: h + 'px', width: 'calc(100% - 12px)', opacity: 0.7, background: 'rgba(64,158,255,0.3)' }
  const fmtMm = (mm: number) => `${String(Math.floor(mm/60)).padStart(2,'0')}:${String(mm%60).padStart(2,'0')}`
  dayBarDragHint.value = `${fmtMm(sm)} → ${fmtMm(em)}`
}

const onDayBarPointerUp = async () => {
  if (!dayBarDrag.value) return
  const { task, mode, startMin: origSm, endMin: origEm, moved } = dayBarDrag.value
  const preview = dayBarDragPreview.value
  const wasMoved = moved
  dayBarDrag.value = null; dayBarDragPreview.value = null; dayBarDragHint.value = ''
  if (wasMoved) dayBarSuppressClick.value = Date.now()
  if (!preview) { handleTaskClick(task); return }
  const targetDate = new Date(dayBarDate.value)
  const h = parseFloat(preview.height), top = parseFloat(preview.top)
  const sm = Math.round((top / SLOT_HEIGHT) * 30 / 15) * 15
  const em = Math.round(((top + h) / SLOT_HEIGHT) * 30 / 15) * 15
  if (Math.abs(sm - origSm) < 15 && Math.abs(em - origEm) < 15) return
  const update: any = {}
  // Preserve original date parts — use the task's actual dates, not the view date
  if (mode === 'resize-top' || mode === 'move') {
    // Don't create startDate for tasks that didn't have one
    if (mode !== 'move' || task.startDate) {
      const baseDate = task.startDate ? new Date(task.startDate) : new Date(targetDate)
      baseDate.setHours(Math.floor(sm / 60), sm % 60, 0, 0)
      update.startDate = formatLocalDateTime(baseDate)
    }
  }
  if (mode === 'resize-bottom' || mode === 'move') {
    const baseDate = task.dueDate ? new Date(task.dueDate) : new Date(targetDate)
    baseDate.setHours(Math.floor(em / 60), em % 60, 0, 0)
    update.dueDate = formatLocalDateTime(baseDate)
  }
  if (Object.keys(update).length > 0) {
    try {
      await taskApi.updateTaskTime(task.id, update)
      ElMessage.success('时间已更新')
      await loadTasks()
    } catch (err) { console.error('更新时间失败:', err); ElMessage.error('时间更新失败') }
  }
}

const onDayBarTrackClick = (e: MouseEvent) => {
  if (Date.now() - dayBarSuppressClick.value < 200) return
  const target = e.target as HTMLElement
  if (target.closest('.daybar-task') || target.closest('.time-tick')) return
  const minute = getMinuteFromY(e.clientY)
  if (minute < 0) return
  const h = Math.floor(minute / 60)
  const m = minute % 60
  openCreateWithTime(new Date(dayBarDate.value), { h, m })
}

// ===== 导航 =====
const prevPeriod = () => {
  if (viewMode.value === 'daybar') {
    const d = new Date(dayBarDate.value)
    d.setDate(d.getDate() - 1)
    dayBarDate.value = d
    return
  }
  const date = new Date(currentDate.value)
  if (viewMode.value === 'month' || (viewMode.value === 'bar' && barScale.value === 'month')) date.setMonth(date.getMonth() - 1)
  else if (viewMode.value === 'week' || (viewMode.value === 'bar' && barScale.value === 'week')) date.setDate(date.getDate() - 7)
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
  if (viewMode.value === 'month' || (viewMode.value === 'bar' && barScale.value === 'month')) date.setMonth(date.getMonth() + 1)
  else if (viewMode.value === 'week' || (viewMode.value === 'bar' && barScale.value === 'week')) date.setDate(date.getDate() + 7)
  else date.setDate(date.getDate() + 1)
  currentDate.value = date
}
const goToToday = () => {
  currentDate.value = new Date()
  dayBarDate.value = new Date()
}

// ===== 事件 =====
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
const handleTaskClick = (task: any) => emit('task-click', task)
const handleCompleteTask = async (task: any) => {
  try {
    if (task.status === 1) { await taskApi.uncompleteTask(task.id) }
    else { await taskApi.completeTask(task.id) }
    await loadTasks()
  } catch (err) { console.error('操作失败:', err) }
}
const handleCreateTask = async () => {
  if (!newTaskForm.value.title.trim()) { ElMessage.warning('请输入任务标题'); return }
  try {
    let dueDate = new Date(newTaskForm.value.dueDate)
    if (newTaskForm.value.time) { const time = new Date(newTaskForm.value.time); dueDate.setHours(time.getHours()); dueDate.setMinutes(time.getMinutes()) }
    const startDate = new Date()
    await taskApi.createTask({ title: newTaskForm.value.title, description: newTaskForm.value.description, startDate: formatLocalDateTime(startDate), dueDate: formatLocalDateTime(dueDate), priority: newTaskForm.value.priority, status: 0 })
    ElMessage.success('创建成功'); showCreateDialog.value = false; await loadTasks()
  } catch (err) { console.error('创建任务失败:', err) }
}
const handleFilterCommand = (command: string) => {
  if (command.startsWith('status-')) filters.value.status = command.replace('status-', '')
  else if (command.startsWith('priority-')) filters.value.priority = command.replace('priority-', '')
}

// ===== 数据加载 =====
const getVisibleDateRange = (): { start: string; end: string } => {
  if (viewMode.value === 'daybar') {
    const d = new Date(dayBarDate.value)
    d.setHours(0,0,0,0); const start = formatLocalDateTime(d)
    const e = new Date(d); e.setHours(23,59,59,999); const end = formatLocalDateTime(e)
    return { start, end }
  }
  if (viewMode.value === 'month' || (viewMode.value === 'bar' && barScale.value === 'month')) {
    const d = new Date(currentDate.value)
    const start = new Date(d.getFullYear(), d.getMonth(), 1); start.setDate(start.getDate() - 7)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59); end.setDate(end.getDate() + 7)
    return { start: formatLocalDateTime(start), end: formatLocalDateTime(end) }
  } else {
    const start = getWeekStart(currentDate.value); start.setDate(start.getDate() - 1)
    const end = new Date(start); end.setDate(end.getDate() + 8); end.setHours(23,59,59,999)
    return { start: formatLocalDateTime(start), end: formatLocalDateTime(end) }
  }
}

const loadTasks = async () => {
  try {
    const { start, end } = getVisibleDateRange()
    const res = await taskApi.getTasksByDateRange(start, end)
    allTasks.value = res.data || []
  } catch {
    try { const res = await taskApi.getTasks({ page: 0, size: 1000 }); allTasks.value = res.data.content || [] }
    catch (e) { console.error('加载任务失败:', e) }
  }
}

watch(() => viewMode.value, () => { loadTasks() })
watch(barScale, () => { if (viewMode.value === 'bar') loadTasks() })
watch(dayBarDate, () => { if (viewMode.value === 'daybar') loadTasks() })
onMounted(() => { loadTasks() })
</script>

<style scoped>
.calendar-container { height: 100%; display: flex; flex-direction: column; background: #fff; border-radius: 8px; overflow: hidden; }
.calendar-container :deep(.el-dropdown-menu__item.is-active) { color: #409EFF; font-weight: 600; background: #ecf5ff; }
.check-mark { display: inline-block; width: 18px; }
.calendar-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid #e8e8e8; background: #fafafa; flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; align-items: center; gap: 16px; }
.current-period { margin: 0; font-size: 18px; color: #303133; }
.toolbar-right { display: flex; align-items: center; gap: 12px; }

/* 日期指示器 */
.date-indicator { font-size: 10px; flex-shrink: 0; width: 14px; text-align: center; line-height: 1; }
.start-indicator { color: #67C23A; } .end-indicator { color: #F56C6C; } .both-indicator { color: #E6A23C; }

/* ===== 月视图 ===== */
.month-view { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.weekdays { display: grid; grid-template-columns: repeat(7, 1fr); background: #f5f7fa; border-bottom: 1px solid #e8e8e8; }
.weekday { padding: 10px; text-align: center; font-weight: 500; color: #606266; }
.days-grid { flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(100px, 1fr); overflow-y: auto; }
.day-cell { border-right: 1px solid #e8e8e8; border-bottom: 1px solid #e8e8e8; padding: 6px; cursor: pointer; position: relative; z-index: 1; transition: all 0.2s ease; box-sizing: border-box; }
.day-cell:not(.expanded) { overflow: hidden; }
.day-cell:hover { background-color: #f5f7fa; }
.day-cell.other-month { background-color: #fafafa; color: #c0c4cc; }
.day-cell.today { background-color: #ecf5ff; }
.day-cell.has-tasks { background-color: #fef0f0; }
.day-cell.expanded { z-index: 10; box-shadow: 0 4px 20px rgba(0,0,0,0.18); background: #fff; }
.day-cell.expanded .day-tasks { max-height: 280px; overflow-y: auto; }
.day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.day-number { font-weight: 500; font-size: 14px; }
.today-badge { background: #409EFF; color: #fff; padding: 1px 6px; border-radius: 4px; font-size: 11px; }
.day-tasks { display: flex; flex-direction: column; gap: 3px; overflow: hidden; transition: max-height 0.2s ease; }
.task-chip { display: flex; align-items: center; gap: 3px; padding: 3px 5px; background: #fff; border-radius: 3px; font-size: 11px; border-left: 3px solid #409EFF; transition: all 0.2s; }
.task-chip.priority-1 { border-left-color: #409EFF; } .task-chip.priority-2 { border-left-color: #E6A23C; } .task-chip.priority-3 { border-left-color: #F56C6C; }
.task-chip:hover { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.task-chip.completed { opacity: 0.6; } .task-chip.completed .task-title { text-decoration: line-through; }
.task-chip.overdue { border-left-color: #F56C6C; background: #fef0f0; }
.task-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.more-tasks { font-size: 11px; color: #909399; padding: 3px 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ===== 周视图 ===== */
.week-view { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.week-header { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid #e8e8e8; background: #f5f7fa; }
.week-day-header { padding: 10px; text-align: center; border-right: 1px solid #e8e8e8; box-sizing: border-box; min-width: 0; }
.week-day-header.last-col { border-right: none; }
.day-name { font-size: 12px; color: #909399; margin-bottom: 4px; }
.day-date { font-size: 18px; font-weight: 500; color: #303133; } .day-date.today { color: #409EFF; }
.week-content { flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); overflow-y: auto; }
.week-day-column { border-right: 1px solid #e8e8e8; padding: 8px; box-sizing: border-box; min-width: 0; cursor: pointer; }
.week-day-column:hover { background-color: #f5f7fa; }
.week-day-column.last-col { border-right: none; }
.day-tasks-list { display: flex; flex-direction: column; gap: 8px; }
.week-task-item { display: flex; align-items: flex-start; gap: 6px; padding: 8px; background: #f5f7fa; border-radius: 4px; cursor: pointer; border-left: 3px solid #409EFF; transition: all 0.2s; }
.week-task-item.priority-1 { border-left-color: #409EFF; } .week-task-item.priority-2 { border-left-color: #E6A23C; } .week-task-item.priority-3 { border-left-color: #F56C6C; }
.week-task-item:hover { background: #ecf5ff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.week-task-item.completed { opacity: 0.6; } .week-task-item.completed .task-title { text-decoration: line-through; }
.week-task-item.overdue { background: #fef0f0; border-left-color: #F56C6C; }
.task-info { flex: 1; min-width: 0; overflow: hidden; }
.task-info .task-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task-time { font-size: 12px; color: #909399; margin-top: 4px; }

/* ===== 日视图 ===== */
.day-view { flex: 1; overflow-y: auto; }
.day-timeline { display: flex; flex-direction: column; }
.time-slot { display: flex; border-bottom: 1px solid #e8e8e8; min-height: 60px; }
.time-label { width: 80px; padding: 8px; text-align: right; color: #909399; font-size: 12px; border-right: 1px solid #e8e8e8; }
.time-content { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
.timeline-task { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #f5f7fa; border-radius: 4px; border-left: 3px solid #409EFF; cursor: pointer; transition: all 0.2s; }
.timeline-task.priority-1 { border-left-color: #409EFF; } .timeline-task.priority-2 { border-left-color: #E6A23C; } .timeline-task.priority-3 { border-left-color: #F56C6C; }
.timeline-task:hover { background: #ecf5ff; } .timeline-task.completed { opacity: 0.6; } .timeline-task.completed .task-title { text-decoration: line-through; }
.timeline-task.overdue { background: #fef0f0; border-left-color: #F56C6C; }

/* ===== 条形视图 ===== */
.bar-view { flex: 1; display: flex; flex-direction: column; overflow: hidden; touch-action: none; }
.bar-header { display: grid; background: #f5f7fa; border-bottom: 1px solid #e8e8e8; position: sticky; top: 0; z-index: 2; user-select: none; }
.bar-header-cell { padding: 6px 2px; text-align: center; border-right: 1px solid #e8e8e8; font-size: 11px; box-sizing: border-box; cursor: pointer; }
.bar-header-cell:hover { background-color: #ecf5ff; }
.bar-header-cell.week-end { border-right: 2px solid #c0c4cc; }
.bar-header-month .bar-header-cell { padding: 4px 1px; font-size: 12px; }
.bar-header-cell.today { background: #ecf5ff; } .bar-header-cell.other-month { color: #c0c4cc; }
.bar-day-name { font-size: 10px; color: #909399; } .bar-day-num { font-weight: 500; }
.bar-rows { flex: 1; overflow-y: auto; }
.bar-row { display: grid; min-height: 36px; border-bottom: 1px solid #f0f0f0; align-items: center; cursor: pointer; transition: background 0.2s; padding: 2px 0; }
.bar-row:hover { background: #f5f7fa; }
.bar-item { display: flex; align-items: center; height: 28px; padding: 0 8px; border-radius: 4px; border: 2px solid; background: rgba(255,255,255,0.7); margin: 0 2px; overflow: hidden; transition: box-shadow 0.2s; position: relative; user-select: none; }
.bar-item.priority-1 { border-color: #409EFF; } .bar-item.priority-2 { border-color: #E6A23C; } .bar-item.priority-3 { border-color: #F56C6C; }
.bar-item:hover { box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
.bar-item.dragging { opacity: 0.6; }
.bar-title { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #303133; flex: 1; }
.resize-handle { position: absolute; top: 0; width: 6px; height: 100%; cursor: col-resize; z-index: 3; }
.resize-handle.left { left: 0; } .resize-handle.right { right: 0; }
.drag-hint { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.75); color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 12px; pointer-events: none; z-index: 100; }

/* ===== 日条形视图 ===== */
.daybar-view { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.daybar-header { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid #e8e8e8; background: #fafafa; }
.daybar-date-text { font-size: 14px; color: #606266; }
.daybar-timeline { flex: 1; display: flex; overflow-y: auto; position: relative; touch-action: none; }
.daybar-scale { width: 70px; flex-shrink: 0; border-right: 1px solid #e8e8e8; background: #fafafa; }
.time-slot-label { height: 30px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; font-size: 10px; color: #909399; }
.time-slot-label.hour { color: #606266; font-weight: 500; }
.daybar-track { flex: 1; position: relative; cursor: copy; }
.time-tick { position: absolute; left: 0; right: 0; height: 0; border-top: 1px solid #f0f0f0; pointer-events: none; }
.time-tick.hour { border-top-color: #e8e8e8; }
.daybar-task { position: absolute; left: 6px; right: 6px; border-radius: 4px; border: 2px solid; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 2px 8px; overflow: hidden; cursor: pointer; background: rgba(255,255,255,0.85); font-size: 11px; transition: box-shadow 0.2s; user-select: none; }
.daybar-task.priority-1 { border-color: #409EFF; } .daybar-task.priority-2 { border-color: #E6A23C; } .daybar-task.priority-3 { border-color: #F56C6C; }
.daybar-task:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 5; }
.daybar-task.dragging { opacity: 0.6; }
.daybar-task-title { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.daybar-task-time { font-size: 9px; color: #909399; }
.daybar-resize { position: absolute; left: 0; right: 0; height: 8px; cursor: row-resize; z-index: 3; }
.daybar-resize.top { top: 0; } .daybar-resize.bottom { bottom: 0; }
</style>

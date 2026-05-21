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
          <el-radio-button value="day">日</el-radio-button>
          <el-radio-button value="week">周</el-radio-button>
          <el-radio-button value="month">月</el-radio-button>
        </el-radio-group>
        
        <el-divider direction="vertical" />
        
        <el-dropdown @command="handleFilterCommand">
          <el-button size="small">
            <el-icon><Filter /></el-icon>
            筛选
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="status-all">全部状态</el-dropdown-item>
              <el-dropdown-item command="status-pending">未完成</el-dropdown-item>
              <el-dropdown-item command="status-completed">已完成</el-dropdown-item>
              <el-dropdown-item divided command="priority-high">高优先级</el-dropdown-item>
              <el-dropdown-item command="priority-medium">中优先级</el-dropdown-item>
              <el-dropdown-item command="priority-low">低优先级</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-if="viewMode === 'month'" class="month-view">
      <!-- 星期标题 -->
      <div class="weekdays">
        <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
      </div>
      
      <!-- 日期网格 -->
      <div class="days-grid">
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="day-cell"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'has-tasks': day.tasks.length > 0
          }"
          @click="handleDayClick(day)"
        >
          <div class="day-header">
            <span class="day-number">{{ day.dayNumber }}</span>
            <span v-if="day.isToday" class="today-badge">今</span>
          </div>
          
          <div class="day-tasks">
            <div
              v-for="task in day.tasks.slice(0, 3)"
              :key="task.id"
              class="task-chip"
              :class="{
                'completed': task.status === 1,
                'overdue': isOverdue(task),
                'high-priority': task.priority === 3
              }"
              @click.stop="handleTaskClick(task)"
            >
              <el-checkbox
                :model-value="task.status === 1"
                @click.stop
                @change="handleCompleteTask(task)"
              />
              <span class="task-title">{{ task.title }}</span>
            </div>
            <div v-if="day.tasks.length > 3" class="more-tasks">
              +{{ day.tasks.length - 3 }} 更多
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 周视图 -->
    <div v-else-if="viewMode === 'week'" class="week-view">
      <div class="week-header">
        <div v-for="day in weekDaysData" :key="day.date" class="week-day-header">
          <div class="day-name">{{ day.weekDay }}</div>
          <div class="day-date" :class="{ 'today': day.isToday }">{{ day.dayNumber }}</div>
        </div>
      </div>
      
      <div class="week-content">
        <div v-for="day in weekDaysData" :key="day.date" class="week-day-column">
          <div class="day-tasks-list">
            <div
              v-for="task in day.tasks"
              :key="task.id"
              class="week-task-item"
              :class="{
                'completed': task.status === 1,
                'overdue': isOverdue(task)
              }"
              @click="handleTaskClick(task)"
            >
              <el-checkbox
                :model-value="task.status === 1"
                @click.stop
                @change="handleCompleteTask(task)"
              />
              <div class="task-info">
                <div class="task-title">{{ task.title }}</div>
                <div v-if="task.dueDate" class="task-time">
                  {{ formatTime(task.dueDate) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日视图 -->
    <div v-else-if="viewMode === 'day'" class="day-view">
      <div class="day-timeline">
        <div v-for="hour in 24" :key="hour" class="time-slot">
          <div class="time-label">{{ String(hour - 1).padStart(2, '0') }}:00</div>
          <div class="time-content">
            <div
              v-for="task in getTasksByHour(hour - 1)"
              :key="task.id"
              class="timeline-task"
              :class="{
                'completed': task.status === 1,
                'overdue': isOverdue(task)
              }"
              @click="handleTaskClick(task)"
            >
              <el-checkbox
                :model-value="task.status === 1"
                @click.stop
                @change="handleCompleteTask(task)"
              />
              <span class="task-title">{{ task.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建任务对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建任务"
      width="500px"
    >
      <el-form :model="newTaskForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="newTaskForm.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="newTaskForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-form-item label="日期" required>
          <el-date-picker
            v-model="newTaskForm.dueDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="时间">
          <el-time-picker
            v-model="newTaskForm.time"
            placeholder="选择时间（选填）"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="newTaskForm.priority" placeholder="请选择优先级">
            <el-option label="低" :value="1" />
            <el-option label="中" :value="2" />
            <el-option label="高" :value="3" />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Filter } from '@element-plus/icons-vue'
import * as taskApi from '../api/task'

const viewMode = ref<'day' | 'week' | 'month'>('month')
const currentDate = ref(new Date())
const showCreateDialog = ref(false)
const allTasks = ref<any[]>([])

// 筛选状态
const filters = ref({
  status: 'all', // all, pending, completed
  priority: 'all' // all, high, medium, low
})

const newTaskForm = ref({
  title: '',
  description: '',
  dueDate: new Date(),
  time: null,
  priority: 2
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 筛选后的任务
const filteredTasks = computed(() => {
  return allTasks.value.filter(task => {
    // 状态筛选
    if (filters.value.status === 'pending' && task.status === 1) return false
    if (filters.value.status === 'completed' && task.status !== 1) return false
    
    // 优先级筛选
    if (filters.value.priority === 'high' && task.priority !== 3) return false
    if (filters.value.priority === 'medium' && task.priority !== 2) return false
    if (filters.value.priority === 'low' && task.priority !== 1) return false
    
    return true
  })
})

// 当前周期文本
const currentPeriodText = computed(() => {
  const date = currentDate.value
  if (viewMode.value === 'month') {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  } else if (viewMode.value === 'week') {
    const start = getWeekStart(date)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`
  } else {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }
})

const periodText = computed(() => {
  const texts = { day: '天', week: '周', month: '月' }
  return texts[viewMode.value]
})

// 月视图数据
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const startPadding = firstDay.getDay() // 月初需要填充的天数
  const daysInMonth = lastDay.getDate()
  
  const days = []
  
  // 上月日期
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push(createDayData(date, false))
  }
  
  // 当月日期
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    days.push(createDayData(date, true, weekDays[i]))
  }
  
  // 下月日期
  const remaining = 42 - days.length // 6行7列
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    days.push(createDayData(date, false))
  }
  
  return days
})

// 周视图数据
const weekDaysData = computed(() => {
  const start = getWeekStart(currentDate.value)
  const days = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    days.push(createDayData(date, true, weekDays[i]))
  }
  
  return days
})

// 创建日期数据
const createDayData = (date: Date, isCurrentMonth: boolean, weekDay?: string) => {
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  const tasks = filteredTasks.value.filter(task => {
    if (!task.dueDate) return false
    const taskDate = new Date(task.dueDate)
    return taskDate.toDateString() === date.toDateString()
  })
  
  return {
    date: date.toISOString(),
    dayNumber: date.getDate(),
    weekDay: weekDay || '',
    isCurrentMonth,
    isToday,
    tasks
  }
}

// 获取周开始日期
const getWeekStart = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return d
}

// 按小时获取任务
const getTasksByHour = (hour: number) => {
  const dateStr = currentDate.value.toDateString()
  return filteredTasks.value.filter(task => {
    if (!task.dueDate) return false
    const taskDate = new Date(task.dueDate)
    return taskDate.toDateString() === dateStr && taskDate.getHours() === hour
  })
}

// 判断是否逾期
const isOverdue = (task: any) => {
  if (!task.dueDate || task.status === 1) return false
  const dueDate = new Date(task.dueDate)
  const now = new Date()
  return dueDate < now
}

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 导航操作
const prevPeriod = () => {
  const date = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    date.setMonth(date.getMonth() - 1)
  } else if (viewMode.value === 'week') {
    date.setDate(date.getDate() - 7)
  } else {
    date.setDate(date.getDate() - 1)
  }
  currentDate.value = date
}

const nextPeriod = () => {
  const date = new Date(currentDate.value)
  if (viewMode.value === 'month') {
    date.setMonth(date.getMonth() + 1)
  } else if (viewMode.value === 'week') {
    date.setDate(date.getDate() + 7)
  } else {
    date.setDate(date.getDate() + 1)
  }
  currentDate.value = date
}

const goToToday = () => {
  currentDate.value = new Date()
}

// 点击日期
const handleDayClick = (day: any) => {
  newTaskForm.value.dueDate = new Date(day.date)
  newTaskForm.value.title = ''
  newTaskForm.value.description = ''
  newTaskForm.value.time = null
  newTaskForm.value.priority = 2
  showCreateDialog.value = true
}

// 点击任务
const handleTaskClick = (task: any) => {
  // 可以打开编辑对话框
  ElMessage.info(`点击了任务: ${task.title}`)
}

// 完成任务
const handleCompleteTask = async (task: any) => {
  try {
    if (task.status === 1) {
      // 取消完成
      await taskApi.uncompleteTask(task.id)
      ElMessage.success('已取消完成')
    } else {
      // 完成任务
      await taskApi.completeTask(task.id)
      ElMessage.success('任务已完成')
    }
    await loadTasks()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

// 创建任务
const handleCreateTask = async () => {
  if (!newTaskForm.value.title.trim()) {
    ElMessage.warning('请输入任务标题')
    return
  }
  
  try {
    let dueDate = new Date(newTaskForm.value.dueDate)
    
    // 如果选择了时间，合并到日期中
    if (newTaskForm.value.time) {
      const time = new Date(newTaskForm.value.time)
      dueDate.setHours(time.getHours())
      dueDate.setMinutes(time.getMinutes())
    }
    
    await taskApi.createTask({
      title: newTaskForm.value.title,
      description: newTaskForm.value.description,
      dueDate: dueDate.toISOString(),
      priority: newTaskForm.value.priority,
      status: 0
    })
    
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    await loadTasks()
  } catch (error) {
    console.error('创建任务失败:', error)
  }
}

// 筛选命令
const handleFilterCommand = (command: string) => {
  if (command.startsWith('status-')) {
    filters.value.status = command.replace('status-', '')
    const statusText = {
      'all': '全部状态',
      'pending': '未完成',
      'completed': '已完成'
    }
    ElMessage.success(`已筛选：${statusText[filters.value.status as keyof typeof statusText]}`)
  } else if (command.startsWith('priority-')) {
    filters.value.priority = command.replace('priority-', '')
    const priorityText = {
      'all': '全部优先级',
      'high': '高优先级',
      'medium': '中优先级',
      'low': '低优先级'
    }
    ElMessage.success(`已筛选：${priorityText[filters.value.priority as keyof typeof priorityText]}`)
  }
}

// 加载任务
const loadTasks = async () => {
  try {
    const res = await taskApi.getTasks({ page: 0, size: 1000 })
    allTasks.value = res.data.content || []
  } catch (error) {
    console.error('加载任务失败:', error)
  }
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.calendar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

/* 工具栏 */
.calendar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-period {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 月视图 */
.month-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f5f7fa;
  border-bottom: 1px solid #e8e8e8;
}

.weekday {
  padding: 12px;
  text-align: center;
  font-weight: 500;
  color: #606266;
}

.days-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(100px, 1fr);
  overflow-y: auto;
}

.day-cell {
  border-right: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.day-cell:hover {
  background-color: #f5f7fa;
}

.day-cell.other-month {
  background-color: #fafafa;
  color: #c0c4cc;
}

.day-cell.today {
  background-color: #ecf5ff;
}

.day-cell.has-tasks {
  background-color: #fef0f0;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.day-number {
  font-weight: 500;
  font-size: 14px;
}

.today-badge {
  background: #409EFF;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: #fff;
  border-radius: 4px;
  font-size: 12px;
  border-left: 3px solid #409EFF;
  transition: all 0.2s;
}

.task-chip:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.task-chip.completed {
  opacity: 0.6;
}

.task-chip.completed .task-title {
  text-decoration: line-through;
}

.task-chip.overdue {
  border-left-color: #F56C6C;
  background: #fef0f0;
}

.task-chip.high-priority {
  border-left-color: #E6A23C;
}

.task-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-tasks {
  font-size: 12px;
  color: #909399;
  padding: 4px 6px;
}

/* 周视图 */
.week-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #e8e8e8;
  background: #f5f7fa;
}

.week-day-header {
  padding: 12px;
  text-align: center;
  border-right: 1px solid #e8e8e8;
}

.day-name {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.day-date {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.day-date.today {
  color: #409EFF;
}

.week-content {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  overflow-y: auto;
}

.week-day-column {
  border-right: 1px solid #e8e8e8;
  padding: 8px;
}

.day-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.week-task-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.week-task-item:hover {
  background: #ecf5ff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.week-task-item.completed {
  opacity: 0.6;
}

.week-task-item.completed .task-title {
  text-decoration: line-through;
}

.week-task-item.overdue {
  background: #fef0f0;
}

.task-info {
  flex: 1;
}

.task-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 日视图 */
.day-view {
  flex: 1;
  overflow-y: auto;
}

.day-timeline {
  display: flex;
  flex-direction: column;
}

.time-slot {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  min-height: 60px;
}

.time-label {
  width: 80px;
  padding: 8px;
  text-align: right;
  color: #909399;
  font-size: 12px;
  border-right: 1px solid #e8e8e8;
}

.time-content {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-task {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.timeline-task:hover {
  background: #ecf5ff;
}

.timeline-task.completed {
  opacity: 0.6;
}

.timeline-task.completed .task-title {
  text-decoration: line-through;
}

.timeline-task.overdue {
  background: #fef0f0;
}
</style>

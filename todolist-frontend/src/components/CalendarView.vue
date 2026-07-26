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
          <el-button size="small"
            ><el-icon><Filter /></el-icon>筛选</el-button
          >
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                command="status-all"
                :class="{ 'is-active': filters.status === 'all' }"
              >
                <span class="check-mark">{{ filters.status === 'all' ? '✓' : '' }}</span
                >全部状态
              </el-dropdown-item>
              <el-dropdown-item
                command="status-pending"
                :class="{ 'is-active': filters.status === 'pending' }"
              >
                <span class="check-mark">{{ filters.status === 'pending' ? '✓' : '' }}</span
                >未完成
              </el-dropdown-item>
              <el-dropdown-item
                command="status-completed"
                :class="{ 'is-active': filters.status === 'completed' }"
              >
                <span class="check-mark">{{ filters.status === 'completed' ? '✓' : '' }}</span
                >已完成
              </el-dropdown-item>
              <el-dropdown-item
                divided
                command="priority-high"
                :class="{ 'is-active': filters.priority === 'high' }"
              >
                <span class="check-mark">{{ filters.priority === 'high' ? '✓' : '' }}</span
                >高优先级
              </el-dropdown-item>
              <el-dropdown-item
                command="priority-medium"
                :class="{ 'is-active': filters.priority === 'medium' }"
              >
                <span class="check-mark">{{ filters.priority === 'medium' ? '✓' : '' }}</span
                >中优先级
              </el-dropdown-item>
              <el-dropdown-item
                command="priority-low"
                :class="{ 'is-active': filters.priority === 'low' }"
              >
                <span class="check-mark">{{ filters.priority === 'low' ? '✓' : '' }}</span
                >低优先级
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
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="day-cell"
          :class="{
            'other-month': !day.isCurrentMonth,
            today: day.isToday,
            'has-tasks': day.tasks.length > 0,
            expanded: hoveredDay === day.date,
          }"
          @click="handleDayClick(day)"
          @mouseenter="hoveredDay = day.date"
          @mouseleave="hoveredDay = null"
        >
          <div class="day-header">
            <span class="day-number">{{ day.dayNumber }}</span>
            <span v-if="day.isToday" class="today-badge">今</span>
          </div>
          <div class="day-tasks">
            <div
              v-for="task in hoveredDay === day.date ? day.tasks : day.tasks.slice(0, 2)"
              :key="task.id"
              class="task-chip"
              :class="[
                'priority-' + (task.priority || 2),
                { completed: task.status === 1, overdue: isOverdue(task) },
              ]"
              @click.stop="handleTaskClick(task)"
            >
              <span
                v-if="getTaskDateType(task, day.date) === 'start'"
                class="date-indicator start-indicator"
                title="开始日"
                >&#9654;</span
              >
              <span
                v-else-if="getTaskDateType(task, day.date) === 'end'"
                class="date-indicator end-indicator"
                title="结束日"
                >&#9632;</span
              >
              <span
                v-else-if="getTaskDateType(task, day.date) === 'both'"
                class="date-indicator both-indicator"
                title="开始&结束"
                >&#9679;</span
              >
              <el-checkbox
                :model-value="task.status === 1"
                @click.stop
                @change="handleCompleteTask(task)"
              />
              <span class="task-title">{{ task.title }}</span>
            </div>
            <div
              v-if="!hoveredDay || hoveredDay !== day.date"
              v-show="day.tasks.length > 2"
              class="more-tasks"
            >
              +{{ day.tasks.length - 2 }} 更多
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 周视图 ===== -->
    <div v-else-if="viewMode === 'week'" class="week-view">
      <div class="week-header">
        <div
          v-for="day in weekDaysData"
          :key="day.date"
          class="week-day-header"
          :class="{ 'last-col': day === weekDaysData[6] }"
        >
          <div class="day-name">{{ day.weekDay }}</div>
          <div class="day-date" :class="{ today: day.isToday }">{{ day.dayNumber }}</div>
        </div>
      </div>
      <div class="week-content">
        <div
          v-for="day in weekDaysData"
          :key="day.date"
          class="week-day-column"
          :class="{ 'last-col': day === weekDaysData[6] }"
          @click="openCreateWithTime(new Date(day.date))"
        >
          <div class="day-tasks-list">
            <div
              v-for="task in day.tasks"
              :key="task.id"
              class="week-task-item"
              :class="[
                'priority-' + (task.priority || 2),
                { completed: task.status === 1, overdue: isOverdue(task) },
              ]"
              @click.stop="handleTaskClick(task)"
            >
              <span
                v-if="getTaskDateType(task, day.date) === 'start'"
                class="date-indicator start-indicator"
                title="开始日"
                >&#9654;</span
              >
              <span
                v-else-if="getTaskDateType(task, day.date) === 'end'"
                class="date-indicator end-indicator"
                title="结束日"
                >&#9632;</span
              >
              <span
                v-else-if="getTaskDateType(task, day.date) === 'both'"
                class="date-indicator both-indicator"
                title="开始&结束"
                >&#9679;</span
              >
              <el-checkbox
                :model-value="task.status === 1"
                @click.stop
                @change="handleCompleteTask(task)"
              />
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
            <div
              v-for="task in getTasksByHour(hour - 1)"
              :key="task.id"
              class="timeline-task"
              :class="[
                'priority-' + (task.priority || 2),
                { completed: task.status === 1, overdue: isOverdue(task) },
              ]"
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

    <!-- ===== 条形视图 ===== -->
    <div
      v-else-if="viewMode === 'bar'"
      class="bar-view"
      @pointermove="onBarPointerMove"
      @pointerup="onBarPointerUp"
      @pointerleave="onBarPointerUp"
    >
      <div
        class="bar-header"
        :style="barHeaderStyle"
        :class="{ 'bar-header-month': barScale === 'month' }"
      >
        <div
          v-for="(day, i) in barDays"
          :key="day.date"
          class="bar-header-cell"
          :class="{
            today: day.isToday,
            'other-month': !day.isCurrentMonth,
            'week-end': barScale === 'month' && (i + 1) % 7 === 0,
          }"
          @click.stop="openCreateWithTime(new Date(day.date))"
        >
          <div v-if="barScale === 'week'" class="bar-day-name">{{ day.weekDay }}</div>
          <div class="bar-day-num">{{ day.dayNumber }}</div>
        </div>
      </div>
      <div class="bar-rows">
        <div
          v-for="task in barTasks"
          :key="task.id"
          class="bar-row"
          :style="barRowStyle"
          @click.stop="handleTaskClick(task)"
        >
          <el-tooltip placement="top" :show-after="500" :content="taskTooltipContent(task)">
            <div
              class="bar-item"
              :class="[
                'priority-' + (task.priority || 2),
                { dragging: dragState?.task?.id === task.id },
              ]"
              :style="
                dragState?.task?.id === task.id && dragPreviewStyle
                  ? dragPreviewStyle
                  : getBarStyle(task)
              "
              @pointerdown.prevent.stop="onBarPointerDown($event, task)"
            >
              <div
                class="resize-handle left"
                @pointerdown.prevent.stop="onResizeStart($event, task, 'left')"
              ></div>
              <span class="bar-title">{{ task.title }}</span>
              <div
                class="resize-handle right"
                @pointerdown.prevent.stop="onResizeStart($event, task, 'right')"
              ></div>
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
        <el-date-picker
          v-model="dayBarDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="loadTasks"
        />
        <el-button
          @click="dayBarDate = new Date(); loadTasks()"
          >今天</el-button
        >
        <span class="daybar-date-text">{{ dayBarDateText }}</span>
      </div>
      <div
        class="daybar-timeline"
        @pointermove="onDayBarPointerMove"
        @pointerup="onDayBarPointerUp"
        @pointerleave="onDayBarPointerUp"
      >
        <div class="daybar-scale">
          <div
            v-for="slot in timeSlots"
            :key="slot.label"
            class="time-slot-label"
            :class="{ hour: slot.isHour }"
          >
            {{ slot.label }}
          </div>
        </div>
        <div
          class="daybar-track"
          :style="{ height: 48 * SLOT_HEIGHT + 'px' }"
          @click="onDayBarTrackClick"
        >
          <div
            v-for="tick in timeTicks"
            :key="tick.top"
            class="time-tick"
            :style="{ top: tick.top + 'px' }"
            :class="{ hour: tick.isHour }"
          ></div>
          <div
            v-for="task in dayBarTasks"
            :key="task.id"
            class="daybar-task"
            :class="[
              'priority-' + (task.priority || 2),
              { dragging: dayBarDrag?.task?.id === task.id },
            ]"
            :style="
              dayBarDrag?.task?.id === task.id && dayBarDragPreview
                ? dayBarDragPreview
                : getDayBarStyle(task)
            "
            @click.stop="handleTaskClick(task)"
            @pointerdown.prevent.stop="onDayBarPointerDown($event, task)"
          >
            <div
              class="daybar-resize top"
              @pointerdown.prevent.stop="onDayBarResizeStart($event, task, 'top')"
            ></div>
            <span class="daybar-task-title">{{ task.title }}</span>
            <span class="daybar-task-time">{{ getDayBarTimeLabel(task) }}</span>
            <div
              class="daybar-resize bottom"
              @pointerdown.prevent.stop="onDayBarResizeStart($event, task, 'bottom')"
            ></div>
          </div>
        </div>
      </div>
      <div v-if="dayBarDragHint" class="drag-hint">{{ dayBarDragHint }}</div>
    </div>

    <!-- 新建任务对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建任务" width="500px">
      <el-form :model="newTaskForm" label-width="80px">
        <el-form-item label="标题" required
          ><el-input v-model="newTaskForm.title" placeholder="请输入任务标题"
        /></el-form-item>
        <el-form-item label="描述"
          ><el-input
            v-model="newTaskForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入任务描述"
        /></el-form-item>
        <el-form-item label="日期" required
          ><el-date-picker
            v-model="newTaskForm.dueDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
        /></el-form-item>
        <el-form-item label="时间"
          ><el-time-picker
            v-model="newTaskForm.time"
            placeholder="选择时间（选填）"
            style="width: 100%"
        /></el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="newTaskForm.priority" placeholder="请选择优先级">
            <el-option label="低" :value="1" /><el-option label="中" :value="2" /><el-option
              label="高"
              :value="3"
            />
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
import { Filter } from '@element-plus/icons-vue'
import { formatLocalDateTime } from '../utils/date'
import { useCalendarState } from '../composables/useCalendarState'
import { useCalendarGrid } from '../composables/useCalendarGrid'
import { useCalendarView } from '../composables/useCalendarView'
import { useCalendarTasks } from '../composables/useCalendarTasks'
import { useCalendarDrag } from '../composables/useCalendarDrag'

const emit = defineEmits<{ 'task-click': [task: any] }>()

// ===== State =====
const {
  viewMode, barScale, currentDate, showCreateDialog, allTasks, filters,
  hoveredDay, newTaskForm, weekDays, dayBarDate, SLOT_HEIGHT,
} = useCalendarState()

// ===== Tasks + filtering =====
const { filteredTasks, loadTasks, handleFilterCommand } = useCalendarTasks(
  allTasks, filters, viewMode, barScale, currentDate, dayBarDate,
)

// ===== Grid computed + helpers =====
const {
  calendarDays, weekDaysData, barDays, barHeaderStyle, barRowStyle, barTasks,
  timeSlots, timeTicks, dayBarTasks, dayBarDateText,
  getTasksByHour,
} = useCalendarGrid(currentDate, filteredTasks, barScale, dayBarDate, weekDays, SLOT_HEIGHT)

// ===== View navigation + actions =====
const {
  periodText, currentPeriodText, prevPeriod, nextPeriod, goToToday,
  openCreateWithTime, handleDayClick, handleCompleteTask, handleCreateTask,
} = useCalendarView(
  currentDate, viewMode, barScale, dayBarDate, weekDays,
  showCreateDialog, newTaskForm, loadTasks, formatLocalDateTime,
)

// ===== Drag =====
const {
  dragState, dragPreviewStyle, dragHint,
  dayBarDrag, dayBarDragPreview, dayBarDragHint, dayBarSuppressClick,
  onBarPointerDown, onResizeStart, onBarPointerMove, onBarPointerUp,
  onDayBarPointerDown, onDayBarResizeStart, onDayBarPointerMove, onDayBarPointerUp,
  onDayBarTrackClick,
} = useCalendarDrag(
  barDays, dayBarDate, SLOT_HEIGHT, loadTasks,
  (task: any) => emit('task-click', task),
  openCreateWithTime,
)

// ===== Local event handlers (emit-based) =====
const handleTaskClick = (task: any) => emit('task-click', task)

// Watches and onMounted are handled inside useCalendarTasks composable
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
.calendar-container :deep(.el-dropdown-menu__item.is-active) {
  color: #409eff;
  font-weight: 600;
  background: #ecf5ff;
}
.check-mark {
  display: inline-block;
  width: 18px;
}
.calendar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  flex-wrap: wrap;
  gap: 8px;
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

/* 日期指示器 */
.date-indicator {
  font-size: 10px;
  flex-shrink: 0;
  width: 14px;
  text-align: center;
  line-height: 1;
}
.start-indicator {
  color: #67c23a;
}
.end-indicator {
  color: #f56c6c;
}
.both-indicator {
  color: #e6a23c;
}

/* ===== 月视图 ===== */
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
  padding: 10px;
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
  padding: 6px;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.day-cell:not(.expanded) {
  overflow: hidden;
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
.day-cell.expanded {
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
  background: #fff;
}
.day-cell.expanded .day-tasks {
  max-height: 280px;
  overflow-y: auto;
}
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.day-number {
  font-weight: 500;
  font-size: 14px;
}
.today-badge {
  background: #409eff;
  color: #fff;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}
.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
  transition: max-height 0.2s ease;
}
.task-chip {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 5px;
  background: #fff;
  border-radius: 3px;
  font-size: 11px;
  border-left: 3px solid #409eff;
  transition: all 0.2s;
}
.task-chip.priority-1 {
  border-left-color: #409eff;
}
.task-chip.priority-2 {
  border-left-color: #e6a23c;
}
.task-chip.priority-3 {
  border-left-color: #f56c6c;
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
  border-left-color: #f56c6c;
  background: #fef0f0;
}
.task-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.more-tasks {
  font-size: 11px;
  color: #909399;
  padding: 3px 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 周视图 ===== */
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
  padding: 10px;
  text-align: center;
  border-right: 1px solid #e8e8e8;
  box-sizing: border-box;
  min-width: 0;
}
.week-day-header.last-col {
  border-right: none;
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
  color: #409eff;
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
  box-sizing: border-box;
  min-width: 0;
  cursor: pointer;
}
.week-day-column:hover {
  background-color: #f5f7fa;
}
.week-day-column.last-col {
  border-right: none;
}
.day-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.week-task-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
  border-left: 3px solid #409eff;
  transition: all 0.2s;
}
.week-task-item.priority-1 {
  border-left-color: #409eff;
}
.week-task-item.priority-2 {
  border-left-color: #e6a23c;
}
.week-task-item.priority-3 {
  border-left-color: #f56c6c;
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
  border-left-color: #f56c6c;
}
.task-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.task-info .task-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* ===== 日视图 ===== */
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
  border-left: 3px solid #409eff;
  cursor: pointer;
  transition: all 0.2s;
}
.timeline-task.priority-1 {
  border-left-color: #409eff;
}
.timeline-task.priority-2 {
  border-left-color: #e6a23c;
}
.timeline-task.priority-3 {
  border-left-color: #f56c6c;
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
  border-left-color: #f56c6c;
}

/* ===== 条形视图 ===== */
.bar-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  touch-action: none;
}
.bar-header {
  display: grid;
  background: #f5f7fa;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 2;
  user-select: none;
}
.bar-header-cell {
  padding: 6px 2px;
  text-align: center;
  border-right: 1px solid #e8e8e8;
  font-size: 11px;
  box-sizing: border-box;
  cursor: pointer;
}
.bar-header-cell:hover {
  background-color: #ecf5ff;
}
.bar-header-cell.week-end {
  border-right: 2px solid #c0c4cc;
}
.bar-header-month .bar-header-cell {
  padding: 4px 1px;
  font-size: 12px;
}
.bar-header-cell.today {
  background: #ecf5ff;
}
.bar-header-cell.other-month {
  color: #c0c4cc;
}
.bar-day-name {
  font-size: 10px;
  color: #909399;
}
.bar-day-num {
  font-weight: 500;
}
.bar-rows {
  flex: 1;
  overflow-y: auto;
}
.bar-row {
  display: grid;
  min-height: 36px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
  padding: 2px 0;
}
.bar-row:hover {
  background: #f5f7fa;
}
.bar-item {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 8px;
  border-radius: 4px;
  border: 2px solid;
  background: rgba(255, 255, 255, 0.7);
  margin: 0 2px;
  overflow: hidden;
  transition: box-shadow 0.2s;
  position: relative;
  user-select: none;
}
.bar-item.priority-1 {
  border-color: #409eff;
}
.bar-item.priority-2 {
  border-color: #e6a23c;
}
.bar-item.priority-3 {
  border-color: #f56c6c;
}
.bar-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
.bar-item.dragging {
  opacity: 0.6;
}
.bar-title {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #303133;
  flex: 1;
}
.resize-handle {
  position: absolute;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 3;
}
.resize-handle.left {
  left: 0;
}
.resize-handle.right {
  right: 0;
}
.drag-hint {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 100;
}

/* ===== 日条形视图 ===== */
.daybar-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.daybar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}
.daybar-date-text {
  font-size: 14px;
  color: #606266;
}
.daybar-timeline {
  flex: 1;
  display: flex;
  overflow-y: auto;
  position: relative;
  touch-action: none;
}
.daybar-scale {
  width: 70px;
  flex-shrink: 0;
  border-right: 1px solid #e8e8e8;
  background: #fafafa;
}
.time-slot-label {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  font-size: 10px;
  color: #909399;
}
.time-slot-label.hour {
  color: #606266;
  font-weight: 500;
}
.daybar-track {
  flex: 1;
  position: relative;
  cursor: copy;
}
.time-tick {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  border-top: 1px solid #f0f0f0;
  pointer-events: none;
}
.time-tick.hour {
  border-top-color: #e8e8e8;
}
.daybar-task {
  position: absolute;
  left: 6px;
  right: 6px;
  border-radius: 4px;
  border: 2px solid;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 2px 8px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  transition: box-shadow 0.2s;
  user-select: none;
}
.daybar-task.priority-1 {
  border-color: #409eff;
}
.daybar-task.priority-2 {
  border-color: #e6a23c;
}
.daybar-task.priority-3 {
  border-color: #f56c6c;
}
.daybar-task:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 5;
}
.daybar-task.dragging {
  opacity: 0.6;
}
.daybar-task-title {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.daybar-task-time {
  font-size: 9px;
  color: #909399;
}
.daybar-resize {
  position: absolute;
  left: 0;
  right: 0;
  height: 8px;
  cursor: row-resize;
  z-index: 3;
}
.daybar-resize.top {
  top: 0;
}
.daybar-resize.bottom {
  bottom: 0;
}
</style>

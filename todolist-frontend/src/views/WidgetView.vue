<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  getTasks,
  getTodayTasks,
  getUpcomingTasks,
  completeTask,
  uncompleteTask,
  createTask,
  deleteTask,
} from '../api/task'
import { getLists } from '../api/list'
import { isOverdue, formatDate } from '../composables/useDateUtils'
import { getRepeatLabel } from '../composables/useRepeatRule'
import { priorityClass } from '../composables/usePriority'
import { useTaskSync } from '../composables/useTaskSync'
import TaskEditPanel from '../components/TaskEditPanel.vue'
import type { Task, TaskList, ApiResponse, PageResponse } from '../types'

// ---- 筛选状态 ----
const currentFilter = ref<'all' | 'today' | 'upcoming' | number>('today')
const showFilterMenu = ref(false)
const lists = ref<TaskList[]>([])

const filterLabel = () => {
  if (currentFilter.value === 'all') return '全部任务'
  if (currentFilter.value === 'today') return '今日任务'
  if (currentFilter.value === 'upcoming') return '未来任务'
  const l = lists.value.find((l: TaskList) => l.id === currentFilter.value)
  return l ? l.name : '选择清单'
}

// ---- 任务列表 ----
const tasks = ref<Task[]>([])
const loading = ref(false)
const newTitle = ref('')

// ---- 编辑状态 ----
const showEditDialog = ref(false)
const editingTaskId = ref<number | null>(null)

const getEditingTask = () => tasks.value.find((t) => t.id === editingTaskId.value) || null

const handleEdit = (task: Task) => {
  editingTaskId.value = task.id
  showEditDialog.value = true
}

const onEditChanged = () => {
  loadTasks()
  emitTaskChanged()
}

// ---- 设置状态 ----
const showSettings = ref(false)
const defaultSettings: { theme: string; opacity: number; alwaysOnTop: boolean } = { theme: 'dark', opacity: 100, alwaysOnTop: true }
const settings = ref({ ...defaultSettings })
try {
  const saved = localStorage.getItem('widget-settings')
  if (saved) Object.assign(settings.value, JSON.parse(saved))
} catch (e) { console.warn('加载设置失败', e) }

const loadTasks = async () => {
  loading.value = true
  try {
    let res: ApiResponse<Task[] | PageResponse<Task>>
    const filter = currentFilter.value
    if (filter === 'today') {
      res = await getTodayTasks()
      tasks.value = res?.data || []
    } else if (filter === 'upcoming') {
      res = await getUpcomingTasks()
      tasks.value = res?.data || []
    } else if (typeof filter === 'number') {
      res = await getTasks({ listId: filter, page: 0, size: 500 })
      tasks.value = res?.data?.content || []
    } else {
      res = await getTasks({ page: 0, size: 500 })
      tasks.value = res?.data?.content || []
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

const loadLists = async () => {
  try {
    const res: ApiResponse<TaskList[]> = await getLists()
    lists.value = res?.data || []
  } catch (e) {
    console.error(e)
  }
}

// ---- 同步 ----
const { emitTaskChanged } = useTaskSync(() => loadTasks())

// ---- 任务操作 ----
const toggleTask = async (task: Task, e?: MouseEvent) => {
  if (e) {
    e.stopPropagation()
    e.preventDefault()
  }
  try {
    if (task.status === 1) {
      await uncompleteTask(task.id)
      task.status = 0
    } else {
      await completeTask(task.id)
      task.status = 1
    }
    emitTaskChanged()
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = async (task: Task, e?: MouseEvent) => {
  if (e) e.stopPropagation()
  try {
    await deleteTask(task.id)
    await loadTasks()
    emitTaskChanged()
  } catch (e) {
    console.error(e)
  }
}

const addTask = async () => {
  const title = newTitle.value.trim()
  if (!title) return
  try {
    await createTask({ title, status: 0, priority: 2 })
    newTitle.value = ''
    await loadTasks()
    emitTaskChanged()
  } catch (e) {
    console.error(e)
  }
}

// ---- 设置操作 ----
const isTauriEnv = !!(window as any).__TAURI_INTERNALS__

const applySettings = async () => {
  if (isTauriEnv) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow() as any
      await win.setAlwaysOnTop(settings.value.alwaysOnTop)
      await win.setOpacity(settings.value.opacity / 100)
    } catch (e) { console.error('Tauri 窗口操作失败', e) }
  } else {
    document.documentElement.style.opacity = String(settings.value.opacity / 100)
  }
  if (settings.value.theme === 'light') {
    document.documentElement.classList.add('widget-light')
  } else {
    document.documentElement.classList.remove('widget-light')
  }
  localStorage.setItem('widget-settings', JSON.stringify(settings.value))
}

// ---- 筛选操作 ----
const selectFilter = async (val: 'all' | 'today' | 'upcoming' | number) => {
  currentFilter.value = val
  showFilterMenu.value = false
  await loadTasks()
}

// ---- 优先级标签 ----

const handleClose = async () => {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    await getCurrentWindow().hide()
  } catch (e) {
    console.error(e)
  }
}

// ---- 生命周期 ----
onMounted(() => {
  loadLists()
  loadTasks()
  applySettings()
})

watch(settings, () => applySettings(), { deep: true })
</script>

<template>
  <div class="widget" :class="{ 'widget-light-theme': settings.theme === 'light' }">
    <!-- 完整编辑弹窗 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑任务"
      width="95%"
      :close-on-click-modal="false"
      destroy-on-close
      :class="settings.theme === 'light' ? 'widget-dialog-light' : 'widget-dialog-dark'"
    >
      <div :class="settings.theme === 'light' ? 'widget-light-theme' : ''" style="--bg: #1a1a2e">
        <TaskEditPanel
          v-if="editingTaskId"
          :task="getEditingTask()"
          mode="dialog"
          @close="showEditDialog = false"
          @changed="onEditChanged"
        />
      </div>
    </el-dialog>

    <!-- 头部：筛选器 + 设置 + 关闭 -->
    <div class="widget-header" data-tauri-drag-region>
      <div class="filter-dropdown" @click.stop="showFilterMenu = !showFilterMenu">
        <span class="filter-label">{{ filterLabel() }}</span>
        <span class="filter-arrow">▾</span>
      </div>
      <div class="header-actions" style="-webkit-app-region: no-drag">
        <button class="header-btn" @click="showSettings = !showSettings" title="设置">
          <span class="gear-icon">⚙</span>
        </button>
        <button class="header-btn header-close" @click="handleClose" title="关闭">
          <svg width="8" height="8" viewBox="0 0 8 8">
            <line x1="0.5" y1="0.5" x2="7.5" y2="7.5" stroke="currentColor" stroke-width="1.2" />
            <line x1="7.5" y1="0.5" x2="0.5" y2="7.5" stroke="currentColor" stroke-width="1.2" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 筛选菜单 -->
    <div v-if="showFilterMenu" class="filter-menu" @click.stop>
      <div
        class="filter-item"
        :class="{ active: currentFilter === 'all' }"
        @click="selectFilter('all')"
      >
        全部任务
      </div>
      <div
        class="filter-item"
        :class="{ active: currentFilter === 'today' }"
        @click="selectFilter('today')"
      >
        今日任务
      </div>
      <div
        class="filter-item"
        :class="{ active: currentFilter === 'upcoming' }"
        @click="selectFilter('upcoming')"
      >
        未来任务
      </div>
      <div class="filter-divider" />
      <div class="filter-section-title">我的清单</div>
      <div v-if="lists.length === 0" class="filter-item dim">暂无清单</div>
      <div
        v-for="l in lists"
        :key="l.id"
        class="filter-item"
        :class="{ active: currentFilter === l.id }"
        @click="selectFilter(l.id)"
      >
        {{ l.name }}
      </div>
    </div>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="settings-panel" @click.stop>
      <div class="settings-header">设置</div>
      <div class="settings-group">
        <label>颜色主题</label>
        <div class="theme-options">
          <button :class="{ active: settings.theme === 'dark' }" @click="settings.theme = 'dark'">
            深色
          </button>
          <button :class="{ active: settings.theme === 'light' }" @click="settings.theme = 'light'">
            浅色
          </button>
        </div>
      </div>
      <div class="settings-group">
        <label>不透明度: {{ settings.opacity }}%</label>
        <input type="range" min="30" max="100" step="5" v-model.number="settings.opacity" />
      </div>
      <div class="settings-group">
        <label class="toggle-label">
          <span>窗口置顶</span>
          <label class="toggle-switch">
            <input type="checkbox" v-model="settings.alwaysOnTop" />
            <span class="toggle-slider"></span>
          </label>
        </label>
      </div>
      <button class="settings-close-btn" @click="showSettings = false">关闭设置</button>
    </div>

    <!-- 任务列表 -->
    <div
      class="widget-body"
      @click="showFilterMenu = false; showSettings = false"
    >
      <div v-if="loading" class="widget-loading">加载中...</div>
      <div v-else-if="tasks.length === 0" class="widget-empty">
        {{ currentFilter === 'today' ? '今天没有待办任务' : '暂无任务' }}
      </div>
      <template v-else>
        <!-- 任务列表 -->
        <div
          v-for="task in tasks"
          :key="task.id"
          class="task-item"
          :class="{ done: task.status === 1 }"
          @contextmenu.prevent="handleEdit(task)"
        >
          <span
            class="task-check"
            :class="priorityClass(task.priority)"
            @click.stop="toggleTask(task, $event)"
            >{{ task.status === 1 ? '✔' : '○' }}</span
          >
          <div class="task-content" @click="handleEdit(task)">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-meta">
              <span v-if="task.priority === 3" class="tag-pri high">高</span>
              <span v-if="task.priority === 2" class="tag-pri mid">中</span>
              <span v-if="task.priority === 1" class="tag-pri low">低</span>
              <span v-if="task.repeatRule" class="tag-repeat"
                >🔄 {{ getRepeatLabel(task.repeatRule) }}</span
              >
              <span v-if="task.dueDate" class="tag-date" :class="{ overdue: isOverdue(task) }">
                {{ formatDate(task.dueDate) }}
              </span>
            </div>
          </div>
          <button class="task-del" @click.stop="handleDelete(task, $event)" title="删除">×</button>
        </div>
      </template>
    </div>

    <!-- 底部快速添加 -->
    <div class="widget-footer">
      <input
        v-model="newTitle"
        class="widget-input"
        placeholder="快速添加..."
        @keyup.enter="addTask"
      />
    </div>
  </div>
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  background: transparent;
  overflow: hidden;
  height: 100vh;
}

/* ---- 编辑对话框主题（必须在非 scoped 区域，因为 el-dialog 被 teleport 到 body） ---- */
.widget-dialog-dark {
  background: #1a1a2e !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
.widget-dialog-dark .el-dialog__header {
  background: #1a1a2e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.widget-dialog-dark .el-dialog__title {
  color: #e0e0e0;
  font-size: 14px;
}
.widget-dialog-dark .el-dialog__body {
  background: #1a1a2e;
  color: #e0e0e0;
}
.widget-dialog-dark .el-dialog__headerbtn .el-dialog__close {
  color: #888;
}
.widget-dialog-dark .el-dialog__headerbtn:hover .el-dialog__close {
  color: #e0e0e0;
}
.widget-dialog-dark .el-input__inner,
.widget-dialog-dark .el-textarea__inner {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}
.widget-dialog-dark .el-input__inner:focus,
.widget-dialog-dark .el-textarea__inner:focus {
  border-color: #667eea;
}
.widget-dialog-dark .el-tag--default,
.widget-dialog-dark .el-tag--info {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}
.widget-dialog-dark .el-button--default {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
}
.widget-dialog-dark .el-button--default:hover {
  background: rgba(255, 255, 255, 0.12);
}
.widget-dialog-dark .el-divider__text {
  background: #1a1a2e;
  color: #888;
}
.widget-dialog-dark .el-checkbox__label {
  color: #e0e0e0;
}

.widget-dialog-light {
  background: #f5f5f5 !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}
.widget-dialog-light .el-dialog__header {
  background: #f5f5f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.widget-dialog-light .el-dialog__title {
  color: #303133;
  font-size: 14px;
}
.widget-dialog-light .el-dialog__body {
  background: #f5f5f5;
  color: #303133;
}
.widget-dialog-light .el-dialog__headerbtn .el-dialog__close {
  color: #909399;
}
.widget-dialog-light .el-dialog__headerbtn:hover .el-dialog__close {
  color: #303133;
}
</style>

<style scoped>
/* ---- 主题变量 ---- */
.widget {
  --bg: #1a1a2e;
  --text: #e0e0e0;
  --text-secondary: #888;
  --border: rgba(255, 255, 255, 0.06);
  --hover: rgba(255, 255, 255, 0.06);
  --input-bg: rgba(255, 255, 255, 0.08);
  --panel-bg: #22223a;
  --btn-hover: rgba(255, 255, 255, 0.12);

  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  user-select: none;
}

.widget.widget-light-theme {
  --bg: #f5f5f5;
  --text: #303133;
  --text-secondary: #909399;
  --border: rgba(0, 0, 0, 0.08);
  --hover: rgba(0, 0, 0, 0.03);
  --input-bg: rgba(0, 0, 0, 0.05);
  --panel-bg: #ffffff;
  --btn-hover: rgba(0, 0, 0, 0.06);
}

/* ---- 头部 ---- */
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  flex-shrink: 0;
  gap: 8px;
}

.filter-dropdown {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}
.filter-dropdown:hover {
  background: var(--hover);
  color: var(--text);
}
.filter-arrow {
  font-size: 10px;
  opacity: 0.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.header-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.header-btn:hover {
  background: var(--btn-hover);
  color: var(--text);
}
.header-btn:active {
  transform: scale(0.92);
}
.header-close:hover {
  background: #e81123;
  color: #fff;
}
.header-close:active {
  transform: scale(0.92);
}
.gear-icon {
  font-size: 12px;
  line-height: 1;
}

/* ---- 筛选菜单 ---- */
.filter-menu {
  position: absolute;
  top: 32px;
  left: 8px;
  width: 160px;
  background: var(--panel-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 4px 0;
  z-index: 10;
  max-height: 60vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.filter-item {
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  color: var(--text);
}
.filter-item:hover {
  background: var(--hover);
}
.filter-item:active {
  background: rgba(102, 126, 234, 0.15);
}
.filter-item.active {
  color: #667eea;
  font-weight: 600;
}
.filter-item.dim {
  color: var(--text-secondary);
  cursor: default;
}

.filter-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 8px;
}
.filter-section-title {
  padding: 4px 12px;
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* ---- 设置面板 ---- */
.settings-panel {
  position: absolute;
  top: 32px;
  right: 8px;
  width: 220px;
  background: var(--panel-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.settings-header {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text);
}

.settings-group {
  margin-bottom: 10px;
}
.settings-group label {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.theme-options {
  display: flex;
  gap: 4px;
}
.theme-options button {
  flex: 1;
  padding: 4px 0;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: transparent;
  color: var(--text);
  font-size: 11px;
  cursor: pointer;
}
.theme-options button:hover:not(.active) {
  background: var(--hover);
}
.theme-options button:active {
  transform: scale(0.96);
}
.theme-options button.active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.settings-group input[type='range'] {
  width: 100%;
  accent-color: #667eea;
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-switch {
  position: relative;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
}
.toggle-switch input {
  display: none;
}
.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--input-bg);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}
.toggle-switch input:checked + .toggle-slider {
  background: #667eea;
}
.toggle-switch input:checked + .toggle-slider::after {
  transform: translateX(16px);
}

.settings-close-btn {
  width: 100%;
  padding: 5px;
  border: none;
  border-radius: 4px;
  background: var(--input-bg);
  color: var(--text);
  font-size: 11px;
  cursor: pointer;
  margin-top: 4px;
}
.settings-close-btn:hover {
  background: var(--btn-hover);
}

/* ---- 主体 ---- */
.widget-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 6px;
}

.widget-loading {
  text-align: center;
  padding: 24px 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.widget-empty {
  text-align: center;
  padding: 24px 0;
  color: var(--text-secondary);
  font-size: 12px;
}

/* ---- 任务项 ---- */
.task-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.task-item:hover {
  background: var(--hover);
}
.task-item.done {
  opacity: 0.55;
}
.task-item.done .task-title {
  text-decoration: line-through;
}

.task-check {
  font-size: 14px;
  flex-shrink: 0;
  color: var(--text-secondary);
  margin-top: 1px;
  cursor: pointer;
}
.task-check.pri-high {
  color: #f56c6c;
}
.task-check.pri-low {
  color: var(--text-secondary);
}
.task-item.done .task-check {
  color: #67c23a;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 12px;
  line-height: 1.4;
  word-break: break-word;
}

.task-meta {
  display: flex;
  gap: 4px;
  margin-top: 2px;
  font-size: 10px;
}

.tag-pri {
  padding: 0 4px;
  border-radius: 2px;
  font-weight: 600;
}
.tag-pri.high {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}
.tag-pri.mid {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}
.tag-pri.low {
  background: rgba(144, 147, 153, 0.2);
  color: #909399;
}

.tag-repeat {
  color: var(--text-secondary);
  font-size: 10px;
}

.tag-date {
  color: var(--text-secondary);
}
.tag-date.overdue {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.12);
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 600;
}

.task-del {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}
.task-item:hover .task-del {
  opacity: 0.6;
}
.task-del:hover {
  opacity: 1 !important;
  color: #f56c6c;
  background: var(--btn-hover);
}

/* ---- 编辑面板 ---- */

/* ---- 底部 ---- */
.widget-footer {
  padding: 6px 8px;
  flex-shrink: 0;
  border-top: 1px solid var(--border);
}

.widget-input {
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text);
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}
.widget-input::placeholder {
  color: var(--text-secondary);
}
.widget-input:focus {
  background: var(--btn-hover);
}

/* ---- 编辑对话框主题适配 ---- */
</style>

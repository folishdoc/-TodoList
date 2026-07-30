<template>
  <div>
    <!-- 任务视图片头 -->
    <div class="content-header">
      <h2>{{ pageTitle }}</h2>
      <div class="content-header-actions">
        <template v-if="batchMode">
          <el-button
            type="danger"
            :disabled="selectedTaskIds.size === 0"
            @click="$emit('batch-delete')"
          >
            <el-icon><Delete /></el-icon>
            删除选中 ({{ selectedTaskIds.size }})
          </el-button>
          <el-button @click="$emit('select-all')">全选</el-button>
          <el-button @click="$emit('clear-selection')">取消选择</el-button>
          <el-button @click="$emit('exit-batch-mode')">退出批量模式</el-button>
        </template>
        <template v-else>
          <el-button @click="$emit('enter-batch-mode')">批量操作</el-button>
          <el-button type="primary" @click="$emit('create-task')">
            <el-icon><Plus /></el-icon>
            新建任务
          </el-button>
        </template>
      </div>
    </div>

    <!-- 搜索框 -->
    <el-input
      v-if="activeMenu === 'all'"
      :model-value="searchKeyword"
      placeholder="搜索任务..."
      prefix-icon="Search"
      clearable
      style="margin-bottom: 20px"
      @update:model-value="$emit('update:searchKeyword', $event); $emit('search')"
      @clear="$emit('update:searchKeyword', ''); $emit('search')"
    />

    <!-- 任务列表 -->
    <el-card v-loading="loading" class="task-card">
      <div class="task-card-inner">
        <el-empty v-if="tasks.length === 0" description="暂无任务" />
        <div v-else class="task-list">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="task-item"
            :class="{
              completed: task.status === 1,
              subtask: task.parentId != null,
              'batch-selected': batchMode && selectedTaskIds.has(task.id),
            }"
            :style="{ paddingLeft: 20 + (task.level || 0) * 30 + 'px' }"
            @click.stop="batchMode ? $emit('toggle-task-selection', task.id) : $emit('edit-task', task)"
          >
            <span
              v-if="taskParentIds.has(task.id)"
              class="collapse-toggle"
              @click.stop="$emit('toggle-collapse', task.id)"
            >
              <el-icon :size="14">
                <template v-if="collapsedIds.has(task.id)">&#x25B6;</template>
                <template v-else>&#x25BC;</template>
              </el-icon>
            </span>
            <el-checkbox
              v-if="batchMode"
              :model-value="selectedTaskIds.has(task.id)"
              @click.stop
              @change="$emit('toggle-task-selection', task.id)"
            />
            <el-checkbox
              v-else
              :model-value="task.status === 1"
              @click.stop
              @change="$emit('toggle-complete', task)"
              :class="'priority-' + task.priority"
            />
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
            </div>
            <div v-if="!batchMode" class="task-actions">
              <!-- 时间提示 -->
              <span
                :class="['time-status', getTimeStatusClass(task)]"
                :style="{ visibility: getTimeStatus(task) ? 'visible' : 'hidden' }"
              >
                {{ getTimeStatus(task) || ' ' }}
              </span>
              <!-- 距离结束剩余天数 -->
              <span
                v-if="getDueDaysBadge(task).text"
                :class="['due-days-badge', getDueDaysClass(task)]"
              >
                {{ getDueDaysBadge(task).text }}
              </span>
              <el-button
                v-if="isOverdue(task)"
                size="small"
                type="warning"
                text
                @click.stop="$emit('postpone-task', task)"
                title="顺延至今天"
              >
                顺延
              </el-button>
              <el-button size="small" @click.stop="$emit('delete-task', task)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * TaskListView.vue — 任务列表渲染组件
 *
 * 负责渲染任务列表（全部/今日/未来/按清单分组），包含：
 * - 内容头部（标题 + 批量操作 / 新建任务）
 * - 搜索框（全部任务模式下）
 * - 任务项渲染（复选框、标题、时间状态、优先级标记、操作按钮）
 * - 子任务树展开/折叠
 * - 批量选择 UI
 *
 * 所有用户操作通过 emit 向上传递，由 Dashboard.vue 中的 composable 处理。
 */
import { isOverdue } from '../composables/useDateUtils'
import { getTimeStatus, getTimeStatusClass, getDueDaysBadge, getDueDaysClass } from '../composables/useTimeUtils'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { Task } from '../types'

defineProps<{
  tasks: (Task & { level: number })[]
  loading: boolean
  batchMode: boolean
  selectedTaskIds: Set<number>
  collapsedIds: Set<number>
  taskParentIds: Set<number>
  pageTitle: string
  searchKeyword: string
  activeMenu: string
}>()

defineEmits<{
  (e: 'edit-task', task: Task): void
  (e: 'toggle-complete', task: Task): void
  (e: 'delete-task', task: Task): void
  (e: 'postpone-task', task: Task): void
  (e: 'toggle-collapse', taskId: number): void
  (e: 'toggle-task-selection', taskId: number): void
  (e: 'select-all'): void
  (e: 'clear-selection'): void
  (e: 'exit-batch-mode'): void
  (e: 'enter-batch-mode'): void
  (e: 'batch-delete'): void
  (e: 'create-task'): void
  (e: 'update:searchKeyword', value: string): void
  (e: 'search'): void
}>()
</script>

<style scoped>
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.content-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-header h2 {
  margin: 0;
  font-size: 20px;
}

.task-list {
  overflow-y: auto;
  padding: 0;
  flex: 1;
}

.task-card {
  display: flex;
  flex-direction: column;
}

.task-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.task-card-inner {
  display: flex;
  flex-direction: column;
}

.task-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
  cursor: pointer;
}

.task-item :deep(.el-checkbox) {
  margin-top: 0;
  display: flex;
  align-items: center;
}

.task-item:hover {
  background-color: #f9f9f9;
}

.task-item.batch-selected {
  background-color: #ecf5ff;
  outline: 1px solid #409eff;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #999;
}

.task-item.subtask {
  background-color: #f8f9fa;
}

.collapse-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  color: #999;
  transition: color 0.2s;
}
.collapse-toggle:hover {
  color: #409eff;
}

.task-content {
  flex: 1;
  margin-left: 10px;
}

.task-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.task-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.task-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* 时间状态样式 */
.time-status {
  font-size: 13px;
  font-weight: 500;
  min-width: 80px;
  text-align: right;
  margin-right: 8px;
  display: inline-block;
}

.time-status-upcoming {
  color: #409eff;
}

.time-status-active {
  color: #409eff;
}

.time-status-overdue {
  color: #f56c6c;
}

.time-status-today {
  color: #e6a23c;
}

/* 距离结束剩余天数徽章 */
.due-days-badge {
  font-size: 13px;
  font-weight: 500;
  min-width: 80px;
  text-align: right;
  margin-right: 8px;
  display: inline-block;
  white-space: nowrap;
}

.due-days-badge-upcoming {
  color: #409eff;
}

.due-days-badge-today {
  color: #e6a23c;
  font-weight: 600;
}

.due-days-badge-overdue {
  color: #f56c6c;
}

.task-actions {
  display: flex;
  gap: 5px;
  align-items: center;
}

/* 优先级颜色 */
.priority-0 :deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #909399;
}

.priority-0 :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff;
  border-color: #909399;
}

.priority-0 :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #909399;
}

.priority-1 :deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #409eff;
}

.priority-1 :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff;
  border-color: #409eff;
}

.priority-1 :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #409eff;
}

.priority-2 :deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #e6a23c;
}

.priority-2 :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff;
  border-color: #e6a23c;
}

.priority-2 :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #e6a23c;
}

.priority-3 :deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #f56c6c;
}

.priority-3 :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff;
  border-color: #f56c6c;
}

.priority-3 :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #f56c6c;
}
</style>

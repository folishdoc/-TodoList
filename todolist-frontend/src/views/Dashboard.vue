<template>
  <div class="dashboard-container">
    <el-container>
      <!-- 图标导航栏 -->
      <el-aside width="60px" class="icon-sidebar">
        <div class="icon-nav">
          <div 
            class="nav-item" 
            :class="{ active: currentModule === 'tasks' }"
            @click="currentModule = 'tasks'"
            title="清单"
          >
            <el-icon :size="24"><List /></el-icon>
          </div>
          <div 
            class="nav-item" 
            :class="{ active: currentModule === 'calendar' }"
            @click="currentModule = 'calendar'"
            title="日历"
          >
            <el-icon :size="24"><Calendar /></el-icon>
          </div>
          <div 
            class="nav-item" 
            :class="{ active: currentModule === 'habits' }"
            @click="currentModule = 'habits'"
            title="习惯"
          >
            <el-icon :size="24"><TrendCharts /></el-icon>
          </div>
          <div
            class="nav-item"
            :class="{ active: currentModule === 'anniversaries' }"
            @click="currentModule = 'anniversaries'"
            title="纪念日"
          >
            <el-icon :size="24"><Clock /></el-icon>
          </div>
          <el-popover placement="right" :width="300" trigger="click" @show="loadReminders">
            <template #reference>
              <div class="nav-item bell-btn">
                <el-badge :value="unreadReminderCount" :hidden="unreadReminderCount === 0">
                  <el-icon :size="24"><Bell /></el-icon>
                </el-badge>
              </div>
            </template>
            <div class="reminder-popover">
              <h4>纪念日提醒</h4>
              <el-empty v-if="reminders.length === 0" description="暂无提醒" :image-size="40" />
              <div v-else class="reminder-list">
                <div v-for="r in reminders" :key="r.id" class="reminder-item" @click="handleReminderClick(r)">
                  <div class="reminder-name">{{ getReminderName(r.anniversaryId) }}</div>
                  <div class="reminder-time">{{ formatReminderTime(r.remindDatetime) }}</div>
                </div>
              </div>
            </div>
          </el-popover>
        </div>
      </el-aside>

      <!-- 主容器 -->
      <el-container>
        <!-- 侧边栏（仅清单模块显示） -->
        <el-aside v-if="currentModule === 'tasks'" width="250px" class="sidebar">
        <div class="logo">
          <h2>📝 Todolist</h2>
        </div>
        
        <el-menu :default-active="activeMenu" @select="handleMenuSelect">
          <el-menu-item index="all">
            <el-icon><List /></el-icon>
            <span>全部任务</span>
          </el-menu-item>
          <el-menu-item index="today">
            <el-icon><Calendar /></el-icon>
            <span>今日任务</span>
          </el-menu-item>
          <el-menu-item index="upcoming">
            <el-icon><Clock /></el-icon>
            <span>未来任务</span>
          </el-menu-item>
          
          <el-divider />
          
          <div class="list-header">
            <span>我的清单</span>
            <el-button type="primary" size="small" circle @click="showCreateListDialog = true">
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
          
          <el-menu-item
            v-for="list in taskLists"
            :key="list.id"
            :index="`list-${list.id}`"
            class="list-item"
          >
            <el-icon><Folder /></el-icon>
            <span class="list-name">{{ list.name }}</span>
            <el-button
              size="small"
              type="danger"
              link
              @click.stop="handleDeleteList(list)"
              class="delete-list-btn"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-menu-item>
          
          <el-divider />
          
          <el-menu-item index="statistics">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
          
          <el-menu-item index="tags">
            <el-icon><PriceTag /></el-icon>
            <span>标签管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="main-content" @click="handleMainContentClick">
        <!-- 清单模块 -->
        <div v-if="currentModule === 'tasks'">
          <!-- 任务视图 -->
          <div v-if="!['statistics', 'tags'].includes(activeMenu)">
          <div class="content-header">
            <h2>{{ pageTitle }}</h2>
            <div class="content-header-actions">
              <template v-if="batchMode">
                <el-button type="danger" :disabled="selectedTaskIds.size === 0" @click="handleBatchDelete">
                  <el-icon><Delete /></el-icon>
                  删除选中 ({{ selectedTaskIds.size }})
                </el-button>
                <el-button @click="handleSelectAll">全选</el-button>
                <el-button @click="selectedTaskIds.clear()">取消选择</el-button>
                <el-button @click="exitBatchMode">退出批量模式</el-button>
              </template>
              <template v-else>
                <el-button @click="enterBatchMode">批量操作</el-button>
                <el-button type="primary" @click="showCreateTaskDialog = true">
                  <el-icon><Plus /></el-icon>
                  新建任务
                </el-button>
              </template>
            </div>
          </div>

          <!-- 搜索框 -->
          <el-input
            v-if="activeMenu === 'all'"
            v-model="searchKeyword"
            placeholder="搜索任务..."
            prefix-icon="Search"
            clearable
            @input="handleSearch"
            style="margin-bottom: 20px"
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
                  'completed': task.status === 1,
                  'subtask': task.parentId != null,
                  'batch-selected': batchMode && selectedTaskIds.has(task.id)
                }"
                :style="{ paddingLeft: (20 + (task.level || 0) * 30) + 'px' }"
                @click.stop="batchMode ? toggleTaskSelection(task.id) : handleEditTask(task)"
              >
                <el-checkbox
                  v-if="batchMode"
                  :model-value="selectedTaskIds.has(task.id)"
                  @click.stop
                  @change="toggleTaskSelection(task.id)"
                />
                <el-checkbox
                  v-else
                  :model-value="task.status === 1"
                  @click.stop
                  @change="handleCompleteTask(task)"
                  :class="'priority-' + task.priority"
                />
                <div class="task-content">
                  <div class="task-title">{{ task.title }}</div>
                </div>
                <div v-if="!batchMode" class="task-actions">
                  <!-- 时间提示 -->
                  <span :class="['time-status', getTimeStatusClass(task)]" :style="{ visibility: getTimeStatus(task) ? 'visible' : 'hidden' }">
                    {{ getTimeStatus(task) || ' ' }}
                  </span>
                  <el-button v-if="isOverdue(task)" size="small" type="warning" text @click.stop="handlePostponeTask(task)" title="顺延至今天">
                    顺延
                  </el-button>
                  <el-button size="small" @click.stop="handleDeleteTask(task)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
            </div>
          </el-card>
        </div>

        <!-- 数据统计视图 -->
        <div v-else-if="activeMenu === 'statistics'" class="statistics-view">
          <StatisticsView />
        </div>

        <!-- 标签管理视图 -->
        <div v-else-if="activeMenu === 'tags'" class="tags-view">
          <TagsView />
        </div>
        </div>
        
        <!-- 日历模块 -->
        <div v-else-if="currentModule === 'calendar'" class="calendar-module">
          <CalendarView @task-click="handleCalendarTaskClick" />
        </div>
        
        <!-- 习惯模块（占位） -->
        <div v-else-if="currentModule === 'habits'" class="habits-module">
          <HabitsView />
        </div>
        
        <!-- 纪念日模块 -->
        <div v-else-if="currentModule === 'anniversaries'" class="anniversaries-module">
          <AnniversaryList />
        </div>
      </el-main>
      
      <!-- 右侧编辑面板（固定显示） -->
      <aside v-if="editingTask" class="edit-panel">
        <div class="memo-content">
          <!-- 标题区域 - 可直接编辑 -->
          <div class="memo-header">
            <el-input
              v-model="taskForm.title"
              placeholder="输入任务标题..."
              class="memo-title-input"
              @blur="autoSave"
            />
          </div>
          
          <!-- 元数据标签区域 -->
          <div class="memo-meta">
            <!-- 优先级 -->
            <el-dropdown @command="handlePriorityChange" trigger="click">
              <el-tag 
                :type="getPriorityType(taskForm.priority) || undefined" 
                size="default"
                class="meta-tag clickable"
              >
                <el-icon><Flag /></el-icon>
                {{ getPriorityText(taskForm.priority) }}优先级
              </el-tag>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="0">无优先级</el-dropdown-item>
                  <el-dropdown-item command="1">低优先级</el-dropdown-item>
                  <el-dropdown-item command="2">中优先级</el-dropdown-item>
                  <el-dropdown-item command="3">高优先级</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            
            <!-- 开始日期 -->
            <el-popover trigger="click" placement="bottom" :width="300">
              <template #reference>
                <el-tag size="default" class="meta-tag clickable" style="transition: none">
                  <el-icon><Calendar /></el-icon>
                  {{ taskForm.startDate ? formatDateShort(taskForm.startDate) : '设置开始时间' }}
                </el-tag>
              </template>
              <el-date-picker
                v-model="taskForm.startDate"
                type="datetime"
                placeholder="选择开始时间"
                :format="datePickerFormat"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
                @change="autoSave"
              />
            </el-popover>

            <!-- 截止日期 -->
            <el-popover trigger="click" placement="bottom" :width="300">
              <template #reference>
                <el-tag size="default" class="meta-tag clickable" :type="taskForm.dueDate ? 'warning' : undefined" style="transition: none">
                  <el-icon><Calendar /></el-icon>
                  {{ taskForm.dueDate ? formatDateShort(taskForm.dueDate) : '设置截止时间' }}
                </el-tag>
              </template>
              <el-date-picker
                v-model="taskForm.dueDate"
                type="datetime"
                placeholder="选择截止时间"
                :format="datePickerFormat"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
                @change="autoSave"
              />
            </el-popover>
            
            <!-- 清单 -->
            <el-dropdown @command="handleListChange" trigger="click">
              <el-tag size="default" class="meta-tag clickable" type="success">
                <el-icon><Folder /></el-icon>
                {{ getSelectedListName() }}
              </el-tag>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="null">无清单</el-dropdown-item>
                  <el-dropdown-item 
                    v-for="list in taskLists" 
                    :key="list.id" 
                    :command="list.id"
                  >
                    {{ list.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- 标签 -->
            <el-popover trigger="click" placement="bottom" :width="280">
              <template #reference>
                <el-tag size="default" class="meta-tag clickable" type="info">
                  <el-icon><PriceTag /></el-icon>
                  {{ taskTags.length > 0 ? `${taskTags.length}个标签` : '标签' }}
                </el-tag>
              </template>
              <el-select
                v-model="selectedTagIds"
                multiple
                filterable
                placeholder="选择标签"
                style="width: 100%"
                @change="handleTagChange"
                @visible-change="loadAllTags"
              >
                <el-option
                  v-for="tag in allTags"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.id"
                >
                  <span :style="{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: tag.color, marginRight: '8px', verticalAlign: 'middle' }"></span>
                  {{ tag.name }}
                </el-option>
              </el-select>
            </el-popover>
          </div>

          <!-- 已选标签展示 -->
          <div v-if="taskTags.length > 0" class="task-tags-row">
            <el-tag
              v-for="tag in taskTags"
              :key="tag.id"
              :color="tag.color"
              :style="{ backgroundColor: tag.color, borderColor: tag.color, color: '#fff', marginRight: '6px', marginBottom: '4px' }"
              size="small"
              closable
              @close="handleRemoveTag(tag.id)"
            >
              {{ tag.name }}
            </el-tag>
          </div>

          <!-- 描述区域 -->
          <div class="memo-description">
            <div class="section-header">
              <h4 class="section-title">描述</h4>
              <el-switch
                v-model="descriptionPreview"
                size="small"
                active-text="预览"
                inactive-text="编辑"
              />
            </div>
            <el-input
              v-if="!descriptionPreview"
              v-model="taskForm.description"
              type="textarea"
              :rows="8"
              placeholder="添加详细描述...（支持 Markdown）"
              class="memo-textarea"
              @blur="autoSave"
            />
            <div
              v-else
              class="markdown-preview"
              v-html="renderMarkdown(taskForm.description)"
            />
          </div>
          
          <!-- 子任务区域 -->
          <div class="memo-subtasks">
            <h4 class="section-title">子任务</h4>
            <el-empty v-if="!taskForm.subtasks || taskForm.subtasks.length === 0" description="暂无子任务" :image-size="60" />
            <div v-else class="subtask-list">
              <div v-for="(subtask, index) in taskForm.subtasks" :key="index" class="subtask-item">
                <el-checkbox v-model="subtask.completed" @change="autoSave" />
                <el-input
                  v-model="subtask.title"
                  size="small"
                  class="subtask-input"
                  @blur="autoSave"
                  @keyup.enter="handleSubtaskEnter(index)"
                />
                <el-button size="small" type="danger" link @click="removeSubtask(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <el-button type="primary" text @click="addSubtask" style="margin-top: 10px">
              <el-icon><Plus /></el-icon>
              添加子任务
            </el-button>
          </div>

          <!-- 附件区域 -->
          <div class="memo-attachments">
            <h4 class="section-title">附件</h4>
            <div class="attachment-upload">
              <input
                ref="fileInputRef"
                type="file"
                style="display: none"
                @change="handleFileSelect"
              />
              <el-button size="small" @click="triggerFileUpload" :loading="attachmentUploading">
                <el-icon><Upload /></el-icon>
                上传文件
              </el-button>
              <span class="upload-hint">最大 10MB</span>
            </div>
            <div v-if="taskAttachments.length > 0" class="attachment-list">
              <div v-for="att in taskAttachments" :key="att.id" class="attachment-item">
                <span class="attachment-name">{{ att.fileName }}</span>
                <span class="attachment-size">{{ formatFileSize(att.fileSize) }}</span>
                <el-button size="small" type="primary" link @click="downloadAttachment(att)">
                  <el-icon><Download /></el-icon>
                </el-button>
                <el-button size="small" type="danger" link @click="handleDeleteAttachment(att)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <el-empty v-else description="暂无附件" :image-size="40" />
          </div>
        </div>
      </aside>
      </el-container>
    </el-container>

    <!-- 新建任务对话框（保持对话框形式） -->
    <el-dialog
      v-model="showCreateTaskDialog"
      title="新建任务"
      width="600px"
    >
      <el-form :model="taskForm" :rules="taskRules" ref="taskFormRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="taskForm.priority" placeholder="请选择优先级">
            <el-option label="无" :value="0" />
            <el-option label="低" :value="1" />
            <el-option label="中" :value="2" />
            <el-option label="高" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="预定日期" prop="startDate">
          <el-date-picker
            v-model="taskForm.startDate"
            type="datetime"
            placeholder="任务开始时间（选填）"
            :format="datePickerFormat"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="截至日期" prop="dueDate">
          <el-date-picker
            v-model="taskForm.dueDate"
            type="datetime"
            placeholder="选择截止日期（选填）"
            :format="datePickerFormat"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="清单" prop="listId">
          <el-select v-model="taskForm.listId" placeholder="选择清单" clearable>
            <el-option
              v-for="list in taskLists"
              :key="list.id"
              :label="list.name"
              :value="list.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="重复">
          <el-select v-model="repeatForm.type" placeholder="不重复" clearable style="width: 100%" @change="onRepeatTypeChange">
            <el-option label="不重复" :value="null" />
            <el-option label="每天" value="DAILY" />
            <el-option label="每周" value="WEEKLY" />
            <el-option label="每月" value="MONTHLY" />
            <el-option label="每年" value="YEARLY" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="repeatForm.type" label="间隔">
          <el-input-number v-model="repeatForm.interval" :min="1" :max="365" style="width: 100%" />
          <div style="color: #909399; font-size: 12px; margin-top: 4px">
            每 {{ repeatForm.interval }} {{ getRepeatTypeText() }}
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateTaskDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitTask" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建清单对话框 -->
    <el-dialog v-model="showCreateListDialog" title="新建清单" width="400px">
      <el-form :model="listForm" :rules="listRules" ref="listFormRef" label-width="60px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="listForm.name" placeholder="请输入清单名称" />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="listForm.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateListDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitList" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { List, Calendar, Clock, Plus, Folder, Delete, DataAnalysis, PriceTag, TrendCharts, Flag, Bell, Upload, Download } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { marked } from 'marked'
import * as taskApi from '../api/task'
import * as batchApi from '../api/batch'
import * as listApi from '../api/list'
import * as tagApi from '../api/tag'
import * as attachmentApi from '../api/attachment'
import * as repeatApi from '../api/repeat'
import * as anniversaryApi from '../api/anniversary'
import { formatLocalDateTime } from '../utils/date'
import StatisticsView from '../components/StatisticsView.vue'
import TagsView from '../components/TagsView.vue'
import CalendarView from '../components/CalendarView.vue'
import HabitsView from '../components/HabitsView.vue'
import AnniversaryList from '../components/AnniversaryList.vue'

const currentModule = ref('tasks') // 当前模块: tasks, calendar, habits, anniversaries
const activeMenu = ref('all')
const loading = ref(false)
const submitLoading = ref(false)
const showCreateTaskDialog = ref(false)
const showCreateListDialog = ref(false)
const editingTask = ref<any>(null)
const taskFormRef = ref<FormInstance>()
const listFormRef = ref<FormInstance>()
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 批量选择
const batchMode = ref(false)
const selectedTaskIds = ref<Set<number>>(new Set())

const tasks = ref<any[]>([])
const taskLists = ref<any[]>([])
const allTags = ref<any[]>([])
const taskTags = ref<any[]>([])
const taskAttachments = ref<any[]>([])
const attachmentUploading = ref(false)
const descriptionPreview = ref(false)

// 纪念日提醒
const reminders = ref<any[]>([])
const unreadReminderCount = ref(0)
let reminderTimer: any = null

const loadReminders = async () => {
  try {
    const res = await anniversaryApi.getPendingReminders()
    reminders.value = res.data || []
    unreadReminderCount.value = reminders.value.filter((r: any) => !r.isRead).length
  } catch { /* 静默失败 */ }
}

const getReminderName = (anniversaryId: number) => {
  return `纪念日 #${anniversaryId}`
}

const formatReminderTime = (time: string) => {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const handleReminderClick = async (r: any) => {
  if (!r.isRead) {
    await anniversaryApi.markReminderRead(r.id)
    await loadReminders()
  }
  currentModule.value = 'anniversaries'
}

const taskForm = reactive({
  title: '',
  description: '',
  priority: 0,
  startDate: '',
  dueDate: '',
  listId: null as number | null,
  subtasks: [] as any[]
})

const listForm = reactive({
  name: '',
  color: '#409EFF'
})

const repeatForm = reactive({
  type: null as string | null,
  interval: 1
})

// 防抖定时器
let autoSaveTimer: any = null
const isSaving = ref(false)

const taskRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' }
  ],
  dueDate: [
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value && taskForm.startDate) {
          if (new Date(value) < new Date(taskForm.startDate)) {
            callback(new Error('结束时间不能早于开始时间'))
            return
          }
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  startDate: [
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value && taskForm.dueDate) {
          if (new Date(value) > new Date(taskForm.dueDate)) {
            callback(new Error('开始时间不能晚于结束时间'))
            return
          }
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

const listRules = {
  name: [
    { required: true, message: '请输入清单名称', trigger: 'blur' }
  ]
}

const pageTitle = computed(() => {
  const titles: any = {
    all: '全部任务',
    today: '今日任务',
    upcoming: '未来任务',
    statistics: '数据统计',
    tags: '标签管理'
  }
  if (activeMenu.value.startsWith('list-')) {
    const listId = parseInt(activeMenu.value.split('-')[1])
    const list = taskLists.value.find(l => l.id === listId)
    return list ? list.name : '清单'
  }
  return titles[activeMenu.value] || '全部任务'
})

// 加载任务列表
const loadTasks = async () => {
  loading.value = true
  try {
    let res
    if (searchKeyword.value) {
      res = await taskApi.searchTasks({ keyword: searchKeyword.value, page: currentPage.value - 1, size: pageSize.value })
      tasks.value = res.data.content
      total.value = res.data.totalElements
    } else {
      // 统一：加载全部任务（扁平列表）再构建树结构
      res = await taskApi.getTasks({ page: 0, size: 1000 })
      const allFlat: any[] = res.data.content || []

      // 构建映射
      const taskMap = new Map<number, any>()
      allFlat.forEach(t => taskMap.set(t.id, { ...t, level: 0 }))

      // 递归计算层级
      const calcLevel = (id: number): number => {
        const t = taskMap.get(id)
        if (!t || !t.parentId) return 0
        return calcLevel(t.parentId) + 1
      }
      taskMap.forEach(t => { t.level = calcLevel(t.id) })

      // 构建展平的树
      const buildFlatTree = (roots: any[]) => {
        const result: any[] = []
        const addChildren = (task: any) => {
          result.push(task)
          const children = Array.from(taskMap.values()).filter((t: any) => t.parentId === task.id)
          children.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          children.forEach(addChildren)
        }
        roots.forEach(addChildren)
        return result
      }

      // 筛选逻辑
      if (activeMenu.value === 'today') {
        const today = new Date().toDateString()
        const todayRoots = Array.from(taskMap.values()).filter((t: any) => {
          if (t.parentId) return false
          if (t.status === 1) return false
          if (t.dueDate && new Date(t.dueDate).toDateString() === today) return true
          if (t.startDate && new Date(t.startDate).toDateString() === today) return true
          if (t.startDate && t.dueDate) {
            const now = new Date(); now.setHours(0,0,0,0)
            const s = new Date(t.startDate); s.setHours(0,0,0,0)
            const e = new Date(t.dueDate); e.setHours(0,0,0,0)
            return now >= s && now <= e
          }
          return false
        })
        todayRoots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        tasks.value = buildFlatTree(todayRoots)
        total.value = tasks.value.length
      } else if (activeMenu.value === 'upcoming') {
        const now = new Date(); now.setHours(0,0,0,0)
        const upcomingRoots = Array.from(taskMap.values()).filter((t: any) => {
          if (t.parentId) return false
          if (t.status === 1) return false
          if (t.startDate && new Date(t.startDate) > now) return true
          if (t.dueDate && new Date(t.dueDate) > now) return true
          return false
        })
        upcomingRoots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        tasks.value = buildFlatTree(upcomingRoots)
        total.value = tasks.value.length
      } else if (activeMenu.value.startsWith('list-')) {
        const listId = parseInt(activeMenu.value.split('-')[1])
        const listRoots = Array.from(taskMap.values()).filter((t: any) => {
          if (t.parentId) return false
          return t.listId == listId
        })
        listRoots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        tasks.value = buildFlatTree(listRoots)
        total.value = tasks.value.length
      } else {
        // 'all' — 展示完整树
        const allRoots = Array.from(taskMap.values()).filter((t: any) => !t.parentId)
        allRoots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        tasks.value = buildFlatTree(allRoots)
        total.value = tasks.value.length
      }
    }
  } catch (error) {
    console.error('加载任务失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载清单列表
const loadLists = async () => {
  try {
    const res = await listApi.getLists()
    taskLists.value = res.data
  } catch (error) {
    console.error('加载清单失败:', error)
  }
}

// 菜单选择
const handleMenuSelect = (index: string) => {
  activeMenu.value = index
  currentPage.value = 1
  loadTasks()
}

// 搜索任务
const handleSearch = () => {
  currentPage.value = 1
  loadTasks()
}

// 撤销通知
const showUndo = (label: string, callback: () => void) => {
  ElMessage({
    message: label,
    type: 'success',
    duration: 4000,
    showClose: false,
    customClass: 'undo-message',
    onClose: () => { /* undo expired */ }
  })
  // 利用 setTimeout 追加撤销按钮到消息DOM
  setTimeout(() => {
    const messages = document.querySelectorAll('.el-message--success')
    messages.forEach(el => {
      if (el.textContent?.includes(label) && !el.querySelector('.undo-link')) {
        const btn = document.createElement('span')
        btn.textContent = '撤销'
        btn.className = 'undo-link'
        btn.style.cssText = 'margin-left:12px;color:#e6a23c;cursor:pointer;font-weight:500;text-decoration:underline'
        btn.onclick = () => {
          callback()
          el.remove()
        }
        el.appendChild(btn)
      }
    })
  }, 50)
}

// 完成任务
const handleCompleteTask = async (task: any) => {
  try {
    if (task.status === 1) {
      await taskApi.uncompleteTask(task.id)
      ElMessage.success('已取消完成')
    } else {
      await taskApi.completeTask(task.id)
      showUndo('任务已完成', async () => {
        await taskApi.uncompleteTask(task.id)
        loadTasks()
      })
    }
    loadTasks()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

// 日历中点击任务 → 打开同一个编辑面板
const handleCalendarTaskClick = (task: any) => {
  handleEditTask(task)
}

// 编辑任务
const handleEditTask = async (task: any) => {
  editingTask.value = task
  taskForm.title = task.title
  taskForm.description = task.description || ''
  taskForm.priority = task.priority
  taskForm.startDate = task.startDate || ''
  taskForm.dueDate = task.dueDate || ''
  taskForm.listId = task.listId || null
  
  // 加载子任务，将 status 映射为 completed
  try {
    const res = await taskApi.getSubtasks(task.id)
    taskForm.subtasks = (res.data || []).map((st: any) => ({
      ...st,
      completed: st.status === 1
    }))
  } catch (error) {
    console.error('加载子任务失败:', error)
    taskForm.subtasks = []
  }

  // 加载任务标签
  try {
    const res = await tagApi.getTaskTags(task.id)
    taskTags.value = res.data || []
    selectedTagIds.value = taskTags.value.map((t: any) => t.id)
  } catch { taskTags.value = []; selectedTagIds.value = [] }

  // 加载任务附件
  try {
    const res = await attachmentApi.getTaskAttachments(task.id)
    taskAttachments.value = res.data || []
  } catch { taskAttachments.value = [] }
}

// 点击主内容区（用于关闭编辑面板）
const handleMainContentClick = (event: MouseEvent) => {
  // 如果正在编辑，关闭编辑面板
  if (editingTask.value) {
    // 检查点击的是否是编辑面板内部，如果是则不关闭
    const editPanel = document.querySelector('.edit-panel')
    if (editPanel && !editPanel.contains(event.target as Node)) {
      console.log('点击了编辑面板外部，关闭面板')
      closeEditPanel()
    }
  }
}

// 关闭编辑面板
const closeEditPanel = async () => {
  if (editingTask.value && taskForm.title.trim()) {
    await flushAndSave()
  }
  editingTask.value = null
  resetTaskForm()
}

// 立即保存（取消 debounce，直接执行）
const flushAndSave = async () => {
  if (isSaving.value) return
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
  await doSave()
}

// 自动保存（失去焦点时，debounce 300ms）
const autoSave = () => {
  if (isSaving.value) {
    console.log('正在保存中，忽略此次调用')
    return
  }

  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }

  autoSaveTimer = setTimeout(() => {
    if (!editingTask.value || !taskForm.title.trim()) {
      return
    }
    doSave()
  }, 300)
}

// 实际执行保存的核心逻辑
const doSave = async () => {
  if (!editingTask.value || !taskForm.title.trim()) return

  // 在异步操作前立即捕获所有表单数据，防止 closeEditPanel / resetTaskForm 干扰
  const taskId = editingTask.value.id
  const mainTaskData = {
    title: taskForm.title,
    description: taskForm.description,
    priority: taskForm.priority,
    startDate: taskForm.startDate,
    dueDate: taskForm.dueDate,
    listId: taskForm.listId,
    parentId: editingTask.value.parentId // 保持父任务关系不变
  }
  const subtasksSnapshot: Array<{ id?: number; title: string; completed: boolean }> = []
  if (taskForm.subtasks) {
    taskForm.subtasks.forEach(st => {
      if (st.title && st.title.trim()) {
        subtasksSnapshot.push({
          id: st.id,
          title: st.title.trim(),
          completed: st.completed
        })
      }
    })
  }

  isSaving.value = true
  try {
    console.log('=== 开始保存 ===')
    console.log('主任务ID:', taskId)
    console.log('子任务列表:', subtasksSnapshot)

    // 先保存主任务（使用捕获的快照数据）
    await taskApi.updateTask(taskId, mainTaskData)
    console.log('主任务保存成功')

    // 获取当前数据库中该任务的所有子任务
    const existingSubtasksRes = await taskApi.getSubtasks(taskId)
    const existingSubtasks = existingSubtasksRes.data || []
    console.log('数据库中现有子任务:', existingSubtasks)

    // 构建数据库子任务映射（仅按 id）
    const dbSubtaskById = new Map<number, any>()
    existingSubtasks.forEach((st: any) => {
      dbSubtaskById.set(st.id, st)
    })

    // 收集前端有 id 的子任务
    const frontendIds = new Set<number>()
    subtasksSnapshot.forEach(st => {
      if (st.id) frontendIds.add(st.id)
    })

    // 1. 删除数据库中不在前端的子任务（按 id 判断）
    for (const [id, dbSubtask] of dbSubtaskById) {
      if (!frontendIds.has(id)) {
        console.log('删除子任务:', dbSubtask.title, 'ID:', dbSubtask.id)
        await taskApi.deleteTask(dbSubtask.id)
      }
    }

    // 2. 更新或创建子任务（遍历快照而非 taskForm.subtasks）
    for (const subtask of subtasksSnapshot) {
      // 仅按 id 匹配，允许同名子任务
      const dbSubtask = (subtask.id && dbSubtaskById.has(subtask.id))
        ? dbSubtaskById.get(subtask.id)
        : null

      if (dbSubtask) {
        // 更新现有子任务（保留 parentId，防止被提升为顶级任务）
        console.log('更新子任务:', subtask.title, 'ID:', dbSubtask.id)
        await taskApi.updateTask(dbSubtask.id, {
          title: subtask.title,
          status: subtask.completed ? 1 : 0,
          parentId: taskId
        })
      } else {
        // 创建新子任务
        console.log('创建新子任务:', subtask.title, 'parentId:', taskId)
        const res = await taskApi.createTask({
          title: subtask.title,
          parentId: taskId,
          status: subtask.completed ? 1 : 0
        })
        // 回填 id 到原始 reactive 对象
        const originalSubtask = taskForm.subtasks?.find(
          (st: any) => st.title && st.title.trim() === subtask.title && !st.id
        )
        if (res.data && res.data.id && originalSubtask) {
          originalSubtask.id = res.data.id
        }
      }
    }

    console.log('=== 保存完成 ===')
    loadTasks()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    isSaving.value = false
  }
}

// 添加子任务
const addSubtask = () => {
  if (!taskForm.subtasks) {
    taskForm.subtasks = []
  }

  const hasEmptySubtask = taskForm.subtasks.some(st => !st.title || !st.title.trim())
  if (hasEmptySubtask) {
    focusLastSubtaskInput()
    return
  }

  taskForm.subtasks.push({ title: '', completed: false })
  focusLastSubtaskInput()
}

// 聚焦最后一个子任务输入框
const focusLastSubtaskInput = () => {
  setTimeout(() => {
    const inputs = document.querySelectorAll('.subtask-input .el-input__inner')
    if (inputs.length > 0) {
      (inputs[inputs.length - 1] as HTMLInputElement).focus()
    }
  }, 100)
}

// 子任务输入框按 Enter: 保存当前内容并添加新行
const handleSubtaskEnter = (index: number) => {
  const subtask = taskForm.subtasks?.[index]
  if (!subtask) return

  const title = (subtask.title || '').trim()
  if (!title) {
    // 空标题按 Enter：聚焦到当前输入框（不做其他操作）
    focusLastSubtaskInput()
    return
  }

  // 有内容：触发保存，然后添加新空行
  autoSave()
  addSubtask()
}

// 删除子任务
const removeSubtask = async (index: number) => {
  if (taskForm.subtasks) {
    const subtask = taskForm.subtasks[index]
    
    // 如果子任务已经保存到数据库，则调用 API 删除
    if (subtask.id) {
      try {
        console.log('删除数据库中的子任务:', subtask.title, 'ID:', subtask.id)
        await taskApi.deleteTask(subtask.id)
        ElMessage.success('子任务已删除')
      } catch (error) {
        console.error('删除子任务失败:', error)
        ElMessage.error('删除子任务失败')
        return // 删除失败则不继续
      }
    }
    
    // 从前端数组中移除
    taskForm.subtasks.splice(index, 1)
    console.log('从前端的子任务数组中移除，当前数量:', taskForm.subtasks.length)
    
    // 触发自动保存，确保任务列表刷新
    autoSave()
  }
}

// 修改优先级
const handlePriorityChange = (priority: string) => {
  taskForm.priority = parseInt(priority)
  autoSave()
}

// 修改清单
const handleListChange = (listId: string) => {
  taskForm.listId = listId === 'null' ? null : parseInt(listId)
  autoSave()
}

// 获取选中的清单名称
const getSelectedListName = () => {
  if (!taskForm.listId) return '无清单'
  const list = taskLists.value.find(l => l.id === taskForm.listId)
  return list ? list.name : '无清单'
}

// ===== 标签相关 =====
const selectedTagIds = ref<number[]>([])

const loadAllTags = async () => {
  if (allTags.value.length > 0) return
  try {
    const res = await tagApi.getTags()
    allTags.value = res.data || []
  } catch { /* 静默失败 */ }
}

const handleTagChange = async (tagIds: number[]) => {
  if (!editingTask.value) return
  const taskId = editingTask.value.id
  // 找出新增的标签
  const currentIds = new Set(taskTags.value.map((t: any) => t.id))
  const newIds = new Set(tagIds)
  for (const id of tagIds) {
    if (!currentIds.has(id)) {
      try { await tagApi.addTagToTask(taskId, id) } catch { /* skip */ }
    }
  }
  // 找出移除的标签
  for (const id of currentIds) {
    if (!newIds.has(id)) {
      try { await tagApi.removeTagFromTask(taskId, id) } catch { /* skip */ }
    }
  }
  // 重新加载
  try {
    const res = await tagApi.getTaskTags(taskId)
    taskTags.value = res.data || []
    selectedTagIds.value = taskTags.value.map((t: any) => t.id)
  } catch { /* skip */ }
}

const handleRemoveTag = async (tagId: number) => {
  if (!editingTask.value) return
  try {
    await tagApi.removeTagFromTask(editingTask.value.id, tagId)
    taskTags.value = taskTags.value.filter((t: any) => t.id !== tagId)
    selectedTagIds.value = selectedTagIds.value.filter(id => id !== tagId)
  } catch { /* skip */ }
}

// ===== 附件相关 =====
const fileInputRef = ref<HTMLInputElement>()

const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0 || !editingTask.value) return
  const file = input.files[0]
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('文件大小不能超过 10MB')
    return
  }
  attachmentUploading.value = true
  try {
    await attachmentApi.uploadFile(editingTask.value.id, file)
    ElMessage.success('上传成功')
    const res = await attachmentApi.getTaskAttachments(editingTask.value.id)
    taskAttachments.value = res.data || []
  } catch {
    ElMessage.error('上传失败')
  } finally {
    attachmentUploading.value = false
    input.value = '' // 清空 input，允许重复上传同一文件
  }
}

const downloadAttachment = (att: any) => {
  const url = `http://localhost:18080/api/attachments/${encodeURIComponent(att.fileName)}`
  const a = document.createElement('a')
  a.href = url
  a.download = att.fileName
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const handleDeleteAttachment = async (att: any) => {
  if (!editingTask.value) return
  try {
    await ElMessageBox.confirm('确定要删除这个附件吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await attachmentApi.deleteAttachment(att.id)
    taskAttachments.value = taskAttachments.value.filter((a: any) => a.id !== att.id)
    ElMessage.success('附件已删除')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除附件失败:', error)
    }
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const renderMarkdown = (text: string) => {
  if (!text) return ''
  try {
    return marked(text, { breaks: true, gfm: true }) as string
  } catch {
    return text
  }
}

// 格式化短日期
// 判断日期字符串是否有具体时间（非 00:00）
const hasTimeValue = (dateStr: string) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d.getHours() !== 0 || d.getMinutes() !== 0
}

const formatDateShort = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  if (hasTimeValue(dateStr)) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}月${day}日 ${hours}:${minutes}`
  }
  return `${month}月${day}日`
}

const datePickerFormat = computed(() => {
  const val = taskForm.dueDate || taskForm.startDate
  return hasTimeValue(val) ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
})

// 删除任务
const handleDeleteTask = async (task: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 保存删除前的任务数据用于撤销
    const deletedTask = { ...task }
    await taskApi.deleteTask(task.id)
    showUndo('任务已删除', async () => {
      await taskApi.createTask({
        title: deletedTask.title,
        description: deletedTask.description,
        priority: deletedTask.priority,
        startDate: deletedTask.startDate,
        dueDate: deletedTask.dueDate,
        listId: deletedTask.listId,
        parentId: deletedTask.parentId
      })
      loadTasks()
    })
    loadTasks()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除任务失败:', error)
    }
  }
}

// 批量操作
const enterBatchMode = () => {
  batchMode.value = true
  selectedTaskIds.value.clear()
}

const exitBatchMode = () => {
  batchMode.value = false
  selectedTaskIds.value.clear()
}

const toggleTaskSelection = (taskId: number) => {
  const newSet = new Set(selectedTaskIds.value)
  if (newSet.has(taskId)) {
    newSet.delete(taskId)
  } else {
    newSet.add(taskId)
  }
  selectedTaskIds.value = newSet
}

const handleSelectAll = () => {
  const visibleIds = new Set(tasks.value.map(t => t.id))
  // Skip child tasks whose parent is also visible (parent cascade will delete them)
  const filtered = tasks.value
    .filter(t => !t.parentId || !visibleIds.has(t.parentId))
    .map(t => t.id)
  selectedTaskIds.value = new Set(filtered)
}

const handleBatchDelete = async () => {
  if (selectedTaskIds.value.size === 0) {
    ElMessage.warning('请先选择要删除的任务')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTaskIds.value.size} 个任务吗？此操作不可恢复。`,
      '批量删除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await batchApi.batchDelete(Array.from(selectedTaskIds.value))
    ElMessage.success(`已删除 ${selectedTaskIds.value.size} 个任务`)
    exitBatchMode()
    loadTasks()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 提交任务
const handleSubmitTask = async () => {
  if (!taskFormRef.value) return
  
  await taskFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (editingTask.value) {
          await taskApi.updateTask(editingTask.value.id, taskForm)
          ElMessage.success('更新成功')
          closeEditPanel()
        } else {
          const res = await taskApi.createTask(taskForm)
          // 如果设置了重复规则，创建后立即设置
          if (repeatForm.type && res.data?.id) {
            try {
              await repeatApi.setRepeatRule(res.data.id, {
                type: repeatForm.type,
                interval: repeatForm.interval
              })
            } catch { /* 静默失败 */ }
          }
          ElMessage.success('创建成功')
          showCreateTaskDialog.value = false
          resetRepeatForm()
        }
        resetTaskForm()
        loadTasks()
      } catch (error) {
        console.error('提交任务失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 提交清单
const handleSubmitList = async () => {
  if (!listFormRef.value) return
  
  await listFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await listApi.createList(listForm)
        ElMessage.success('创建成功')
        showCreateListDialog.value = false
        resetListForm()
        loadLists()
      } catch (error) {
        console.error('创建清单失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 删除清单
const handleDeleteList = async (list: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除清单“${list.name}”吗？该清单下的任务将不会被删除。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await listApi.deleteList(list.id)
    ElMessage.success('删除成功')
    loadLists()
    
    // 如果当前正在查看被删除的清单，切换到全部任务
    if (activeMenu.value === `list-${list.id}`) {
      activeMenu.value = 'all'
      loadTasks()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除清单失败:', error)
    }
  }
}

// 重置表单
const resetTaskForm = () => {
  editingTask.value = null
  taskForm.title = ''
  taskForm.description = ''
  taskForm.priority = 0
  taskForm.startDate = ''
  taskForm.dueDate = ''
  taskForm.listId = null
  taskForm.subtasks = []
  taskTags.value = []
  taskAttachments.value = []
  selectedTagIds.value = []
}

const resetListForm = () => {
  listForm.name = ''
  listForm.color = '#409EFF'
}

const resetRepeatForm = () => {
  repeatForm.type = null
  repeatForm.interval = 1
}

const onRepeatTypeChange = () => {
  if (repeatForm.type) {
    repeatForm.interval = 1
  }
}

const getRepeatTypeText = () => {
  const texts: any = { DAILY: '天', WEEKLY: '周', MONTHLY: '月', YEARLY: '年' }
  return texts[repeatForm.type || ''] || ''
}

// 获取优先级类型
const getPriorityType = (priority: number) => {
  const types: any = { 0: '', 1: 'info', 2: 'warning', 3: 'danger' }
  return types[priority] || ''
}

// 获取优先级文本
const getPriorityText = (priority: number) => {
  const texts: any = { 0: '无', 1: '低', 2: '中', 3: '高' }
  return texts[priority] || '无'
}

// 获取时间状态文本
// 规则：无具体时间不显示；跨天只显示天数；同日有时间才显示小时分钟
const getTimeStatus = (task: any) => {
  if (!task.startDate && !task.dueDate) return ''
  if (task.status === 1) return ''

  const now = new Date()
  const startDate = task.startDate ? new Date(task.startDate) : null
  const dueDate = task.dueDate ? new Date(task.dueDate) : null

  const dueHasTime = dueDate && (dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0)
  const startHasTime = startDate && (startDate.getHours() !== 0 || startDate.getMinutes() !== 0)
  const isCrossDay = startDate && dueDate && startDate.toDateString() !== dueDate.toDateString()

  // 无具体时间 → 不显示
  if (!dueHasTime && !startHasTime) return ''

  // 还没到开始日期
  if (startDate && now < startDate) {
    const diff = startDate.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return `${days}天后开始`
  }

  if (dueDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const dueDay = new Date(dueDate); dueDay.setHours(0, 0, 0, 0)
    const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // 跨天或仅有日期（无时间）→ 只显示天数
    if (isCrossDay || !dueHasTime) {
      if (diffDays === 0) return '今天'
      if (diffDays > 0) return `${diffDays}天后结束`
      return `过期${Math.abs(diffDays)}天`
    }

    // 同日 + 有具体时间 → 精确到小时分钟
    const diffMs = now.getTime() - dueDate.getTime()
    const absMs = Math.abs(diffMs)
    const days = Math.floor(absMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60))
    if (diffMs > 0) {
      if (days > 0) return `过期${days}天${hours}小时`
      if (hours > 0) return `过期${hours}小时${mins}分钟`
      return `过期${mins}分钟`
    } else {
      if (days > 0) return `${days}天后结束`
      if (hours > 0) return `${hours}小时${mins}分钟后`
      return `${mins}分钟后`
    }
  }

  return ''
}

// 获取时间状态样式类
const getTimeStatusClass = (task: any) => {
  if (!getTimeStatus(task)) return ''

  const now = new Date()
  const startDate = task.startDate ? new Date(task.startDate) : null
  const dueDate = task.dueDate ? new Date(task.dueDate) : null

  if (startDate && now < startDate) return 'time-status-upcoming'

  if (dueDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const dueDay = new Date(dueDate); dueDay.setHours(0, 0, 0, 0)
    if (dueDay < today) return 'time-status-overdue'
    if (dueDay > today) return 'time-status-active'
    return 'time-status-today'
  }

  return ''
}

// 判断是否过期（仅限严格过期：截止日期 < 今天，当天不算）
const isOverdue = (task: any) => {
  if (task.status === 1) return false
  if (!task.dueDate) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dueDay = new Date(task.dueDate); dueDay.setHours(0, 0, 0, 0)
  return dueDay < today
}

// 顺延过期任务到今日（使用本地时间格式化，避免 toISOString 的 UTC 时区偏移）
const handlePostponeTask = async (task: any) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    await taskApi.updateTaskTime(task.id, { dueDate: formatLocalDateTime(today) })
    ElMessage.success('已顺延至今天')
    loadTasks()
  } catch {
    ElMessage.error('顺延失败')
  }
}

onMounted(() => {
  loadLists()
  loadTasks()
  loadReminders()
  reminderTimer = setInterval(loadReminders, 60000) // 每分钟轮询提醒
})

// 切换模块时退出批量模式
watch(currentModule, () => {
  if (batchMode.value) exitBatchMode()
})

onUnmounted(() => {
  if (reminderTimer) clearInterval(reminderTimer)
})
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  overflow: hidden;
}

/* 图标导航栏 */
.icon-sidebar {
  background: #1a1a2e;
  border-right: none;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.icon-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
}

.nav-item {
  width: 48px;
  height: 48px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  color: #999;
  transition: all 0.3s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-item.active {
  background: #667eea;
  color: #fff;
}

/* 内层容器 */
.el-container {
  height: 100%;
  display: flex;
}

.sidebar {
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.logo h2 {
  margin: 0;
  color: #667eea;
  font-size: 18px;
}

.el-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  font-weight: bold;
  color: #606266;
  flex-shrink: 0;
}

.list-item {
  position: relative;
}

.list-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-list-btn {
  opacity: 0;
  transition: opacity 0.3s;
  margin-left: auto;
}

.list-item:hover .delete-list-btn {
  opacity: 1;
}

.main-content {
  background: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
  height: 100%;
  flex: 1;
}

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

/* 右侧编辑面板 */
.edit-panel {
  width: 500px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  flex-shrink: 0;
  position: sticky;
  top: 0;
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
  outline: 1px solid #409EFF;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #999;
}

.task-item.subtask {
  background-color: #f8f9fa;
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
  color: #409EFF;
}

.time-status-active {
  color: #409EFF;
}

.time-status-overdue {
  color: #F56C6C;
}

.time-status-today {
  color: #E6A23C;
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
  border-color: #409EFF;
}

.priority-1 :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff;
  border-color: #409EFF;
}

.priority-1 :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #409EFF;
}

.priority-2 :deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #E6A23C;
}

.priority-2 :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff;
  border-color: #E6A23C;
}

.priority-2 :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #E6A23C;
}

.priority-3 :deep(.el-checkbox__inner) {
  background-color: #fff;
  border-color: #F56C6C;
}

.priority-3 :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff;
  border-color: #F56C6C;
}

.priority-3 :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #F56C6C;
}

/* 统计和标签视图 */
.statistics-view,
.tags-view {
  height: 100%;
  overflow-y: auto;
}

/* 日历模块 */
.calendar-module {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 习惯模块 */
.habits-module {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 纪念日模块 */
.anniversaries-module {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bell-btn { position: relative; }

.reminder-popover h4 { margin: 0 0 12px 0; font-size: 14px; color: #303133; }
.reminder-list { display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; }
.reminder-item { padding: 10px; border-radius: 6px; background: #f5f7fa; cursor: pointer; transition: background 0.2s; }
.reminder-item:hover { background: #ecf5ff; }
.reminder-name { font-weight: 500; font-size: 14px; color: #303133; }
.reminder-time { font-size: 12px; color: #909399; margin-top: 4px; }

/* 占位模块 */
.placeholder-module {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 编辑抽屉样式 - 备忘录风格 */
.memo-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.memo-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  background: #fff;
}

/* 标题区域 */
.memo-header {
  margin-bottom: 16px;
}

.memo-title-input :deep(.el-input__wrapper) {
  box-shadow: none;
  padding: 0;
  background: transparent;
}

.memo-title-input :deep(.el-input__inner) {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.memo-title-input :deep(.el-input__inner)::placeholder {
  color: #c0c4cc;
}

/* 元数据标签区域 */
.memo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.meta-tag {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-tag.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.meta-tag :deep(.el-icon) {
  font-size: 14px;
}

/* 描述区域 */
.memo-description {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 0;
}

.section-header .section-title {
  margin-bottom: 0;
}

.markdown-preview {
  min-height: 120px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
}

.markdown-preview :deep(h1) { font-size: 1.5em; margin: 0.5em 0; }
.markdown-preview :deep(h2) { font-size: 1.3em; margin: 0.5em 0; }
.markdown-preview :deep(h3) { font-size: 1.1em; margin: 0.4em 0; }
.markdown-preview :deep(p) { margin: 0.5em 0; }
.markdown-preview :deep(ul), .markdown-preview :deep(ol) { padding-left: 1.5em; margin: 0.5em 0; }
.markdown-preview :deep(code) { background: #eee; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
.markdown-preview :deep(pre) { background: #f0f0f0; padding: 12px; border-radius: 4px; overflow-x: auto; }
.markdown-preview :deep(pre code) { background: none; padding: 0; }
.markdown-preview :deep(blockquote) { border-left: 3px solid #ddd; padding-left: 12px; color: #666; margin: 0.5em 0; }
.markdown-preview :deep(a) { color: #409EFF; }

.memo-textarea :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #606266;
  resize: none;
  background: transparent;
}

.memo-textarea :deep(.el-textarea__inner)::placeholder {
  color: #c0c4cc;
}

/* 子任务区域 */
.memo-subtasks {
  border-top: 1px solid #e8e8e8;
  padding-top: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.subtask-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  transition: all 0.3s;
}

.subtask-item:hover {
  background: #ecf5ff;
}

.subtask-input {
  flex: 1;
}

.subtask-input :deep(.el-input__wrapper) {
  box-shadow: none;
  padding: 0 8px;
  background: transparent;
}

.subtask-input :deep(.el-input__inner) {
  font-size: 14px;
  color: #606266;
}

.subtask-text {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.subtask-text.completed {
  text-decoration: line-through;
  color: #c0c4cc;
}

/* 标签行 */
.task-tags-row {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

/* 附件区域 */
.memo-attachments {
  border-top: 1px solid #e8e8e8;
  padding-top: 20px;
  max-height: 200px;
  overflow-y: auto;
}

.attachment-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.upload-hint {
  font-size: 12px;
  color: #c0c4cc;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.attachment-item:hover {
  background: #ecf5ff;
}

.attachment-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-size {
  font-size: 12px;
  color: #909399;
}

</style>

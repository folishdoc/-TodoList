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
            <el-button type="primary" @click="showCreateTaskDialog = true">
              <el-icon><Plus /></el-icon>
              新建任务
            </el-button>
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
                  'subtask': task.parentId != null
                }"
                :style="{ paddingLeft: (20 + (task.level || 0) * 30) + 'px' }"
                @click.stop="handleEditTask(task)"
              >
                <el-checkbox
                  :model-value="task.status === 1"
                  @click.stop
                  @change="handleCompleteTask(task)"
                  :class="'priority-' + task.priority"
                />
                <div class="task-content">
                  <div class="task-title">{{ task.title }}</div>
                </div>
                <div class="task-actions">
                  <!-- 时间提示 -->
                  <span :class="['time-status', getTimeStatusClass(task)]" :style="{ visibility: getTimeStatus(task) ? 'visible' : 'hidden' }">
                    {{ getTimeStatus(task) || ' ' }}
                  </span>
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
          <CalendarView />
        </div>
        
        <!-- 习惯模块（占位） -->
        <div v-else-if="currentModule === 'habits'" class="habits-module">
          <HabitsView />
        </div>
        
        <!-- 纪念日模块（占位） -->
        <div v-else-if="currentModule === 'anniversaries'" class="placeholder-module">
          <el-empty description="纪念日功能开发中..." />
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
                format="YYYY-MM-DD HH:mm"
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
                format="YYYY-MM-DD HH:mm"
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
          </div>
          
          <!-- 描述区域 -->
          <div class="memo-description">
            <h4 class="section-title">描述</h4>
            <el-input
              v-model="taskForm.description"
              type="textarea"
              :rows="8"
              placeholder="添加详细描述..."
              class="memo-textarea"
              @blur="autoSave"
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
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="截至日期" prop="dueDate">
          <el-date-picker
            v-model="taskForm.dueDate"
            type="datetime"
            placeholder="选择截止日期（选填）"
            format="YYYY-MM-DD HH:mm:ss"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { List, Calendar, Clock, Plus, Folder, Delete, DataAnalysis, PriceTag, TrendCharts, Flag } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import * as taskApi from '../api/task'
import * as listApi from '../api/list'
import StatisticsView from '../components/StatisticsView.vue'
import TagsView from '../components/TagsView.vue'
import CalendarView from '../components/CalendarView.vue'
import HabitsView from '../components/HabitsView.vue'

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

const tasks = ref<any[]>([])
const taskLists = ref<any[]>([])

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

// 防抖定时器
let autoSaveTimer: any = null
const isSaving = ref(false)

const taskRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' }
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
    if (activeMenu.value === 'all' && !searchKeyword.value) {
      res = await taskApi.getTasksWithSubtasks({ page: currentPage.value - 1, size: pageSize.value })
      
      // 将所有任务提取出来
      const allWrappers = res.data.content
      const allTasksMap = new Map() // id -> task
      
      // 第一步：收集所有任务
      allWrappers.forEach((wrapper: any) => {
        const task = wrapper.task
        task.level = 0 // 默认层级
        allTasksMap.set(task.id, task)
        
        // 也添加子任务到map中
        if (wrapper.subtasks && wrapper.subtasks.length > 0) {
          wrapper.subtasks.forEach((subtask: any) => {
            subtask.level = 0 // 稍后计算
            allTasksMap.set(subtask.id, subtask)
          })
        }
      })
      
      // 第二步：计算每个任务的层级
      const calculateLevel = (taskId: number): number => {
        const task = allTasksMap.get(taskId)
        if (!task || !task.parentId) {
          return 0 // 顶级任务
        }
        
        // 递归计算父任务的层级
        const parentLevel = calculateLevel(task.parentId)
        return parentLevel + 1
      }
      
      // 为所有任务计算层级
      allTasksMap.forEach((task) => {
        task.level = calculateLevel(task.id)
      })
      
      // 第三步：构建树形结构并展平
      const result: any[] = []
      
      // 找到所有顶级任务（parentId为null）
      const rootTasks = Array.from(allTasksMap.values()).filter((t: any) => !t.parentId)
      
      // 递归添加任务及其子任务
      const addTaskAndChildren = (task: any) => {
        result.push(task)
        
        // 找到该任务的所有直接子任务
        const children = Array.from(allTasksMap.values()).filter((t: any) => t.parentId === task.id)
        // 按创建时间排序（旧的在前）
        children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        
        // 递归添加子任务
        children.forEach(child => {
          addTaskAndChildren(child)
        })
      }
      
      // 按创建时间排序顶级任务（新的在前）
      rootTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      // 从顶级任务开始构建
      rootTasks.forEach(task => {
        addTaskAndChildren(task)
      })
      
      console.log('任务列表:', result.map(t => ({
        id: t.id,
        title: t.title,
        level: t.level,
        parentId: t.parentId
      })))
      
      tasks.value = result
      total.value = res.data.totalElements
    } else if (activeMenu.value === 'today') {
      res = await taskApi.getTodayTasks()
      tasks.value = res.data
      total.value = res.data.length
    } else if (activeMenu.value === 'upcoming') {
      res = await taskApi.getUpcomingTasks()
      tasks.value = res.data
      total.value = res.data.length
    } else if (searchKeyword.value) {
      res = await taskApi.searchTasks({ keyword: searchKeyword.value, page: currentPage.value - 1, size: pageSize.value })
      tasks.value = res.data.content
      total.value = res.data.totalElements
    } else if (activeMenu.value.startsWith('list-')) {
      const listId = parseInt(activeMenu.value.split('-')[1])
      res = await taskApi.getTasks({ page: currentPage.value - 1, size: pageSize.value })
      // 修复：严格过滤 listId，使用 == 而非 === 以兼容数字和字符串类型
      tasks.value = res.data.content.filter((t: any) => t.listId == listId)
      total.value = tasks.value.length
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
    loadTasks()
  } catch (error) {
    console.error('操作失败:', error)
  }
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
    listId: taskForm.listId
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

    // 构建数据库子任务映射（同时按 id 和 title）
    const dbSubtaskById = new Map<number, any>()
    const dbSubtaskByTitle = new Map<string, any>()
    existingSubtasks.forEach((st: any) => {
      dbSubtaskById.set(st.id, st)
      dbSubtaskByTitle.set(st.title, st)
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
      // 优先按 id 匹配，fallback 到 title
      let dbSubtask = null
      if (subtask.id && dbSubtaskById.has(subtask.id)) {
        dbSubtask = dbSubtaskById.get(subtask.id)
      } else {
        dbSubtask = dbSubtaskByTitle.get(subtask.title)
      }

      if (dbSubtask) {
        // 更新现有子任务（保留 parentId，防止被提升为顶级任务）
        console.log('更新子任务:', subtask.title, 'ID:', dbSubtask.id)
        await taskApi.updateTask(dbSubtask.id, {
          title: subtask.title,
          status: subtask.completed ? 1 : 0,
          parentId: taskId
        })
        // 回填 id 到原始 reactive 对象，使后续操作能按 id 匹配
        const originalSubtask = taskForm.subtasks?.find(
          (st: any) => st.title && st.title.trim() === subtask.title && !st.id
        )
        if (originalSubtask) originalSubtask.id = dbSubtask.id
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

// 格式化短日期
const formatDateShort = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

// 删除任务
const handleDeleteTask = async (task: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await taskApi.deleteTask(task.id)
    ElMessage.success('删除成功')
    loadTasks()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除任务失败:', error)
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
          await taskApi.createTask(taskForm)
          ElMessage.success('创建成功')
          showCreateTaskDialog.value = false // 新建完成后关闭对话框
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
}

const resetListForm = () => {
  listForm.name = ''
  listForm.color = '#409EFF'
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
const getTimeStatus = (task: any) => {
  if (!task.startDate && !task.dueDate) return ''
  
  const now = new Date()
  const startDate = task.startDate ? new Date(task.startDate) : null
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  
  // 如果已完成，不显示
  if (task.status === 1) return ''
  
  // 还没到开始日期
  if (startDate && now < startDate) {
    const diff = startDate.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return `${days}天后开始`
  }
  
  // 在任务期间或已过期
  if (dueDate) {
    if (now > dueDate) {
      // 已过期
      const diff = now.getTime() - dueDate.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      return `过期${days}天`
    } else {
      // 任务期间
      const diff = dueDate.getTime() - now.getTime()
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      return `${days}天后结束`
    }
  }
  
  return ''
}

// 获取时间状态样式类
const getTimeStatusClass = (task: any) => {
  if (!task.startDate && !task.dueDate) return ''
  
  const now = new Date()
  const startDate = task.startDate ? new Date(task.startDate) : null
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  
  // 如果已完成，不显示
  if (task.status === 1) return ''
  
  // 还没到开始日期 - 蓝色
  if (startDate && now < startDate) {
    return 'time-status-upcoming'
  }
  
  // 在任务期间 - 蓝色
  if (dueDate && now <= dueDate) {
    return 'time-status-active'
  }
  
  // 已过期 - 红色
  if (dueDate && now > dueDate) {
    return 'time-status-overdue'
  }
  
  return ''
}

onMounted(() => {
  loadLists()
  loadTasks()
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

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

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
</style>

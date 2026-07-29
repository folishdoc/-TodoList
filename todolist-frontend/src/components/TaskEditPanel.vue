<!--
/**
 * TaskEditPanel.vue — 任务编辑面板组件
 *
 * 全功能的任务编辑器，支持 panel（侧边面板）和 dialog（弹窗）两种模式。
 * 功能：标题编辑、优先级、时间（普通/循环模式）、清单、标签、描述（Markdown）、
 * 子任务管理、附件上传/下载/删除、删除任务。
 * 核心特性：300ms 防抖自动保存（autoSave）、子任务同步、循环规则设置。
 * 数据流：通过 props.task 接收当前编辑任务，emit('changed') 通知父组件数据已变更。
 */
-->
<script setup lang="ts">
/**
 * 编辑面板核心逻辑：
 * - props.task 驱动，watch id 变化自动 init
 * - autoSave 防抖定时保存（每次修改后 300ms）
 * - doSave 同步主任务 + 子任务（增删改）
 * - 时间模式（normal/repeat）互斥切换
 * - 标签变化 diff 后逐条调用 API
 * - 附件上传（10MB 限制）后自动刷新列表
 */
import { ref, reactive, watch, computed, toRef } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, Flag, Folder, PriceTag, Upload, Download } from '@element-plus/icons-vue'
import { marked } from 'marked'
import * as taskApi from '../api/task'
import * as listApi from '../api/list'
import * as tagApi from '../api/tag'
import * as attachmentApi from '../api/attachment'
import * as repeatApi from '../api/repeat'
import { formatDateShort, hasTimeValue } from '../composables/useDateUtils'
import { getRepeatLabel } from '../composables/useRepeatRule'
import { getPriorityType, getPriorityText } from '../composables/usePriority'
import { useTaskTimeMode } from '../composables/useTaskTimeMode'

const props = defineProps<{
  task: any
  mode?: 'panel' | 'dialog'
}>()

const emit = defineEmits<{
  close: []
  changed: []
}>()

// ── 表单状态 ──
const taskForm = reactive({
  title: '',
  description: '',
  priority: 2,
  startDate: '',
  dueDate: '',
  listId: null as number | null,
  subtasks: [] as any[],
})

// ── 标签、附件、清单等辅助状态 ──
const taskTags = ref<any[]>([])
const selectedTagIds = ref<number[]>([])
const taskAttachments = ref<any[]>([])
const allTags = ref<any[]>([])
const taskLists = ref<any[]>([])
const descriptionPreview = ref(false)
const isSaving = ref(false)
let autoSaveTimer: any = null

// ── 重复规则 ──
const repeatForm = reactive({
  type: '' as string,
  interval: 1,
  weekDays: [] as number[],
  dayOfMonth: 1,
  endDate: '' as string,
})
const editRepeatEndDate = ref('')
const showRepeatForm = ref(false)

// 时间模式：普通任务 / 循环任务（互斥）
const taskRef = toRef(props, 'task')
const {
  mode: taskTimeMode,
  initFromTask,
  switchToRepeat,
  switchToNormal,
} = useTaskTimeMode(taskRef)

const onModeChange = async (newMode: 'normal' | 'repeat') => {
  const ctx = { taskForm, showRepeatForm, repeatForm, editRepeatEndDate }
  if (newMode === 'repeat') {
    await switchToRepeat(ctx)
  } else {
    await switchToNormal(ctx)
  }
  autoSave()
}

const datePickerFormat = computed(() => {
  const val = taskForm.dueDate || taskForm.startDate
  return hasTimeValue(val) ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
})

const getTimeSummary = () => {
  const hasStart = taskForm.startDate
  const hasDue = taskForm.dueDate
  const hasRepeat = props.task?.repeatRule

  if (!hasStart && !hasDue && !hasRepeat) return '时间'

  const parts: string[] = []
  if (hasStart) parts.push(formatDateShort(taskForm.startDate))
  if (hasDue) parts.push(formatDateShort(taskForm.dueDate))
  let summary = parts.join(' ~ ')

  if (hasRepeat) {
    const label = getRepeatLabel(props.task.repeatRule, props.task)
    summary = summary ? `${summary} · ${label}` : label
  }
  return summary || '时间'
}

// 初始化
const init = async () => {
  const task = props.task
  if (!task) return

  taskForm.title = task.title || ''
  taskForm.description = task.description || ''
  taskForm.priority = task.priority ?? 2
  taskForm.startDate = task.startDate || ''
  taskForm.dueDate = task.dueDate || ''
  taskForm.listId = task.listId || null

  if (task.repeatRule) {
    try {
      const rule = JSON.parse(task.repeatRule)
      editRepeatEndDate.value = rule.endDate || ''
    } catch (e) { console.warn('解析循环规则失败', e); editRepeatEndDate.value = '' }
  } else {
    editRepeatEndDate.value = ''
  }
  initFromTask()

  try {
    const listsRes: any = await listApi.getLists()
    taskLists.value = listsRes?.data || []
  } catch (e) { console.error('加载清单列表失败', e) }

  try {
    const subtasksRes: any = await taskApi.getSubtasks(task.id)
    taskForm.subtasks = (subtasksRes?.data || []).map((st: any) => ({
      ...st,
      completed: st.status === 1,
    }))
  } catch (e) { console.warn('加载子任务失败', e); taskForm.subtasks = [] }

  try {
    const tagsRes = await tagApi.getTaskTags(task.id)
    taskTags.value = tagsRes?.data || []
    selectedTagIds.value = taskTags.value.map((t: any) => t.id)
  } catch (e) { console.warn('加载标签失败', e); taskTags.value = []; selectedTagIds.value = [] }

  try {
    const attachmentsRes: any = await attachmentApi.getTaskAttachments(task.id)
    taskAttachments.value = attachmentsRes?.data || []
  } catch (e) { console.warn('加载附件失败', e); taskAttachments.value = [] }
}

watch(
  () => props.task?.id,
  () => {
    if (props.task) init()
  },
  { immediate: true },
)

// ── 核心保存逻辑 ──

/**
 * 执行保存：
 * 1. 更新主任务字段（标题/描述/优先级/时间/清单）
 * 2. 同步子任务：对比后端已有子任务，删除不存在的、新增的创建、已有的更新
 * 注意：循环模式下 startDate 同步为 dueDate（循环任务无开始时间）
 */
const doSave = async () => {
  if (!props.task || !taskForm.title.trim()) return
  isSaving.value = true
  try {
    const taskId = props.task.id
    // 循环模式：startDate 同步为 dueDate（循环任务没有开始时间）
    const startDate = taskTimeMode.value === 'repeat' ? taskForm.dueDate : taskForm.startDate
    await taskApi.updateTask(taskId, {
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      startDate,
      dueDate: taskForm.dueDate,
      listId: taskForm.listId,
      parentId: props.task.parentId,
    })

    // 子任务同步
    const subtasksSnapshot = taskForm.subtasks.filter((st: any) => st.title?.trim())
    const existingRes: any = await taskApi.getSubtasks(taskId)
    const existingSubtasks = existingRes?.data || []

    for (const dbSubtask of existingSubtasks) {
      const match = subtasksSnapshot.find((st: any) => st.title?.trim() === dbSubtask.title)
      if (!match) {
        await taskApi.deleteTask(dbSubtask.id)
      }
    }

    for (const subtask of subtasksSnapshot) {
      const match = existingSubtasks.find(
        (db: any) => db.title === subtask.title || (subtask.id && db.id === subtask.id),
      )
      if (match) {
        const newStatus = subtask.completed ? 1 : 0
        const newTitle = subtask.title.trim()
        if (newTitle !== match.title || newStatus !== match.status) {
          await taskApi.updateTask(match.id, { title: newTitle, status: newStatus })
        }
      } else {
        await taskApi.createTask({
          title: subtask.title.trim(),
          parentId: taskId,
          status: subtask.completed ? 1 : 0,
          priority: 0,
        })
      }
    }
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}

const autoSave = () => {
  if (isSaving.value) return
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => doSave(), 300)
}

// 优先级
const handlePriorityChange = (p: number) => {
  taskForm.priority = p
  autoSave()
}

// 清单
const handleListChange = (listId: any) => {
  taskForm.listId = listId === 'null' ? null : listId
  autoSave()
}

// 标签
const loadAllTags = async () => {
  try {
    const res = await tagApi.getTags()
    allTags.value = res?.data || []
  } catch (e) { console.error('加载全部标签失败', e) }
}

const handleTagChange = async () => {
  if (!props.task) return
  try {
    // 移除所有标签后重新设置
    for (const tag of taskTags.value) {
      await tagApi.removeTagFromTask(props.task.id, tag.id)
    }
    for (const tagId of selectedTagIds.value) {
      await tagApi.addTagToTask(props.task.id, tagId)
    }
    const res = await tagApi.getTaskTags(props.task.id)
    taskTags.value = res?.data || []
  } catch (e) {
    console.error(e)
  }
}

const handleRemoveTag = async (tagId: number) => {
  if (!props.task) return
  try {
    await tagApi.removeTagFromTask(props.task.id, tagId)
    selectedTagIds.value = selectedTagIds.value.filter((id) => id !== tagId)
    taskTags.value = taskTags.value.filter((t: any) => t.id !== tagId)
  } catch (e) { console.error('移除标签失败', e); ElMessage.error('移除标签失败') }
}

// 附件
const handleUploadAttachment = async (e: Event) => {
  if (!props.task) return
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('文件大小不能超过10MB')
    return
  }
  try {
    await attachmentApi.uploadFile(props.task.id, file)
    const res: any = await attachmentApi.getTaskAttachments(props.task.id)
    taskAttachments.value = res?.data || []
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  }
  input.value = ''
}

const handleDownloadAttachment = (att: any) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:18080/api'
  const url = `${baseUrl}/attachments/${encodeURIComponent(att.fileName)}`
  window.open(url)
}

const handleDeleteAttachment = async (att: any) => {
  if (!props.task) return
  try {
    await attachmentApi.deleteAttachment(att.id)
    taskAttachments.value = taskAttachments.value.filter((a: any) => a.fileName !== att.fileName)
  } catch (e) { console.error('删除附件失败', e); ElMessage.error('删除附件失败') }
}

// 子任务
const addSubtask = () => {
  taskForm.subtasks.push({ title: '', completed: false })
}

const removeSubtask = async (index: number) => {
  const st = taskForm.subtasks[index]
  if (st.id) {
    try {
      await taskApi.deleteTask(st.id)
    } catch (e) { console.error('删除子任务失败', e) }
  }
  taskForm.subtasks.splice(index, 1)
  autoSave()
}

const handleSubtaskToggle = (st: any) => {
  st.completed = !st.completed
  autoSave()
}

// 循环
const onRepeatTypeChange = () => {
  repeatForm.weekDays = []
  repeatForm.dayOfMonth = 1
  repeatForm.endDate = ''
  if (repeatForm.type) repeatForm.interval = 1
}

const resetRepeatForm = () => {
  repeatForm.type = ''
  repeatForm.interval = 1
  repeatForm.weekDays = []
  repeatForm.dayOfMonth = 1
  repeatForm.endDate = ''
}

const handleUpdateRepeatEndDate = async () => {
  if (!props.task?.repeatRule) return
  try {
    const rule = JSON.parse(props.task.repeatRule)
    rule.endDate = editRepeatEndDate.value || null
    await repeatApi.setRepeatRule(props.task.id, rule)
    props.task.repeatRule = JSON.stringify(rule)
    ElMessage.success('循环结束日期已更新')
  } catch {
    ElMessage.error('更新失败')
  }
}

const handleCancelRepeat = async () => {
  if (!props.task) return
  try {
    await repeatApi.cancelRepeatRule(props.task.id)
    props.task.repeatRule = null
    editRepeatEndDate.value = ''
    ElMessage.success('已取消循环')
  } catch {
    ElMessage.error('取消失败')
  }
}

const handleAddRepeatInPanel = async () => {
  if (!props.task || !repeatForm.type) return
  try {
    const rule: any = {
      type: repeatForm.type,
      interval: repeatForm.interval,
      weekDays: repeatForm.weekDays.length > 0 ? repeatForm.weekDays.join(',') : null,
      dayOfMonth: repeatForm.type === 'MONTHLY' ? repeatForm.dayOfMonth : null,
      endDate: repeatForm.endDate || null,
    }
    await repeatApi.setRepeatRule(props.task.id, rule)
    props.task.repeatRule = JSON.stringify(rule)
    editRepeatEndDate.value = repeatForm.endDate || ''
    showRepeatForm.value = false
    ElMessage.success('已设置循环')
    resetRepeatForm()
  } catch {
    ElMessage.error('设置循环失败')
  }
}

// 删除
const handleDeleteTask = async () => {
  if (!props.task) return
  try {
    await taskApi.deleteTask(props.task.id)
    ElMessage.success('已删除')
    emit('close')
    emit('changed')
  } catch {
    ElMessage.error('删除失败')
  }
}

// 渲染 Markdown
const renderMarkdown = (text: string) => {
  if (!text) return ''
  try {
    return marked(text, { breaks: true, gfm: true }) as string
  } catch {
    return text
  }
}

// 子任务聚焦
const focusLastSubtaskInput = () => {
  setTimeout(() => {
    const inputs = document.querySelectorAll('.subtask-input .el-input__inner')
    const last = inputs[inputs.length - 1] as HTMLElement
    last?.focus()
  }, 100)
}

const handleSubtaskEnter = () => {
  autoSave()
  addSubtask()
  focusLastSubtaskInput()
}
</script>

<template>
  <div :class="['task-edit-panel', mode === 'dialog' ? 'dialog-mode' : 'panel-mode']">
    <!-- 标题 -->
    <div class="panel-section">
      <el-input
        v-model="taskForm.title"
        placeholder="任务标题"
        class="title-input"
        @blur="autoSave"
      />
    </div>

    <!-- 元数据 -->
    <div class="meta-row">
      <!-- 优先级 -->
      <el-dropdown @command="(p: number) => handlePriorityChange(p)" trigger="click">
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
            <el-dropdown-item :command="0">无优先级</el-dropdown-item>
            <el-dropdown-item :command="1">低优先级</el-dropdown-item>
            <el-dropdown-item :command="2">中优先级</el-dropdown-item>
            <el-dropdown-item :command="3">高优先级</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 时间设置 -->
      <el-popover trigger="click" placement="bottom" :width="380" @hide="showRepeatForm = false">
        <template #reference>
          <el-tag
            size="default"
            class="meta-tag clickable"
            :type="
              taskForm.startDate || taskForm.dueDate || task?.repeatRule ? 'warning' : undefined
            "
          >
            <el-icon><Calendar /></el-icon>
            {{ getTimeSummary() }}
          </el-tag>
        </template>
        <div style="padding: 4px 0">
          <el-radio-group
            v-model="taskTimeMode"
            size="small"
            style="margin-bottom: 12px"
            @change="onModeChange"
          >
            <el-radio-button value="normal">🕒 普通任务</el-radio-button>
            <el-radio-button value="repeat">🔄 循环任务</el-radio-button>
          </el-radio-group>

          <!-- 普通模式：开始 + 截止 -->
          <template v-if="taskTimeMode === 'normal'">
            <el-form label-width="80px" size="small">
              <el-form-item label="开始时间">
                <el-date-picker
                  v-model="taskForm.startDate"
                  type="datetime"
                  placeholder="未设置"
                  :format="datePickerFormat"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  style="width: 100%"
                  :teleported="false"
                  @change="autoSave"
                />
              </el-form-item>
              <el-form-item label="截止时间">
                <el-date-picker
                  v-model="taskForm.dueDate"
                  type="datetime"
                  placeholder="未设置"
                  :format="datePickerFormat"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  style="width: 100%"
                  :teleported="false"
                  @change="autoSave"
                />
              </el-form-item>
            </el-form>
          </template>

          <!-- 循环模式：周期基准 + 循环规则 + 循环结束日期 -->
          <template v-else>
            <el-form label-width="90px" size="small">
              <el-form-item label="周期基准">
                <el-date-picker
                  v-model="taskForm.dueDate"
                  type="datetime"
                  placeholder="未设置"
                  :format="datePickerFormat"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  style="width: 100%"
                  :teleported="false"
                  @change="autoSave"
                />
                <div style="font-size: 12px; color: #909399; line-height: 1.4; margin-top: 2px">
                  首次发生时间，下次循环以此为基准
                </div>
              </el-form-item>
            </el-form>
            <el-divider style="margin: 8px 0">循环规则</el-divider>
            <div v-if="task?.repeatRule">
              <div style="margin-bottom: 8px; font-size: 13px; color: #e6a23c">
                🔄 {{ getRepeatLabel(task.repeatRule, task) }}
              </div>
              <el-form label-width="90px" size="small">
                <el-form-item label="循环结束">
                  <el-date-picker
                    v-model="editRepeatEndDate"
                    type="datetime"
                    placeholder="永不结束"
                    :format="datePickerFormat"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    style="width: 100%"
                    :teleported="false"
                  />
                  <div style="font-size: 12px; color: #909399; line-height: 1.4; margin-top: 2px">
                    该日期之后不再生成新循环任务
                  </div>
                </el-form-item>
              </el-form>
              <div style="text-align: right; margin-top: 8px">
                <el-button size="small" type="danger" @click="handleCancelRepeat"
                  >取消循环</el-button
                >
                <el-button size="small" type="primary" @click="handleUpdateRepeatEndDate"
                  >更新</el-button
                >
              </div>
            </div>
            <div v-else>
              <div v-if="!showRepeatForm" style="text-align: center">
                <el-button
                  size="small"
                  @click="showRepeatForm = true; resetRepeatForm()"
                  >+ 设置循环</el-button
                >
              </div>
              <div v-else>
                <el-form label-width="90px" size="small">
                  <el-form-item label="类型">
                    <el-select
                      v-model="repeatForm.type"
                      placeholder="选择"
                      style="width: 100%"
                      :teleported="false"
                      @change="onRepeatTypeChange"
                    >
                      <el-option label="每天" value="DAILY" /><el-option
                        label="每周"
                        value="WEEKLY"
                      /><el-option label="每月" value="MONTHLY" /><el-option
                        label="每年"
                        value="YEARLY"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item v-if="repeatForm.type" label="间隔">
                    <el-input-number
                      v-model="repeatForm.interval"
                      :min="1"
                      :max="365"
                      style="width: 100%"
                      size="small"
                    />
                  </el-form-item>
                  <el-form-item v-if="repeatForm.type === 'WEEKLY'" label="星期">
                    <el-checkbox-group v-model="repeatForm.weekDays" size="small">
                      <el-checkbox :value="1">一</el-checkbox
                      ><el-checkbox :value="2">二</el-checkbox
                      ><el-checkbox :value="3">三</el-checkbox>
                      <el-checkbox :value="4">四</el-checkbox
                      ><el-checkbox :value="5">五</el-checkbox
                      ><el-checkbox :value="6">六</el-checkbox
                      ><el-checkbox :value="7">日</el-checkbox>
                    </el-checkbox-group>
                  </el-form-item>
                  <el-form-item v-if="repeatForm.type === 'MONTHLY'" label="日期">
                    <el-input-number
                      v-model="repeatForm.dayOfMonth"
                      :min="1"
                      :max="31"
                      style="width: 100%"
                      size="small"
                    />
                  </el-form-item>
                  <el-form-item v-if="repeatForm.type" label="循环结束">
                    <el-date-picker
                      v-model="repeatForm.endDate"
                      type="datetime"
                      placeholder="永不结束"
                      :format="datePickerFormat"
                      value-format="YYYY-MM-DDTHH:mm:ss"
                      style="width: 100%"
                      :teleported="false"
                    />
                    <div style="font-size: 12px; color: #909399; line-height: 1.4; margin-top: 2px">
                      该日期之后不再生成新循环任务
                    </div>
                  </el-form-item>
                </el-form>
                <div style="text-align: right; margin-top: 8px">
                  <el-button size="small" @click="showRepeatForm = false">取消</el-button>
                  <el-button size="small" type="primary" @click="handleAddRepeatInPanel"
                    >确定</el-button
                  >
                </div>
              </div>
            </div>
          </template>
        </div>
      </el-popover>

      <!-- 清单 -->
      <el-dropdown @command="handleListChange" trigger="click">
        <el-tag size="default" class="meta-tag clickable" type="success">
          <el-icon><Folder /></el-icon>
          {{
            taskForm.listId
              ? taskLists.find((l: any) => l.id === taskForm.listId)?.name || '清单'
              : '无清单'
          }}
        </el-tag>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="null">无清单</el-dropdown-item>
            <el-dropdown-item v-for="list in taskLists" :key="list.id" :command="list.id">{{
              list.name
            }}</el-dropdown-item>
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
          :teleported="false"
          @change="handleTagChange"
          @visible-change="loadAllTags"
        >
          <el-option v-for="tag in allTags" :key="tag.id" :label="tag.name" :value="tag.id">
            <span
              :style="{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: tag.color,
                marginRight: '8px',
                verticalAlign: 'middle',
              }"
            />
            {{ tag.name }}
          </el-option>
        </el-select>
      </el-popover>
    </div>

    <!-- 标签展示 -->
    <div v-if="taskTags.length > 0" class="tags-row">
      <el-tag
        v-for="tag in taskTags"
        :key="tag.id"
        :color="tag.color"
        size="small"
        closable
        @close="handleRemoveTag(tag.id)"
        :style="{ color: '#fff', marginRight: '6px', marginBottom: '4px' }"
      >
        {{ tag.name }}
      </el-tag>
    </div>

    <!-- 描述 -->
    <div class="panel-section">
      <div class="section-header">
        <h4 class="section-title">描述</h4>
        <el-switch
          v-model="descriptionPreview"
          active-text="预览"
          inactive-text="编辑"
          size="small"
        />
      </div>
      <el-input
        v-if="!descriptionPreview"
        v-model="taskForm.description"
        type="textarea"
        :rows="4"
        placeholder="输入描述（支持 Markdown）"
        @blur="autoSave"
      />
      <div v-else class="markdown-preview" v-html="renderMarkdown(taskForm.description)" />
    </div>

    <!-- 子任务 -->
    <div class="panel-section">
      <div class="section-header">
        <h4 class="section-title">子任务</h4>
        <el-button size="small" @click="addSubtask">+ 添加</el-button>
      </div>
      <div v-for="(st, idx) in taskForm.subtasks" :key="idx" class="subtask-row">
        <el-checkbox :model-value="st.completed" @change="handleSubtaskToggle(st)" />
        <el-input
          v-model="st.title"
          size="small"
          placeholder="子任务标题"
          class="subtask-input"
          @blur="autoSave"
          @keyup.enter="handleSubtaskEnter"
        />
        <el-button size="small" type="danger" text @click="removeSubtask(idx)"
          ><el-icon><Delete /></el-icon
        ></el-button>
      </div>
    </div>

    <!-- 附件 -->
    <div class="panel-section">
      <div class="section-header">
        <h4 class="section-title">附件</h4>
        <label style="cursor: pointer">
          <el-button size="small" tag="span"
            ><el-icon><Upload /></el-icon> 上传</el-button
          >
          <input type="file" style="display: none" @change="handleUploadAttachment" />
        </label>
      </div>
      <div v-for="att in taskAttachments" :key="att.fileName" class="attachment-item">
        <span class="att-name">{{ att.originalName }}</span>
        <span class="att-size">{{ (att.fileSize / 1024).toFixed(1) }} KB</span>
        <el-button size="small" text @click="handleDownloadAttachment(att)"
          ><el-icon><Download /></el-icon
        ></el-button>
        <el-button size="small" text type="danger" @click="handleDeleteAttachment(att)"
          ><el-icon><Delete /></el-icon
        ></el-button>
      </div>
    </div>

    <!-- 操作 -->
    <div v-if="mode === 'dialog'" class="panel-footer">
      <el-button @click="emit('close')">关闭</el-button>
      <el-button type="danger" @click="handleDeleteTask">删除</el-button>
    </div>
  </div>
</template>

<style scoped>
.task-edit-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-mode {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.dialog-mode {
  min-width: 480px;
  max-height: 70vh;
  overflow-y: auto;
}

.title-input :deep(.el-input__inner) {
  font-size: 18px;
  font-weight: 600;
  border: none;
  padding: 0;
  background: transparent;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.meta-tag {
  cursor: pointer;
}
.meta-tag.clickable:hover {
  opacity: 0.8;
}
.tags-row {
  display: flex;
  flex-wrap: wrap;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.section-title {
  margin: 0;
  font-size: 13px;
  color: inherit;
  opacity: 0.7;
}

.markdown-preview {
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 4px;
  padding: 8px;
  min-height: 60px;
  font-size: 13px;
  line-height: 1.6;
  color: inherit;
}

.subtask-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
}
.subtask-input {
  flex: 1;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}
.att-name {
  flex: 1;
}
.att-size {
  color: var(--text-secondary, #888);
  white-space: nowrap;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border, rgba(255, 255, 255, 0.1));
}
</style>

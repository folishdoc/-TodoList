import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { Task, Tag, TaskAttachment, TaskList } from '../types'
import * as taskApi from '../api/task'
import { syncSubtasks } from './useSubtaskSync'
import * as tagApi from '../api/tag'
import * as attachmentApi from '../api/attachment'
import * as repeatApi from '../api/repeat'
import { useTaskTimeMode } from './useTaskTimeMode'
import { hasTimeValue } from './useDateUtils'

export function useTaskEdit(
  loadTasks: () => void,
  emitTaskChanged: () => void,
) {
  // ===== 状态 =====
  const editingTask = ref<Task | null>(null)
  const showCreateTaskDialog = ref(false)
  const submitLoading = ref(false)
  const isSaving = ref(false)
  const descriptionPreview = ref(false)
  const taskFormRef = ref<FormInstance>()

  const taskForm = reactive({
    title: '',
    description: '',
    priority: 0,
    startDate: '',
    dueDate: '',
    listId: null as number | null,
    subtasks: [] as Array<Task & { completed: boolean }>,
  })

  // 标签和附件状态（由编辑面板管理，也可由父组件提供）
  const taskTags = ref<Tag[]>([])
  const taskAttachments = ref<TaskAttachment[]>([])
  const selectedTagIds = ref<number[]>([])

  // 循环相关
  const repeatForm = reactive({
    type: '' as string,
    interval: 1,
    weekDays: [] as number[],
    dayOfMonth: 1,
    endDate: '' as string,
  })
  const editRepeatEndDate = ref('')
  const showRepeatForm = ref(false)

  // 时间模式
  const { mode: taskTimeMode, switchToRepeat, switchToNormal } = useTaskTimeMode(editingTask)

  const onModeChange = async (newMode: 'normal' | 'repeat') => {
    const ctx = { taskForm, showRepeatForm, repeatForm, editRepeatEndDate }
    if (newMode === 'repeat') {
      await switchToRepeat(ctx)
    } else {
      await switchToNormal(ctx)
    }
  }

  // 表单验证规则
  const taskRules = {
    title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
    dueDate: [
      {
        validator: (_rule: Record<string, any>, value: string, callback: (error?: Error) => void) => {
          if (value && taskForm.startDate) {
            if (new Date(value) < new Date(taskForm.startDate)) {
              callback(new Error('结束时间不能早于开始时间'))
              return
            }
          }
          callback()
        },
        trigger: 'change',
      },
    ],
    startDate: [
      {
        validator: (_rule: Record<string, any>, value: string, callback: (error?: Error) => void) => {
          if (value && taskForm.dueDate) {
            if (new Date(value) > new Date(taskForm.dueDate)) {
              callback(new Error('开始时间不能晚于结束时间'))
              return
            }
          }
          callback()
        },
        trigger: 'change',
      },
    ],
  }

  const datePickerFormat = computed(() => {
    const val = taskForm.dueDate || taskForm.startDate
    return hasTimeValue(val) ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'
  })

  // ===== 方法 =====

  const openCreateTaskDialog = () => {
    resetRepeatForm()
    showRepeatForm.value = false
    taskTimeMode.value = 'normal'
    showCreateTaskDialog.value = true
  }

  const handleEditTask = async (task: Task) => {
    editingTask.value = task
    taskForm.title = task.title
    taskForm.description = task.description || ''
    taskForm.priority = task.priority
    taskForm.startDate = task.startDate || ''
    taskForm.dueDate = task.dueDate || ''
    taskForm.listId = task.listId || null

    if (task.repeatRule) {
      try {
        const rule = JSON.parse(task.repeatRule)
        editRepeatEndDate.value = rule.endDate || ''
      } catch (e) {
        console.warn('解析循环规则失败', e)
        editRepeatEndDate.value = ''
      }
    } else {
      editRepeatEndDate.value = ''
    }

    try {
      const res = await taskApi.getSubtasks(task.id)
      taskForm.subtasks = (res.data || []).map((st: Task) => ({
        ...st,
        completed: st.status === 1,
      }))
    } catch (error) {
      console.error('加载子任务失败:', error)
      taskForm.subtasks = []
    }

    try {
      const res = await tagApi.getTaskTags(task.id)
      taskTags.value = res.data || []
      selectedTagIds.value = taskTags.value.map((t: Tag) => t.id)
    } catch (e) {
      console.warn('加载标签失败', e)
      taskTags.value = []
      selectedTagIds.value = []
    }

    try {
      const res = await attachmentApi.getTaskAttachments(task.id)
      taskAttachments.value = res.data || []
    } catch (e) {
      console.warn('加载附件失败', e)
      taskAttachments.value = []
    }
  }

  const handleCalendarTaskClick = (task: Task) => {
    handleEditTask(task)
  }

  const handleMainContentClick = (event: MouseEvent) => {
    if (editingTask.value) {
      const editPanel = document.querySelector('.edit-panel')
      if (editPanel && !editPanel.contains(event.target as Node)) {
        closeEditPanel()
      }
    }
  }

  // 防抖定时器
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

  const closeEditPanel = async () => {
    if (editingTask.value && taskForm.title.trim()) {
      await flushAndSave()
    }
    editingTask.value = null
    resetTaskForm()
  }

  const flushAndSave = async () => {
    if (isSaving.value) return
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
    await doSave()
  }

  const autoSave = () => {
    if (isSaving.value) return

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

  const doSave = async () => {
    if (!editingTask.value || !taskForm.title.trim()) return

    const taskId = editingTask.value.id
    const mainTaskData = {
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      startDate: taskForm.startDate,
      dueDate: taskForm.dueDate,
      listId: taskForm.listId,
      parentId: editingTask.value.parentId,
    }
    const subtasksSnapshot: Array<{ id?: number; title: string; completed: boolean }> = []
    if (taskForm.subtasks) {
      taskForm.subtasks.forEach((st) => {
        if (st.title && st.title.trim()) {
          subtasksSnapshot.push({
            id: st.id,
            title: st.title.trim(),
            completed: st.completed,
          })
        }
      })
    }

    isSaving.value = true
    try {
      await taskApi.updateTask(taskId, mainTaskData)
      await syncSubtasks(taskId, subtasksSnapshot, taskForm.subtasks, loadTasks, emitTaskChanged)
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error('保存失败，请重试')
    } finally {
      isSaving.value = false
    }
  }

  const handlePriorityChange = (priority: string) => {
    taskForm.priority = parseInt(priority)
    autoSave()
  }

  const handleListChange = (listId: string) => {
    taskForm.listId = listId === 'null' ? null : parseInt(listId)
    autoSave()
  }

  const getSelectedListName = (taskLists: TaskList[]) => {
    if (!taskForm.listId) return '无清单'
    const list = taskLists.find((l) => l.id === taskForm.listId)
    return list ? list.name : '无清单'
  }

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
            const submitForm = { ...taskForm }
            if (taskTimeMode.value === 'repeat') {
              submitForm.startDate = submitForm.dueDate
            }
            const res = await taskApi.createTask(submitForm)
            if (repeatForm.type && res.data?.id) {
              try {
                await repeatApi.setRepeatRule(res.data.id, {
                  type: repeatForm.type,
                  interval: repeatForm.interval,
                  weekDays: repeatForm.weekDays.length > 0 ? repeatForm.weekDays.join(',') : null,
                  dayOfMonth: repeatForm.type === 'MONTHLY' ? repeatForm.dayOfMonth : null,
                  endDate: repeatForm.endDate || null,
                })
              } catch {
                ElMessage.warning('循环规则设置失败')
              }
            }
            ElMessage.success('创建成功')
            showCreateTaskDialog.value = false
            resetRepeatForm()
          }
          resetTaskForm()
          loadTasks()
          emitTaskChanged()
        } catch (error) {
          console.error('提交任务失败:', error)
        } finally {
          submitLoading.value = false
        }
      }
    })
  }

  const handleCompleteTask = async (task: Task) => {
    try {
      if (task.status === 1) {
        await taskApi.uncompleteTask(task.id)
      } else {
        await taskApi.completeTask(task.id)
      }
      loadTasks()
      emitTaskChanged()
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

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
    taskTimeMode.value = 'normal'
  }

  const resetRepeatForm = () => {
    repeatForm.type = ''
    repeatForm.interval = 1
    repeatForm.weekDays = []
    repeatForm.dayOfMonth = 1
    repeatForm.endDate = ''
  }

  const onRepeatTypeChange = () => {
    repeatForm.weekDays = []
    repeatForm.dayOfMonth = 1
    repeatForm.endDate = ''
    if (repeatForm.type) {
      repeatForm.interval = 1
    }
  }

  const handleAddRepeatInPanel = async () => {
    if (!editingTask.value || !repeatForm.type) return
    try {
      const rule: Record<string, any> = {
        type: repeatForm.type,
        interval: repeatForm.interval,
        weekDays: repeatForm.weekDays.length > 0 ? repeatForm.weekDays.join(',') : null,
        dayOfMonth: repeatForm.type === 'MONTHLY' ? repeatForm.dayOfMonth : null,
        endDate: repeatForm.endDate || null,
      }
      await repeatApi.setRepeatRule(editingTask.value.id, rule)
      editingTask.value.repeatRule = JSON.stringify(rule)
      editRepeatEndDate.value = repeatForm.endDate || ''
      showRepeatForm.value = false
      ElMessage.success('已设置循环')
      resetRepeatForm()
    } catch {
      ElMessage.error('设置循环失败')
    }
  }

  const handleUpdateRepeatEndDate = async () => {
    if (!editingTask.value?.repeatRule) return
    try {
      const rule = JSON.parse(editingTask.value.repeatRule)
      rule.endDate = editRepeatEndDate.value || null
      await repeatApi.setRepeatRule(editingTask.value.id, rule)
      editingTask.value.repeatRule = JSON.stringify(rule)
      ElMessage.success('循环结束日期已更新')
    } catch {
      ElMessage.error('更新失败')
    }
  }

  const handleCancelRepeat = async () => {
    if (!editingTask.value) return
    try {
      await repeatApi.cancelRepeatRule(editingTask.value.id)
      editingTask.value.repeatRule = null
      editRepeatEndDate.value = ''
      ElMessage.success('已取消循环')
      loadTasks()
    } catch {
      ElMessage.error('取消失败')
    }
  }

  return {
    // 状态
    editingTask,
    showCreateTaskDialog,
    submitLoading,
    isSaving,
    descriptionPreview,
    taskFormRef,
    taskForm,
    taskTags,
    taskAttachments,
    selectedTagIds,
    repeatForm,
    editRepeatEndDate,
    showRepeatForm,
    taskTimeMode,
    datePickerFormat,
    taskRules,

    // 方法
    openCreateTaskDialog,
    handleEditTask,
    handleCalendarTaskClick,
    handleMainContentClick,
    closeEditPanel,
    flushAndSave,
    autoSave,
    doSave,
    handlePriorityChange,
    handleListChange,
    getSelectedListName,
    handleSubmitTask,
    handleCompleteTask,
    resetTaskForm,
    resetRepeatForm,
    onRepeatTypeChange,
    onModeChange,
    handleAddRepeatInPanel,
    handleUpdateRepeatEndDate,
    handleCancelRepeat,
  }
}

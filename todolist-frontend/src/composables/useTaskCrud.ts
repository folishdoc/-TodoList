/**
 * useTaskCrud — 任务列表 CRUD 逻辑
 *
 * 管理任务列表的加载、树结构构建、完成/取消完成、删除（含撤销）、顺延操作。
 * 以扁平列表 + parentId 方式存储，通过 flattenedTree computed 展开父子层级供列表渲染。
 * 支持子任务收起/展开（通过 collapsedIds 控制）。
 */
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Task } from '../types'
import * as taskApi from '../api/task'
import { formatLocalDateTime } from '../utils/date'

export function useTaskCrud() {
  // ── 状态 ──
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const searchKeyword = ref('')
  /** 当前选中的清单 ID（null 表示显示所有任务） */
  const currentListId = ref<number | null>(null)
  /** 已收起的父任务 ID 集合 */
  const collapsedIds = ref(new Set<number>())

  // ── 计算属性 ──

  /** 所有有子任务的任务 ID（用于渲染展开/收起图标） */
  const taskParentIds = computed(() => {
    const ids = new Set<number>()
    tasks.value.forEach((t) => {
      if (t.parentId) ids.add(t.parentId)
    })
    return ids
  })

  /**
   * 将任务列表按 parentId 展开为带缩进层级(level)的扁平列表，供列表渲染使用。
   * 支持任意深度的子任务嵌套。
   * 已收起的父任务的子任务（含子孙）不显示。
   * 当 currentListId 设置时，只显示该清单的任务。
   * 孤立子任务（parentId 对应的父任务不在当前列表中）按顶层任务显示。
   */
  const flattenedTree = computed(() => {
    const result: (Task & { level: number })[] = []
    const childMap = new Map<number, Task[]>()
    const parentIds = new Set<number>()

    let source = tasks.value
    if (currentListId.value != null) {
      source = tasks.value.filter((t) => t.listId === currentListId.value || t.parentId != null)
      // 如果父任务不在当前清单，子任务仍然显示（跟着父任务走）
    }

    source.forEach((task) => {
      parentIds.add(task.id)
      if (task.parentId) {
        if (!childMap.has(task.parentId)) childMap.set(task.parentId, [])
        childMap.get(task.parentId)!.push(task)
      }
    })

    const addChildren = (parentId: number, level: number) => {
      if (collapsedIds.value.has(parentId)) return
      const children = childMap.get(parentId) || []
      children.forEach((child) => {
        result.push({ ...child, level })
        addChildren(child.id, level + 1)
      })
    }

    source.forEach((task) => {
      if (task.parentId) return
      result.push({ ...task, level: 0 })
      addChildren(task.id, 1)
    })

    // 孤立子任务：parentId 指向不存在的父任务
    source.forEach((task) => {
      if (task.parentId && !parentIds.has(task.parentId)) {
        result.push({ ...task, level: 0 })
      }
    })

    return result
  })

  /** 收起/展开父任务的子任务 */
  const toggleCollapse = (taskId: number) => {
    const s = new Set(collapsedIds.value)
    if (s.has(taskId)) s.delete(taskId)
    else s.add(taskId)
    collapsedIds.value = s
  }

  // ── 方法 ──

  /** 加载任务列表（最多 1000 条），可根据关键字搜索 */
  const loadTasks = async () => {
    loading.value = true
    try {
      let params: Record<string, any> = { size: 1000, page: 0 }
      if (searchKeyword.value) params.keyword = searchKeyword.value
      const res = await taskApi.getTasks(params)
      if (res.data?.content) {
        tasks.value = res.data.content
        total.value = res.data.totalElements || res.data.total || 0
      } else if (Array.isArray(res.data)) {
        tasks.value = res.data
        total.value = res.data.length
      }
    } catch (e) {
      console.error('加载任务失败:', e)
    } finally {
      loading.value = false
    }
  }

  /** 切换任务完成状态 */
  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 1 ? 0 : 1
    try {
      await taskApi.updateTask(task.id, { status: newStatus })
      // 乐观更新（flattenedTree 是 task 副本，直接更新原始数组）
      const original = tasks.value.find(t => t.id === task.id)
      if (original) original.status = newStatus
      loadTasks()
    } catch (error) {
      console.error('更新任务状态失败:', error)
    }
  }

  /** 删除任务（含确认对话框和撤销功能） */
  const handleDeleteTask = async (task: Task, showUndo: (msg: string, undoFn: () => Promise<void>) => void, emitTaskChanged: () => void) => {
    try {
      await ElMessageBox.confirm('确定要删除这个任务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })

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
          parentId: deletedTask.parentId,
        })
        loadTasks()
      })
      loadTasks()
      emitTaskChanged()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除任务失败:', error)
      }
    }
  }

  /** 将过期任务顺延到今天（更新截止日期为当天） */
  const handlePostponeTask = async (task: Task) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      await taskApi.updateTaskTime(task.id, { dueDate: formatLocalDateTime(today) })
      ElMessage.success('已顺延至今天')
      loadTasks()
    } catch {
      ElMessage.error('顺延失败')
    }
  }

  return {
    tasks,
    loading,
    total,
    currentPage,
    pageSize,
    searchKeyword,
    currentListId,
    collapsedIds,
    taskParentIds,
    flattenedTree,
    loadTasks,
    handleToggleTask,
    handleDeleteTask,
    handlePostponeTask,
    toggleCollapse,
  }
}

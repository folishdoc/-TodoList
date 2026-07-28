/**
 * useTaskCrud — 任务列表 CRUD 逻辑
 *
 * 管理任务列表的加载、树结构构建、完成/取消完成、删除（含撤销）、顺延操作。
 * 以扁平列表 + parentId 方式存储，通过 taskTree computed 构建父子层级供前端渲染。
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

  // 构建任务树（只构建第一层 parentId 关系，前端渲染使用）
  // ── 计算属性 ──

  /** 构建任务树：将扁平任务列表按 parentId 组装为树形结构，仅一层父子关系 */
  const taskTree = computed(() => {
    const parentMap = new Map<number, Task[]>()
    const topLevel: (Task & { children?: Task[] })[] = []

    tasks.value.forEach((task) => {
      if (task.parentId) {
        if (!parentMap.has(task.parentId)) {
          parentMap.set(task.parentId, [])
        }
        parentMap.get(task.parentId)!.push(task)
      } else {
        topLevel.push(task)
      }
    })

    // 为每个父任务挂载子任务
    topLevel.forEach((task) => {
      task.children = parentMap.get(task.id) || []
    })

    return topLevel
  })

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

  /** 切换任务完成状态（顶层任务使用批量接口，子任务使用单个更新） */
  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 1 ? 0 : 1
    try {
      if (task.parentId) {
        await taskApi.updateTask(task.id, { status: newStatus })
      } else {
        await taskApi.batchToggleTasks([{ taskId: task.id, status: newStatus }])
      }
      task.status = newStatus
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
    taskTree,
    loadTasks,
    handleToggleTask,
    handleDeleteTask,
    handlePostponeTask,
  }
}

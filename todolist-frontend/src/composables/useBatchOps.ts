import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Task, BatchOperationRequest } from '../types'
import * as batchApi from '../api/batch'

export function useBatchOps(tasks: { value: Task[] }) {
  const batchMode = ref(false)
  const selectedTaskIds = ref<Set<number>>(new Set())

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
    const visibleIds = new Set(tasks.value.map((t: Task) => t.id))
    const filtered = tasks.value
      .filter((t: Task) => !t.parentId || !visibleIds.has(t.parentId))
      .map((t: Task) => t.id)
    selectedTaskIds.value = new Set(filtered)
  }

  const handleBatchDelete = async (loadTasks: () => void, emitTaskChanged: () => void) => {
    if (selectedTaskIds.value.size === 0) {
      ElMessage.warning('请先选择要删除的任务')
      return
    }
    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedTaskIds.value.size} 个任务吗？此操作不可恢复。`,
        '批量删除',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
      )
      await batchApi.batchDelete(Array.from(selectedTaskIds.value))
      ElMessage.success(`已删除 ${selectedTaskIds.value.size} 个任务`)
      exitBatchMode()
      loadTasks()
      emitTaskChanged()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('批量删除失败:', error)
        ElMessage.error('批量删除失败')
      }
    }
  }

  return {
    batchMode,
    selectedTaskIds,
    enterBatchMode,
    exitBatchMode,
    toggleTaskSelection,
    handleSelectAll,
    handleBatchDelete,
  }
}

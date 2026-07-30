/**
 * useBatchOps — 批量操作逻辑
 *
 * 管理批量选择/删除模式的启动、退出、全选、选择切换。
 * 依赖 tasks 列表来过滤顶级任务（排除子任务）。
 */
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Task } from '../types'
import * as batchApi from '../api/batch'

export function useBatchOps(tasks: { value: Task[] }) {
  // ── 状态 ──
  const batchMode = ref(false)
  const selectedTaskIds = ref<Set<number>>(new Set())

  /** 进入批量模式 */
  const enterBatchMode = () => {
    batchMode.value = true
    selectedTaskIds.value.clear()
  }

  /** 退出批量模式，清空选择 */
  const exitBatchMode = () => {
    batchMode.value = false
    selectedTaskIds.value.clear()
  }

  /** 切换单个任务的选中状态 */
  const toggleTaskSelection = (taskId: number) => {
    const newSet = new Set(selectedTaskIds.value)
    if (newSet.has(taskId)) {
      newSet.delete(taskId)
    } else {
      newSet.add(taskId)
    }
    selectedTaskIds.value = newSet
  }

  /** 全选当前可见的顶级任务（排除子任务，避免重复计数） */
  const handleSelectAll = () => {
    const visibleIds = new Set(tasks.value.map((t: Task) => t.id))
    const filtered = tasks.value
      .filter((t: Task) => !t.parentId || !visibleIds.has(t.parentId))
      .map((t: Task) => t.id)
    selectedTaskIds.value = new Set(filtered)
  }

  /** 执行批量删除（确认后调用 API，不可恢复） */
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

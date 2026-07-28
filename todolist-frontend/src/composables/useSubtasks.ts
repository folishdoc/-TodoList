/**
 * useSubtasks — 子任务管理逻辑
 *
 * 管理任务编辑表单中的子任务集合：添加、删除、回车跳转。
 * 子任务标题为空时自动聚焦到最后一个输入框。
 * 通常与 useTaskEdit 或 Dashboard.vue 配合使用。
 */
import { ElMessage } from 'element-plus'
import * as taskApi from '../api/task'

export function useSubtasks(
  taskForm: { subtasks: any[] },
  autoSave: () => void,
) {
  // ── 方法 ──

  /** 聚焦到最后一个子任务输入框 */
  const focusLastSubtaskInput = () => {
    setTimeout(() => {
      const inputs = document.querySelectorAll('.subtask-input .el-input__inner')
      if (inputs.length > 0) {
        ;(inputs[inputs.length - 1] as HTMLInputElement).focus()
      }
    }, 100)
  }

  /** 添加子任务（如已有空标题子任务则聚焦到它，不重复添加） */
  const addSubtask = () => {
    if (!taskForm.subtasks) {
      taskForm.subtasks = []
    }

    const hasEmptySubtask = taskForm.subtasks.some((st: any) => !st.title || !st.title.trim())
    if (hasEmptySubtask) {
      focusLastSubtaskInput()
      return
    }

    taskForm.subtasks.push({ title: '', completed: false })
    focusLastSubtaskInput()
  }

  /** 子任务回车后自动保存并添加新空行 */
  const handleSubtaskEnter = (index: number) => {
    const subtask = taskForm.subtasks?.[index]
    if (!subtask) return

    const title = (subtask.title || '').trim()
    if (!title) {
      focusLastSubtaskInput()
      return
    }

    autoSave()
    addSubtask()
  }

  /** 删除子任务（含后端 API 调用，确认已有 id 才调用） */
  const removeSubtask = async (index: number) => {
    if (taskForm.subtasks) {
      const subtask = taskForm.subtasks[index]

      if (subtask.id) {
        try {
          await taskApi.deleteTask(subtask.id)
          ElMessage.success('子任务已删除')
        } catch (error) {
          console.error('删除子任务失败:', error)
          ElMessage.error('删除子任务失败')
          return
        }
      }

      taskForm.subtasks.splice(index, 1)
      autoSave()
    }
  }

  return {
    addSubtask,
    removeSubtask,
    handleSubtaskEnter,
    focusLastSubtaskInput,
  }
}

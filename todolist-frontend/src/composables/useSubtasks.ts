import { ElMessage } from 'element-plus'
import * as taskApi from '../api/task'

export function useSubtasks(
  taskForm: { subtasks: any[] },
  autoSave: () => void,
) {
  const focusLastSubtaskInput = () => {
    setTimeout(() => {
      const inputs = document.querySelectorAll('.subtask-input .el-input__inner')
      if (inputs.length > 0) {
        ;(inputs[inputs.length - 1] as HTMLInputElement).focus()
      }
    }, 100)
  }

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

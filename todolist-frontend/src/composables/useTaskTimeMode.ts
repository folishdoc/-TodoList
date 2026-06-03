// 任务时间模式（普通 / 循环）互斥切换
import { ref, type Ref } from 'vue'
import * as repeatApi from '../api/repeat'

export type TaskTimeMode = 'normal' | 'repeat'

export interface TaskTimeModeContext {
  taskForm: { startDate: string; dueDate: string }
  showRepeatForm: Ref<boolean>
  repeatForm: { type: string }
  editRepeatEndDate: Ref<string>
}

export function useTaskTimeMode(taskRef: Ref<any | null>) {
  const mode = ref<TaskTimeMode>(taskRef.value?.repeatRule ? 'repeat' : 'normal')

  const initFromTask = () => {
    mode.value = taskRef.value?.repeatRule ? 'repeat' : 'normal'
  }

  const cancelExistingRepeat = async () => {
    if (!taskRef.value?.repeatRule) return
    try {
      await repeatApi.cancelRepeatRule(taskRef.value.id)
    } catch {}
    taskRef.value.repeatRule = null
  }

  const switchToRepeat = async (ctx: TaskTimeModeContext) => {
    ctx.taskForm.startDate = ''
    ctx.showRepeatForm.value = false
    ctx.repeatForm.type = ''
    ctx.editRepeatEndDate.value = ''
    await cancelExistingRepeat()
    mode.value = 'repeat'
  }

  const switchToNormal = async (ctx: TaskTimeModeContext) => {
    ctx.showRepeatForm.value = false
    ctx.editRepeatEndDate.value = ''
    await cancelExistingRepeat()
    mode.value = 'normal'
  }

  return { mode, initFromTask, switchToRepeat, switchToNormal }
}

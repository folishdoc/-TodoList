/**
 * useTaskTimeMode — 任务时间模式互斥切换
 *
 * 管理任务在"普通模式"和"循环模式"之间的切换逻辑。
 * 两种模式互斥：普通模式展示开始/截止时间，循环模式展示周期基准 + 循环规则。
 * 切换时会自动取消后端已存在的循环规则。
 */
import { ref, type Ref } from 'vue'
import * as repeatApi from '../api/repeat'

export type TaskTimeMode = 'normal' | 'repeat'

/** 切换模式时需要传递的上下文：包含表单数据和重复规则状态 */
export interface TaskTimeModeContext {
  taskForm: { startDate: string; dueDate: string }
  showRepeatForm: Ref<boolean>
  repeatForm: { type: string }
  editRepeatEndDate: Ref<string>
}

export function useTaskTimeMode(taskRef: Ref<any | null>) {
  // ── 状态 ──
  const mode = ref<TaskTimeMode>(taskRef.value?.repeatRule ? 'repeat' : 'normal')

  // ── 方法 ──

  /** 根据任务当前的 repeatRule 初始化时间模式 */
  const initFromTask = () => {
    mode.value = taskRef.value?.repeatRule ? 'repeat' : 'normal'
  }

  /** 取消后端已存在的循环规则（切换模式时自动调用） */
  const cancelExistingRepeat = async () => {
    if (!taskRef.value?.repeatRule) return
    try {
      await repeatApi.cancelRepeatRule(taskRef.value.id)
    } catch (e) { console.error('取消循环规则失败', e) }
    taskRef.value.repeatRule = null
  }

  /** 切换到循环模式：清空开始时间，重置循环表单，取消已有循环 */
  const switchToRepeat = async (ctx: TaskTimeModeContext) => {
    ctx.taskForm.startDate = ''
    ctx.showRepeatForm.value = false
    ctx.repeatForm.type = ''
    ctx.editRepeatEndDate.value = ''
    await cancelExistingRepeat()
    mode.value = 'repeat'
  }

  /** 切换到普通模式：关闭循环表单，取消已有循环 */
  const switchToNormal = async (ctx: TaskTimeModeContext) => {
    ctx.showRepeatForm.value = false
    ctx.editRepeatEndDate.value = ''
    await cancelExistingRepeat()
    mode.value = 'normal'
  }

  return { mode, initFromTask, switchToRepeat, switchToNormal }
}

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useTaskTimeMode } from './useTaskTimeMode'

vi.mock('../api/repeat', () => ({
  cancelRepeatRule: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
  setRepeatRule: vi.fn().mockResolvedValue({ code: 200, message: 'success' }),
}))

import * as repeatApi from '../api/repeat'

const makeCtx = () => ({
  taskForm: { startDate: '2026-06-10T09:00:00', dueDate: '2026-06-15T18:00:00' },
  showRepeatForm: ref(false),
  repeatForm: { type: '' as string },
  editRepeatEndDate: ref(''),
})

describe('composables/useTaskTimeMode.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initFromTask', () => {
    it('无 repeatRule 时初始化为 normal', () => {
      const taskRef = ref<any>({ id: 1, repeatRule: null })
      const { mode, initFromTask } = useTaskTimeMode(taskRef)
      initFromTask()
      expect(mode.value).toBe('normal')
    })

    it('有 repeatRule 时初始化为 repeat', () => {
      const taskRef = ref<any>({ id: 1, repeatRule: '{"type":"DAILY"}' })
      const { mode, initFromTask } = useTaskTimeMode(taskRef)
      initFromTask()
      expect(mode.value).toBe('repeat')
    })

    it('task 为 null 时初始化为 normal', () => {
      const taskRef = ref<any | null>(null)
      const { mode, initFromTask } = useTaskTimeMode(taskRef)
      initFromTask()
      expect(mode.value).toBe('normal')
    })
  })

  describe('switchToRepeat', () => {
    it('清空 startDate、周期基准继承 startDate（而非截止时间）', async () => {
      const taskRef = ref<any>({ id: 1, repeatRule: null })
      const { mode, switchToRepeat } = useTaskTimeMode(taskRef)
      const ctx = makeCtx()

      await switchToRepeat(ctx)

      expect(ctx.taskForm.startDate).toBe('')
      expect(ctx.taskForm.dueDate).toBe('2026-06-10T09:00:00')
      expect(mode.value).toBe('repeat')
      expect(ctx.showRepeatForm.value).toBe(false)
      expect(ctx.repeatForm.type).toBe('')
    })

    it('无旧 rule 时不调 cancelRepeatRule', async () => {
      const taskRef = ref<any>({ id: 1, repeatRule: null })
      const { switchToRepeat } = useTaskTimeMode(taskRef)
      await switchToRepeat(makeCtx())
      expect(repeatApi.cancelRepeatRule).not.toHaveBeenCalled()
    })

    it('已有旧 rule 时调 cancelRepeatRule 并清空', async () => {
      const taskRef = ref<any>({ id: 1, repeatRule: '{"type":"DAILY"}' })
      const { switchToRepeat } = useTaskTimeMode(taskRef)
      await switchToRepeat(makeCtx())
      expect(repeatApi.cancelRepeatRule).toHaveBeenCalledWith(1)
      expect(taskRef.value.repeatRule).toBeNull()
    })

    it('清空 editRepeatEndDate', async () => {
      const taskRef = ref<any>({ id: 1, repeatRule: null })
      const { switchToRepeat } = useTaskTimeMode(taskRef)
      const ctx = makeCtx()
      ctx.editRepeatEndDate.value = '2026-12-31T00:00:00'
      await switchToRepeat(ctx)
      expect(ctx.editRepeatEndDate.value).toBe('')
    })
  })

  describe('switchToNormal', () => {
    it('当前是 repeat 切到 normal：调 cancelRepeatRule', async () => {
      const taskRef = ref<any>({ id: 2, repeatRule: '{"type":"WEEKLY"}' })
      const { mode, switchToNormal } = useTaskTimeMode(taskRef)
      const ctx = makeCtx()

      await switchToNormal(ctx)

      expect(repeatApi.cancelRepeatRule).toHaveBeenCalledWith(2)
      expect(taskRef.value.repeatRule).toBeNull()
      expect(mode.value).toBe('normal')
    })

    it('无旧 rule 时不调 cancelRepeatRule', async () => {
      const taskRef = ref<any>({ id: 2, repeatRule: null })
      const { switchToNormal } = useTaskTimeMode(taskRef)
      await switchToNormal(makeCtx())
      expect(repeatApi.cancelRepeatRule).not.toHaveBeenCalled()
    })

    it('保留 taskForm.dueDate（用户在普通模式可继续编辑）', async () => {
      const taskRef = ref<any>({ id: 2, repeatRule: null })
      const { switchToNormal } = useTaskTimeMode(taskRef)
      const ctx = makeCtx()
      await switchToNormal(ctx)
      expect(ctx.taskForm.dueDate).toBe('2026-06-15T18:00:00')
    })

    it('cancelRepeatRule 失败时仍切换模式（不抛错）', async () => {
      ;(repeatApi.cancelRepeatRule as any).mockRejectedValueOnce(new Error('network'))
      const taskRef = ref<any>({ id: 2, repeatRule: '{"type":"DAILY"}' })
      const { mode, switchToNormal } = useTaskTimeMode(taskRef)
      await switchToNormal(makeCtx())
      expect(mode.value).toBe('normal')
      expect(taskRef.value.repeatRule).toBeNull()
    })
  })
})

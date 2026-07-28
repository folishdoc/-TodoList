/**
 * useCalendarDrag — 日历拖拽交互逻辑
 *
 * 处理两种拖拽操作：
 * 1. 条形图（Bar）拖拽：左右移动/缩放宽度的任务条
 * 2. 日任务栏（DayBar）拖拽：上下移动/缩放任务块
 *
 * 使用 Pointer Events API（setPointerCapture）确保拖拽过程中
 * 不会丢失事件，并抑制拖拽结束时的 click 冒泡。
 */
import { ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as taskApi from '../api/task'
import { formatLocalDateTime } from '../utils/date'
import {
  findDayIndexInBar,
  getDayBarMinutes,
  getMinuteFromY,
  hasTimeComponent,
} from './useCalendarGrid'

export function useCalendarDrag(
  barDays: Ref<any[]>,
  dayBarDate: Ref<Date | string>,
  SLOT_HEIGHT: number,
  loadTasks: () => Promise<void>,
  onTaskClick: (task: any) => void,
  openCreateWithTime: (date: Date, time?: { h: number; m: number } | null) => void,
) {
  // ── 条形图拖拽状态 ──
  const dragState = ref<any>(null)
  const dragPreviewStyle = ref<any>(null)
  const dragHint = ref('')

  // ── DayBar 拖拽状态 ──
  const dayBarDrag = ref<any>(null)
  const dayBarDragPreview = ref<any>(null)
  const dayBarDragHint = ref('')
  const dayBarSuppressClick = ref(0)

  // ── 条形图拖拽处理 ──

  /**
   * 条形图任务 pointerdown：开始移动
   * 记录起始列的索引（origSi/origEi）
   */
  const onBarPointerDown = (e: PointerEvent, task: any) => {
    if (dragState.value) return
    const sd = task.startDate ? new Date(task.startDate) : new Date(task.dueDate)
    const dd = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate)
    const si = findDayIndexInBar(sd, barDays.value),
      ei = findDayIndexInBar(dd, barDays.value)
    dragState.value = {
      task,
      mode: 'move',
      startX: e.clientX,
      origSi: si === -1 ? 0 : si,
      origEi: ei === -1 ? barDays.value.length - 1 : ei,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  /**
   * 条形图任务 resize handle pointerdown：开始缩放
   * side: 'left' 左边缘 / 'right' 右边缘
   */
  const onResizeStart = (e: PointerEvent, task: any, side: 'left' | 'right') => {
    if (dragState.value) return
    const sd = task.startDate ? new Date(task.startDate) : new Date(task.dueDate)
    const dd = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate)
    const si = findDayIndexInBar(sd, barDays.value),
      ei = findDayIndexInBar(dd, barDays.value)
    dragState.value = {
      task,
      mode: side === 'left' ? 'resize-left' : 'resize-right',
      startX: e.clientX,
      origSi: si === -1 ? 0 : si,
      origEi: ei === -1 ? barDays.value.length - 1 : ei,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  /** 条形图移动中：计算新的列索引，更新预览样式 */
  const onBarPointerMove = (e: PointerEvent) => {
    if (!dragState.value) return
    const dx = e.clientX - dragState.value.startX
    const container = document.querySelector('.bar-header') as HTMLElement
    if (!container) return
    const colWidth = container.getBoundingClientRect().width / barDays.value.length
    const colDelta = Math.round(dx / colWidth)
    let si = dragState.value.origSi,
      ei = dragState.value.origEi
    if (dragState.value.mode === 'move') {
      si += colDelta
      ei += colDelta
    } else if (dragState.value.mode === 'resize-left') {
      si += colDelta
    } else if (dragState.value.mode === 'resize-right') {
      ei += colDelta
    }
    si = Math.max(0, si)
    ei = Math.min(barDays.value.length - 1, ei)
    if (dragState.value.mode !== 'move' && si >= ei) return
    dragPreviewStyle.value = {
      gridColumn: `${si + 1} / span ${ei - si + 1}`,
      opacity: 0.7,
      background: 'rgba(64,158,255,0.3)',
    }
    const startDay = new Date(barDays.value[si].date),
      endDay = new Date(barDays.value[ei].date)
    const fmtD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
    dragHint.value = `${fmtD(startDay)} → ${fmtD(endDay)}`
  }

  /** 条形图拖拽结束：调用 API 更新时间 */
  const onBarPointerUp = async () => {
    if (!dragState.value) return
    const { task, mode, origSi, origEi } = dragState.value
    const style = dragPreviewStyle.value
    dragState.value = null
    dragPreviewStyle.value = null
    dragHint.value = ''
    if (!style) {
      onTaskClick(task)
      return
    }
    const m = style.gridColumn.match(/(\d+)\s*\/\s*span\s*(\d+)/)
    if (!m) return
    const newSi = parseInt(m[1]) - 1,
      newSpan = parseInt(m[2]),
      newEi = newSi + newSpan - 1
    if (newSi === origSi && newEi === origEi) return
    const startDate = barDays.value[newSi] ? new Date(barDays.value[newSi].date) : null
    const endDate = barDays.value[newEi] ? new Date(barDays.value[newEi].date) : null
    if (endDate) endDate.setHours(23, 59, 59, 999)
    try {
      const update: any = {}
      if (mode === 'resize-left' || mode === 'move') {
        if (startDate) {
          if (task.startDate) {
            const orig = new Date(task.startDate)
            startDate.setHours(orig.getHours(), orig.getMinutes(), 0, 0)
          }
          update.startDate = formatLocalDateTime(startDate)
        }
      }
      if (mode === 'resize-right' || mode === 'move') {
        if (endDate) {
          if (task.dueDate) {
            const orig = new Date(task.dueDate)
            endDate.setHours(orig.getHours(), orig.getMinutes(), 0, 0)
          }
          update.dueDate = formatLocalDateTime(endDate)
        }
      }
      if (Object.keys(update).length > 0) {
        await taskApi.updateTaskTime(task.id, update)
        ElMessage.success('时间已更新')
        await loadTasks()
      }
    } catch (err) {
      console.error('更新任务时间失败:', err)
      ElMessage.error('时间更新失败')
    }
  }

  // ── DayBar 拖拽处理 ──

  /** DayBar 任务 pointerdown：开始移动 */
  const onDayBarPointerDown = (e: PointerEvent, task: any) => {
    if (dayBarDrag.value) return
    const { startMin, endMin } = getDayBarMinutes(task, dayBarDate.value)
    const curMin = getMinuteFromY(e.clientY, SLOT_HEIGHT)
    dayBarDrag.value = {
      task,
      mode: 'move',
      startMin,
      endMin,
      grabMin: curMin,
      startY: e.clientY,
      moved: false,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  /** DayBar 任务 resize handle pointerdown：开始缩放（上/下边缘） */
  const onDayBarResizeStart = (e: PointerEvent, task: any, side: 'top' | 'bottom') => {
    if (dayBarDrag.value) return
    const { startMin, endMin } = getDayBarMinutes(task, dayBarDate.value)
    const curMin = getMinuteFromY(e.clientY, SLOT_HEIGHT)
    dayBarDrag.value = {
      task,
      mode: side === 'top' ? 'resize-top' : 'resize-bottom',
      startMin,
      endMin,
      grabMin: curMin,
      startY: e.clientY,
      moved: false,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  /** DayBar 移动中：根据鼠标 Y 计算新位置，更新预览 */
  const onDayBarPointerMove = (e: PointerEvent) => {
    if (!dayBarDrag.value) return
    // 4px 死区避免误触
    if (!dayBarDrag.value.moved && Math.abs(e.clientY - dayBarDrag.value.startY) > 4) {
      dayBarDrag.value.moved = true
    }
    const curMin = getMinuteFromY(e.clientY, SLOT_HEIGHT)
    if (curMin < 0) return
    const dMin = curMin - dayBarDrag.value.grabMin
    let sm = dayBarDrag.value.startMin,
      em = dayBarDrag.value.endMin
    if (dayBarDrag.value.mode === 'move') {
      sm = Math.max(0, dayBarDrag.value.startMin + dMin)
      em = Math.min(24 * 60, dayBarDrag.value.endMin + dMin)
      if (sm < 0) {
        em -= sm
        sm = 0
      }
      if (em > 24 * 60) {
        sm -= em - 24 * 60
        em = 24 * 60
      }
    } else if (dayBarDrag.value.mode === 'resize-top') {
      sm = Math.max(0, Math.min(em - 15, dayBarDrag.value.startMin + dMin))
    } else if (dayBarDrag.value.mode === 'resize-bottom') {
      em = Math.max(sm + 15, Math.min(24 * 60, dayBarDrag.value.endMin + dMin))
    }
    const top = (sm / 30) * SLOT_HEIGHT
    const h = Math.max(24, ((em - sm) / 30) * SLOT_HEIGHT)
    dayBarDragPreview.value = {
      top: top + 'px',
      height: h + 'px',
      width: 'calc(100% - 12px)',
      opacity: 0.7,
      background: 'rgba(64,158,255,0.3)',
    }
    const fmtMm = (mm: number) =>
      `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`
    dayBarDragHint.value = `${fmtMm(sm)} → ${fmtMm(em)}`
  }

  /** DayBar 拖拽结束：调用 API 更新时间 */
  const onDayBarPointerUp = async () => {
    if (!dayBarDrag.value) return
    const { task, mode, startMin: origSm, endMin: origEm, moved } = dayBarDrag.value
    const preview = dayBarDragPreview.value
    const wasMoved = moved
    dayBarDrag.value = null
    dayBarDragPreview.value = null
    dayBarDragHint.value = ''
    // 如果有移动，标记抑制后续 click 事件
    if (wasMoved) dayBarSuppressClick.value = Date.now()
    if (!preview) {
      onTaskClick(task)
      return
    }
    const targetDate = new Date(dayBarDate.value)
    const h = parseFloat(preview.height),
      top = parseFloat(preview.top)
    const sm = Math.round(((top / SLOT_HEIGHT) * 30) / 15) * 15
    const em = Math.round((((top + h) / SLOT_HEIGHT) * 30) / 15) * 15
    if (Math.abs(sm - origSm) < 15 && Math.abs(em - origEm) < 15) return
    const update: any = {}
    if (mode === 'resize-top' || mode === 'move') {
      if (mode !== 'move' || task.startDate) {
        const baseDate = task.startDate ? new Date(task.startDate) : new Date(targetDate)
        baseDate.setHours(Math.floor(sm / 60), sm % 60, 0, 0)
        update.startDate = formatLocalDateTime(baseDate)
      }
    }
    if (mode === 'resize-bottom' || mode === 'move') {
      const baseDate = task.dueDate ? new Date(task.dueDate) : new Date(targetDate)
      baseDate.setHours(Math.floor(em / 60), em % 60, 0, 0)
      update.dueDate = formatLocalDateTime(baseDate)
    }
    if (Object.keys(update).length > 0) {
      try {
        await taskApi.updateTaskTime(task.id, update)
        ElMessage.success('时间已更新')
        await loadTasks()
      } catch (err) {
        console.error('更新时间失败:', err)
        ElMessage.error('时间更新失败')
      }
    }
  }

  /**
   * DayBar 空白区域点击：在点击时间位置弹出新建任务对话框
   * 使用 200ms 抑制（drag 结束后触发 click 时忽略）
   */
  const onDayBarTrackClick = (e: MouseEvent) => {
    if (Date.now() - dayBarSuppressClick.value < 200) return
    const target = e.target as HTMLElement
    if (target.closest('.daybar-task') || target.closest('.time-tick')) return
    const minute = getMinuteFromY(e.clientY, SLOT_HEIGHT)
    if (minute < 0) return
    const h = Math.floor(minute / 60)
    const m = minute % 60
    openCreateWithTime(new Date(dayBarDate.value), { h, m })
  }

  return {
    dragState,
    dragPreviewStyle,
    dragHint,
    dayBarDrag,
    dayBarDragPreview,
    dayBarDragHint,
    dayBarSuppressClick,
    onBarPointerDown,
    onResizeStart,
    onBarPointerMove,
    onBarPointerUp,
    onDayBarPointerDown,
    onDayBarResizeStart,
    onDayBarPointerMove,
    onDayBarPointerUp,
    onDayBarTrackClick,
  }
}

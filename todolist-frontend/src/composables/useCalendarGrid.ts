/**
 * useCalendarGrid — 日历网格计算属性
 *
 * 纯工具函数 + Vue computed 属性，用于生成月视图、周视图、条形图、日任务栏
 * 的网格数据和任务定位。包含：
 * - 日期范围计算（周起始、月日历填充）
 * - 任务在日历格子中的类型判断（start/end/middle/both）
 * - 条形图（bar）和日任务栏（daybar）的布局样式计算
 */
import { computed, type Ref } from 'vue'

// ── 纯工具函数 ──

/** 获取给定日期所在周的周日（每周第一天） */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

/** 判断任务是否已过期（有截止日期且状态不是已完成且截止日期已过） */
export function isOverdue(task: any): boolean {
  return task.dueDate && task.status !== 1 && new Date(task.dueDate) < new Date()
}

/** 格式化时间字符串为 HH:mm */
export function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * 判断任务在某个日期单元格中的类型：
 * - 'start' = 开始日
 * - 'end' = 截止日
 * - 'both' = 同一天开始+截止
 * - 'middle' = 区间中间日
 * - 'none' = 不在此日期
 */
export function getTaskDateType(
  task: any,
  cellDateIso: string,
): 'start' | 'end' | 'both' | 'middle' | 'none' {
  const cellDay = new Date(cellDateIso).toDateString()
  const startDay = task.startDate ? new Date(task.startDate).toDateString() : null
  const dueDay = task.dueDate ? new Date(task.dueDate).toDateString() : null
  if (!startDay && !dueDay) return 'none'
  if (startDay === cellDay && dueDay === cellDay) return 'both'
  if (startDay === cellDay) return 'start'
  if (dueDay === cellDay) return 'end'
  if (startDay && dueDay) {
    const c = new Date(cellDay).getTime(),
      s = new Date(startDay).getTime(),
      e = new Date(dueDay).getTime()
    if (c > s && c < e) return 'middle'
  }
  return 'none'
}

/** 在条形图天数数组中查找日期所在的索引 */
export function findDayIndexInBar(date: Date, barDays: any[]): number {
  const td = new Date(date).toDateString()
  return barDays.findIndex((d) => new Date(d.date).toDateString() === td)
}

/** 计算条形图任务的 gridColumn 样式 */
export function getBarStyle(task: any, barDays: any[]) {
  const sd = task.startDate ? new Date(task.startDate) : null,
    dd = task.dueDate ? new Date(task.dueDate) : null
  if (!sd && !dd) return { display: 'none' }
  let si = findDayIndexInBar(sd || dd!, barDays),
    ei = findDayIndexInBar(dd || sd!, barDays)
  if (si === -1 && ei === -1) return { display: 'none' }
  if (si === -1) si = 0
  if (ei === -1) ei = barDays.length - 1
  return { gridColumn: `${si + 1} / span ${Math.max(ei - si + 1, 1)}` }
}

/** 生成任务 tooltip 提示文本 */
export function taskTooltipContent(task: any) {
  const fmt = (d: string) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  }
  const parts = [task.title]
  if (task.startDate) parts.push(`开始: ${fmt(task.startDate)}`)
  if (task.dueDate) parts.push(`截止: ${fmt(task.dueDate)}`)
  parts.push(`优先级: ${['无', '低', '中', '高'][task.priority || 0]}`)
  if (task.status === 1) parts.push('[已完成]')
  return parts.join('\n')
}

/** 检查日期字符串是否包含非零时间分量 */
export function hasTimeComponent(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime()) && (d.getHours() !== 0 || d.getMinutes() !== 0)
}

/** 获取 daybar 中任务的时间标签文本 */
export function getDayBarTimeLabel(task: any, dayBarDate: string | Date) {
  if (!task._hasTimeOnTarget) return ''
  const targetDate = new Date(dayBarDate).toDateString()
  let s = '',
    e = ''
  if (
    task.startDate &&
    new Date(task.startDate).toDateString() === targetDate &&
    hasTimeComponent(task.startDate)
  )
    s = formatTime(task.startDate)
  if (
    task.dueDate &&
    new Date(task.dueDate).toDateString() === targetDate &&
    hasTimeComponent(task.dueDate)
  )
    e = formatTime(task.dueDate)
  if (s && e) return `${s} - ${e}`
  if (s) return `${s} 起`
  if (e) return `${e} 止`
  return ''
}

/** 获取 daybar 中任务的起始和结束分钟数（相对于当日 00:00） */
export function getDayBarMinutes(task: any, dayBarDate: string | Date) {
  if (task._startMin !== undefined && task._endMin !== undefined) {
    return { startMin: task._startMin, endMin: task._endMin }
  }
  const targetDate = new Date(dayBarDate).toDateString()
  let startMin = 0,
    endMin = 24 * 60
  if (task.startDate && new Date(task.startDate).toDateString() === targetDate) {
    const sd = new Date(task.startDate)
    startMin = sd.getHours() * 60 + sd.getMinutes()
  }
  if (task.dueDate && new Date(task.dueDate).toDateString() === targetDate) {
    const dd = new Date(task.dueDate)
    endMin = dd.getHours() * 60 + dd.getMinutes()
  }
  if (endMin <= startMin) endMin = startMin + 60
  return { startMin, endMin }
}

/** 根据鼠标 clientY 计算对应的当日分钟数（以 15 分钟为粒度） */
export function getMinuteFromY(clientY: number, SLOT_HEIGHT: number): number {
  const track = document.querySelector('.daybar-track') as HTMLElement
  if (!track) return -1
  const rect = track.getBoundingClientRect()
  const relY = clientY - rect.top + track.scrollTop
  const minute = Math.round(((relY / SLOT_HEIGHT) * 30) / 15) * 15
  return Math.max(0, Math.min(24 * 60, minute))
}

/** 获取 daybar 中任务的 CSS 样式（由 _barStyle 预处理） */
export function getDayBarStyle(task: any) {
  return task._barStyle || { top: '0px', height: '24px', width: 'calc(100% - 12px)' }
}

// ── Composable: 日历网格 computed 属性 ──

export function useCalendarGrid(
  currentDate: Ref<Date>,
  filteredTasks: Ref<any[]>,
  barScale: Ref<'week' | 'month'>,
  dayBarDate: Ref<Date | string>,
  weekDays: string[],
  SLOT_HEIGHT: number,
) {
  /** 创建单个日期的数据对象（包含日期、是否当月、是否今天、关联任务） */
  const createDayData = (date: Date, isCurrentMonth: boolean, weekDay?: string) => {
    const today = new Date(),
      isToday = date.toDateString() === today.toDateString()
    const tasks = filteredTasks.value.filter((task: any) => {
      if (!task.dueDate && !task.startDate) return false
      const cellDay = date.toDateString()
      if (task.dueDate && new Date(task.dueDate).toDateString() === cellDay) return true
      if (task.startDate && new Date(task.startDate).toDateString() === cellDay) return true
      if (task.startDate && task.dueDate) {
        const start = new Date(task.startDate),
          end = new Date(task.dueDate),
          cell = new Date(date)
        cell.setHours(0, 0, 0, 0)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        return cell > start && cell < end
      }
      return false
    })
    return {
      date: date.toISOString(),
      dayNumber: date.getDate(),
      weekDay: weekDay || '',
      isCurrentMonth,
      isToday,
      tasks,
    }
  }

  /** 月视图全部天数（42 格，包含前后月填充） */
  const calendarDays = computed(() => {
    const year = currentDate.value.getFullYear(),
      month = currentDate.value.getMonth()
    const firstDay = new Date(year, month, 1),
      lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay(),
      daysInMonth = lastDay.getDate()
    const days: any[] = []
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startPadding - 1; i >= 0; i--)
      days.push(createDayData(new Date(year, month - 1, prevMonthLastDay - i), false))
    for (let i = 1; i <= daysInMonth; i++)
      days.push(createDayData(new Date(year, month, i), true, weekDays[(startPadding + i - 1) % 7]))
    for (let i = 1; i <= 42 - days.length; i++)
      days.push(createDayData(new Date(year, month + 1, i), false))
    return days
  })

  /** 周视图 7 天数据 */
  const weekDaysData = computed(() => {
    const start = getWeekStart(currentDate.value)
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      days.push(createDayData(date, true, weekDays[i]))
    }
    return days
  })

  /** 条形图的天数（取决于 barScale：周或月） */
  const barDays = computed(() =>
    barScale.value === 'week' ? weekDaysData.value : calendarDays.value,
  )

  const barHeaderStyle = computed(() => ({
    gridTemplateColumns: `repeat(${barDays.value.length}, 1fr)`,
  }))

  const barRowStyle = computed(() => ({
    gridTemplateColumns: `repeat(${barDays.value.length}, 1fr)`,
  }))

  /** 条形图中显示的任务（按优先级+时间排序） */
  const barTasks = computed(() => {
    return filteredTasks.value
      .filter((t: any) => t.dueDate || t.startDate)
      .filter((t: any) => {
        if (barDays.value.length === 0) return false
        const firstCell = new Date(barDays.value[0].date),
          lastCell = new Date(barDays.value[barDays.value.length - 1].date)
        lastCell.setHours(23, 59, 59, 999)
        const ts = t.startDate ? new Date(t.startDate) : new Date(t.dueDate),
          te = t.dueDate ? new Date(t.dueDate) : new Date(t.startDate)
        return ts <= lastCell && te >= firstCell
      })
      .sort((a: any, b: any) => {
        if (b.priority !== a.priority) return b.priority - a.priority
        const aS = a.startDate
          ? new Date(a.startDate).getTime()
          : a.dueDate
            ? new Date(a.dueDate).getTime()
            : 0
        const bS = b.startDate
          ? new Date(b.startDate).getTime()
          : b.dueDate
            ? new Date(b.dueDate).getTime()
            : 0
        return aS - bS
      })
  })

  /** Daybar 日期文本 */
  const dayBarDateText = computed(() => {
    const d = dayBarDate.value instanceof Date ? dayBarDate.value : new Date(dayBarDate.value)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
  })

  /** 时间槽标签（每 30 分钟一个槽） */
  const timeSlots = computed(() => {
    const slots = []
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        slots.push({
          label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          isHour: m === 0,
        })
      }
    }
    return slots
  })

  /** 时间刻度线位置（每 30 分钟一条线，每整小时刻度更高） */
  const timeTicks = computed(() => {
    const ticks = []
    for (let i = 0; i < 48; i++) {
      ticks.push({ top: i * SLOT_HEIGHT, isHour: i % 2 === 0 })
    }
    return ticks
  })

  /**
   * Daybar 视图中的任务列表
   * 为每个任务计算 CSS 定位（_barStyle），处理纯日期任务和时间任务的区别：
   * - 有时间 → 按时间精确定位
   * - 纯日期（全天） → 在右侧堆叠显示
   */
  const dayBarTasks = computed(() => {
    const targetDate = new Date(dayBarDate.value).toDateString()
    let dateOnlyOffset = 0

    return filteredTasks.value
      .filter((t: any) => {
        if (!t.dueDate && !t.startDate) return false
        if (t.dueDate && new Date(t.dueDate).toDateString() === targetDate) return true
        if (t.startDate && new Date(t.startDate).toDateString() === targetDate) return true
        if (t.startDate && t.dueDate) {
          const s = new Date(t.startDate),
            e = new Date(t.dueDate)
          s.setHours(0, 0, 0, 0)
          e.setHours(0, 0, 0, 0)
          const c = new Date(targetDate)
          c.setHours(0, 0, 0, 0)
          return c >= s && c <= e
        }
        return false
      })
      .sort((a: any, b: any) => {
        const aS = a.startDate
          ? new Date(a.startDate).getTime()
          : a.dueDate
            ? new Date(a.dueDate).getTime()
            : 0
        const bS = b.startDate
          ? new Date(b.startDate).getTime()
          : b.dueDate
            ? new Date(b.dueDate).getTime()
            : 0
        return aS - bS
      })
      .map((task: any) => {
        let startH = 0,
          startM = 0,
          endH = 0,
          endM = 0

        const hasStartOnTarget =
          task.startDate && new Date(task.startDate).toDateString() === targetDate
        const hasEndOnTarget =
          task.dueDate && new Date(task.dueDate).toDateString() === targetDate

        if (hasStartOnTarget) {
          const sd = new Date(task.startDate)
          startH = sd.getHours()
          startM = sd.getMinutes()
        }
        if (hasEndOnTarget) {
          const dd = new Date(task.dueDate)
          endH = dd.getHours()
          endM = dd.getMinutes()
        } else if (!task.dueDate || new Date(task.dueDate).toDateString() !== targetDate) {
          endH = 23
          endM = 59
        }
        if (!task.startDate || new Date(task.startDate).toDateString() !== targetDate) {
          startH = 0
          startM = 0
        }

        const startHasTime = hasStartOnTarget && hasTimeComponent(task.startDate)
        const endHasTime = hasEndOnTarget && hasTimeComponent(task.dueDate)
        const hasTimeOnTarget = startHasTime || endHasTime

        let isDateOnly = false

        // 全天任务或跨天任务：在右侧区域堆叠
        if (task.dueDate === task.startDate || (!task.startDate && task.dueDate)) {
          if (hasTimeOnTarget) {
            const dd = new Date(task.dueDate)
            endH = dd.getHours()
            endM = dd.getMinutes()
            startH = Math.max(0, endH - 1)
            startM = endM
          } else {
            isDateOnly = true
            startH = dateOnlyOffset
            startM = 0
            endH = startH + 1
            endM = 0
            dateOnlyOffset++
          }
        } else if (!hasTimeOnTarget && endH - startH >= 12) {
          isDateOnly = true
          startH = dateOnlyOffset
          startM = 0
          endH = startH + 1
          endM = 0
          dateOnlyOffset++
        }

        const startMin = startH * 60 + startM,
          endMin = endH * 60 + endM
        const top = (startMin / 30) * SLOT_HEIGHT
        const height = Math.max(((endMin - startMin) / 30) * SLOT_HEIGHT, 24)
        return {
          ...task,
          _barStyle: {
            top: top + 'px',
            height: height + 'px',
            width: isDateOnly ? 'calc(100% - 72px)' : 'calc(100% - 12px)',
            left: isDateOnly ? '60px' : '6px',
          },
          _hasTimeOnTarget: hasTimeOnTarget,
          _isDateOnly: isDateOnly,
          _startMin: startMin,
          _endMin: endMin,
        }
      })
  })

  /** 获取指定小时内的任务（月/周视图用） */
  const getTasksByHour = (hour: number) => {
    const ds = currentDate.value.toDateString()
    return filteredTasks.value.filter(
      (t: any) =>
        t.dueDate &&
        new Date(t.dueDate).toDateString() === ds &&
        new Date(t.dueDate).getHours() === hour,
    )
  }

  return {
    calendarDays,
    weekDaysData,
    barDays,
    barHeaderStyle,
    barRowStyle,
    barTasks,
    dayBarDateText,
    timeSlots,
    timeTicks,
    dayBarTasks,
    createDayData,
    getTasksByHour,
  }
}

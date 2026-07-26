import { computed, type Ref } from 'vue'

// ===== Pure utility functions =====

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function isOverdue(task: any): boolean {
  return task.dueDate && task.status !== 1 && new Date(task.dueDate) < new Date()
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

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

export function findDayIndexInBar(date: Date, barDays: any[]): number {
  const td = new Date(date).toDateString()
  return barDays.findIndex((d) => new Date(d.date).toDateString() === td)
}

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

export function hasTimeComponent(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime()) && (d.getHours() !== 0 || d.getMinutes() !== 0)
}

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

export function getMinuteFromY(clientY: number, SLOT_HEIGHT: number): number {
  const track = document.querySelector('.daybar-track') as HTMLElement
  if (!track) return -1
  const rect = track.getBoundingClientRect()
  const relY = clientY - rect.top + track.scrollTop
  const minute = Math.round(((relY / SLOT_HEIGHT) * 30) / 15) * 15
  return Math.max(0, Math.min(24 * 60, minute))
}

export function getDayBarStyle(task: any) {
  return task._barStyle || { top: '0px', height: '24px', width: 'calc(100% - 12px)' }
}

// ===== Composable: grid computed properties =====

export function useCalendarGrid(
  currentDate: Ref<Date>,
  filteredTasks: Ref<any[]>,
  barScale: Ref<'week' | 'month'>,
  dayBarDate: Ref<Date | string>,
  weekDays: string[],
  SLOT_HEIGHT: number,
) {
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

  const barDays = computed(() =>
    barScale.value === 'week' ? weekDaysData.value : calendarDays.value,
  )

  const barHeaderStyle = computed(() => ({
    gridTemplateColumns: `repeat(${barDays.value.length}, 1fr)`,
  }))

  const barRowStyle = computed(() => ({
    gridTemplateColumns: `repeat(${barDays.value.length}, 1fr)`,
  }))

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

  const dayBarDateText = computed(() => {
    const d = dayBarDate.value instanceof Date ? dayBarDate.value : new Date(dayBarDate.value)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
  })

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

  const timeTicks = computed(() => {
    const ticks = []
    for (let i = 0; i < 48; i++) {
      ticks.push({ top: i * SLOT_HEIGHT, isHour: i % 2 === 0 })
    }
    return ticks
  })

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

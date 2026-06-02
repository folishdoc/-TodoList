import { describe, it, expect } from 'vitest'
import { formatLocalDateTime, formatLocalDate } from './date'

describe('utils/date.ts', () => {
  it('formatLocalDateTime: pads single-digit fields', () => {
    const d = new Date(2026, 0, 5, 9, 7, 3)
    expect(formatLocalDateTime(d)).toBe('2026-01-05T09:07:03')
  })

  it('formatLocalDateTime: handles 2-digit fields', () => {
    const d = new Date(2026, 11, 31, 23, 59, 59)
    expect(formatLocalDateTime(d)).toBe('2026-12-31T23:59:59')
  })

  it('formatLocalDateTime: uses local time, not UTC', () => {
    // 2026-06-15 10:00:00 in local time (any TZ)
    const d = new Date(2026, 5, 15, 10, 0, 0)
    const formatted = formatLocalDateTime(d)
    expect(formatted).toBe('2026-06-15T10:00:00')
    expect(formatted).not.toContain('Z')
  })

  it('formatLocalDate: returns YYYY-MM-DD', () => {
    const d = new Date(2026, 0, 5)
    expect(formatLocalDate(d)).toBe('2026-01-05')
  })

  it('formatLocalDate: pads month and day', () => {
    const d = new Date(2026, 8, 9)
    expect(formatLocalDate(d)).toBe('2026-09-09')
  })
})

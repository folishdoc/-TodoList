import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isOverdue, formatDate, formatDateShort, hasTimeValue } from './useDateUtils'

describe('composables/useDateUtils.ts', () => {
  describe('isOverdue', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0)) // 2026-06-15 12:00 local
    })
    afterEach(() => vi.useRealTimers())

    it('returns false for completed task (status=1)', () => {
      expect(isOverdue({ status: 1, dueDate: '2026-06-10' })).toBe(false)
    })

    it('returns false when no dueDate', () => {
      expect(isOverdue({ status: 0, dueDate: null })).toBe(false)
      expect(isOverdue({ status: 0, dueDate: '' })).toBe(false)
    })

    it('returns true for past due date', () => {
      expect(isOverdue({ status: 0, dueDate: '2026-06-10' })).toBe(true)
    })

    it('returns true for today (date-only, <= today)', () => {
      expect(isOverdue({ status: 0, dueDate: '2026-06-15' })).toBe(true)
    })

    it('returns false for future date', () => {
      expect(isOverdue({ status: 0, dueDate: '2026-06-20' })).toBe(false)
    })
  })

  describe('formatDate', () => {
    it('returns empty string for falsy input', () => {
      expect(formatDate('')).toBe('')
      expect(formatDate(null as any)).toBe('')
      expect(formatDate(undefined as any)).toBe('')
    })

    it('formats valid date as MM/DD (local time)', () => {
      // Use Date constructor (local) to avoid TZ parsing issues
      const d = new Date(2026, 5, 5)
      expect(formatDate(d.toString())).toBe('06/05')
    })

    it('pads single-digit month/day', () => {
      const d = new Date(2026, 0, 5)
      expect(formatDate(d.toString())).toBe('01/05')
    })
  })

  describe('formatDateShort', () => {
    it('returns empty string for falsy input', () => {
      expect(formatDateShort('')).toBe('')
    })

    it('formats date-only as MM/DD', () => {
      const d = new Date(2026, 5, 5)
      expect(formatDateShort(d.toString())).toBe('06/05')
    })

    it('formats datetime as MM/DD HH:mm', () => {
      const d = new Date(2026, 5, 5, 14, 30)
      expect(formatDateShort(d.toString())).toBe('06/05 14:30')
    })
  })

  describe('hasTimeValue', () => {
    it('returns false for empty input', () => {
      expect(hasTimeValue('')).toBe(false)
    })

    it('returns false for date-only', () => {
      const d = new Date(2026, 5, 5)
      expect(hasTimeValue(d.toString())).toBe(false)
    })

    it('returns true for datetime with hour > 0', () => {
      const d = new Date(2026, 5, 5, 14, 30)
      expect(hasTimeValue(d.toString())).toBe(true)
    })

    it('returns true for datetime with seconds', () => {
      const d = new Date(2026, 5, 5, 0, 0, 1)
      expect(hasTimeValue(d.toString())).toBe(true)
    })
  })
})

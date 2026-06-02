import { describe, it, expect } from 'vitest'
import { getRepeatLabel, getRepeatTypeText } from './useRepeatRule'

describe('composables/useRepeatRule.ts', () => {
  describe('getRepeatTypeText', () => {
    it('returns Chinese unit for known types', () => {
      expect(getRepeatTypeText('DAILY')).toBe('天')
      expect(getRepeatTypeText('WEEKLY')).toBe('周')
      expect(getRepeatTypeText('MONTHLY')).toBe('月')
      expect(getRepeatTypeText('YEARLY')).toBe('年')
    })

    it('returns empty for unknown', () => {
      expect(getRepeatTypeText('FOO')).toBe('')
    })
  })

  describe('getRepeatLabel', () => {
    it('returns "循环" for invalid JSON', () => {
      expect(getRepeatLabel('not-json')).toBe('循环')
    })

    it('shows DAILY with interval=1', () => {
      expect(getRepeatLabel('{"type":"DAILY","interval":1}')).toBe('每天')
    })

    it('shows "每3天" for DAILY with interval=3', () => {
      expect(getRepeatLabel('{"type":"DAILY","interval":3}')).toBe('每3天')
    })

    it('shows "每2周" for WEEKLY with interval=2', () => {
      expect(getRepeatLabel('{"type":"WEEKLY","interval":2}')).toBe('每2周')
    })

    it('appends task dueDate when task has date', () => {
      const label = getRepeatLabel('{"type":"DAILY","interval":1}', { dueDate: '2026-06-05' })
      expect(label).toContain('06/05')
    })

    it('appends datetime when task has time', () => {
      const label = getRepeatLabel('{"type":"DAILY","interval":1}', { dueDate: '2026-06-05T14:30:00' })
      expect(label).toContain('06/05 14:30')
    })

    it('appends endDate in parens', () => {
      const label = getRepeatLabel('{"type":"DAILY","interval":1,"endDate":"2026-12-31"}')
      expect(label).toContain('（至2026-12-31）')
    })

    it('returns the type itself for unknown repeat type', () => {
      expect(getRepeatLabel('{"type":"FOO","interval":1}')).toBe('FOO')
    })
  })
})

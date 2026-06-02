import { describe, it, expect } from 'vitest'
import { getPriorityType, getPriorityText, priorityClass } from './usePriority'

describe('composables/usePriority.ts', () => {
  describe('getPriorityType', () => {
    it('maps priorities to Element Plus types', () => {
      expect(getPriorityType(0)).toBe('')
      expect(getPriorityType(1)).toBe('info')
      expect(getPriorityType(2)).toBe('warning')
      expect(getPriorityType(3)).toBe('danger')
    })

    it('returns empty for unknown priority', () => {
      expect(getPriorityType(99)).toBe('')
    })
  })

  describe('getPriorityText', () => {
    it('returns Chinese text for priorities', () => {
      expect(getPriorityText(0)).toBe('无')
      expect(getPriorityText(1)).toBe('低')
      expect(getPriorityText(2)).toBe('中')
      expect(getPriorityText(3)).toBe('高')
    })

    it('returns "无" for unknown priority', () => {
      expect(getPriorityText(99)).toBe('无')
    })
  })

  describe('priorityClass', () => {
    it('returns pri-high for priority 3', () => {
      expect(priorityClass(3)).toBe('pri-high')
    })

    it('returns pri-low for priority 1', () => {
      expect(priorityClass(1)).toBe('pri-low')
    })

    it('returns empty for priority 0/2/others', () => {
      expect(priorityClass(0)).toBe('')
      expect(priorityClass(2)).toBe('')
      expect(priorityClass(99)).toBe('')
    })
  })
})

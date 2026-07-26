import { describe, it, expect, beforeEach } from 'vitest'
import { initTheme } from './theme'

describe('utils/theme.ts', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('initTheme: no saved theme keeps default (light)', () => {
    initTheme()
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false)
  })

  it('initTheme: applies dark from localStorage', () => {
    localStorage.setItem('theme', 'dark')
    initTheme()
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true)
  })

  it('initTheme: applies light from localStorage', () => {
    localStorage.setItem('theme', 'light')
    document.documentElement.classList.add('dark-theme')
    initTheme()
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false)
  })
})

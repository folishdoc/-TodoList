import { describe, it, expect, beforeEach } from 'vitest'
import { initTheme, toggleTheme, setTheme, getCurrentTheme } from './theme'

describe('utils/theme.ts', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('initTheme: no saved theme keeps default (light)', () => {
    initTheme()
    expect(getCurrentTheme()).toBe('light')
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false)
  })

  it('initTheme: applies dark from localStorage', () => {
    localStorage.setItem('theme', 'dark')
    initTheme()
    expect(getCurrentTheme()).toBe('dark')
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true)
  })

  it('initTheme: applies light from localStorage', () => {
    localStorage.setItem('theme', 'light')
    document.documentElement.classList.add('dark-theme')
    initTheme()
    expect(getCurrentTheme()).toBe('light')
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false)
  })

  it('toggleTheme: light -> dark', () => {
    initTheme()
    toggleTheme()
    expect(getCurrentTheme()).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true)
  })

  it('toggleTheme: dark -> light', () => {
    localStorage.setItem('theme', 'dark')
    initTheme()
    toggleTheme()
    expect(getCurrentTheme()).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false)
  })

  it('setTheme: explicit dark', () => {
    setTheme('dark')
    expect(getCurrentTheme()).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true)
  })

  it('setTheme: explicit light', () => {
    setTheme('dark')
    setTheme('light')
    expect(getCurrentTheme()).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })
})

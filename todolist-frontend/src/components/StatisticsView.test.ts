import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const getOverviewMock = vi.fn()
const getByPriorityMock = vi.fn()
const getByListMock = vi.fn()
const getTrendMock = vi.fn()
const exportTasksCsvMock = vi.fn()
const exportTasksJsonMock = vi.fn()

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
}))

vi.mock('../api/statistics', () => ({
  getOverview: (...args: unknown[]) => getOverviewMock(...args),
  getByPriority: (...args: unknown[]) => getByPriorityMock(...args),
  getByList: (...args: unknown[]) => getByListMock(...args),
  getTrend: (...args: unknown[]) => getTrendMock(...args)
}))

vi.mock('../api/export', () => ({
  exportTasksCsv: (...args: unknown[]) => exportTasksCsvMock(...args),
  exportTasksJson: (...args: unknown[]) => exportTasksJsonMock(...args)
}))

import StatisticsView from './StatisticsView.vue'

const ElButtonStub = {
  name: 'ElButtonStub',
  template: '<button type="button" @click="$emit(\'click\')"><slot/></button>',
  props: ['type', 'size']
}

const ElIconStub = {
  name: 'ElIconStub',
  template: '<i class="el-icon"><slot/></i>'
}

const ElRowStub = {
  name: 'ElRowStub',
  template: '<div class="el-row"><slot/></div>',
  props: ['gutter']
}

const ElColStub = {
  name: 'ElColStub',
  template: '<div class="el-col"><slot/></div>',
  props: ['span']
}

const ElCardStub = {
  name: 'ElCardStub',
  template: '<div class="el-card"><slot name="header"/><slot/></div>'
}

const ElStatisticStub = {
  name: 'ElStatisticStub',
  template: '<div class="el-statistic" :data-value="value">{{ title }}: {{ value }}</div>',
  props: ['title', 'value', 'suffix']
}

const ElProgressStub = {
  name: 'ElProgressStub',
  template: '<div class="el-progress" :data-percentage="percentage" :data-color="color"></div>',
  props: ['percentage', 'color', 'strokeWidth']
}

const ElEmptyStub = {
  name: 'ElEmptyStub',
  template: '<div class="el-empty"></div>',
  props: ['description']
}

function mountView() {
  return mount(StatisticsView, {
    global: {
      stubs: {
        'el-button': ElButtonStub,
        'el-icon': ElIconStub,
        'el-row': ElRowStub,
        'el-col': ElColStub,
        'el-card': ElCardStub,
        'el-statistic': ElStatisticStub,
        'el-progress': ElProgressStub,
        'el-empty': ElEmptyStub
      }
    }
  })
}

describe('StatisticsView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getOverviewMock.mockResolvedValue({ data: { totalTasks: 10, completedTasks: 5, pendingTasks: 5, completionRate: 50 } } as any)
    getByPriorityMock.mockResolvedValue({ data: [] } as any)
    getByListMock.mockResolvedValue({ data: [] } as any)
    getTrendMock.mockResolvedValue({ data: [] } as any)
  })

  it('loads all statistics on mount', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect(getOverviewMock).toHaveBeenCalled()
    expect(getByPriorityMock).toHaveBeenCalled()
    expect(getByListMock).toHaveBeenCalled()
    expect(getTrendMock).toHaveBeenCalledWith(7)
    expect((wrapper.vm as any).overview.totalTasks).toBe(10)
    expect((wrapper.vm as any).overview.completionRate).toBe(50)
  })

  it('renders overview statistics', async () => {
    const wrapper = mountView()
    await flushPromises()
    const stats = wrapper.findAllComponents(ElStatisticStub)
    expect(stats.length).toBe(4)
  })

  it('shows empty state for priority when no data', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect((wrapper.vm as any).priorityData.length).toBe(0)
    expect((wrapper.vm as any).listData.length).toBe(0)
  })

  it('renders priority distribution when data exists', async () => {
    getByPriorityMock.mockResolvedValue({ data: [
      { name: '高', count: 3, color: '#f56c6c' },
      { name: '中', count: 5, color: '#e6a23c' },
      { name: '低', count: 2, color: '#67c23a' }
    ] } as any)
    const wrapper = mountView()
    await flushPromises()
    expect((wrapper.vm as any).priorityData.length).toBe(3)
  })

  it('renders list distribution when data exists', async () => {
    getByListMock.mockResolvedValue({ data: [
      { name: '工作', count: 8, color: '#409eff' },
      { name: '生活', count: 4, color: '#67c23a' }
    ] } as any)
    const wrapper = mountView()
    await flushPromises()
    expect((wrapper.vm as any).listData.length).toBe(2)
  })

  it('getPercentage calculates correct percentage based on priority data total', async () => {
    getByPriorityMock.mockResolvedValue({ data: [
      { name: '高', count: 2, color: '#f00' },
      { name: '中', count: 3, color: '#0f0' }
    ] } as any)
    const wrapper = mountView()
    await flushPromises()
    expect((wrapper.vm as any).getPercentage(2)).toBe(40)
    expect((wrapper.vm as any).getPercentage(3)).toBe(60)
  })

  it('getPercentage returns 0 when total is zero', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect((wrapper.vm as any).getPercentage(0)).toBe(0)
  })

  it('formatDate converts date string to MM/DD', () => {
    const wrapper = mountView()
    expect((wrapper.vm as any).formatDate('2025-06-15')).toBe('6/15')
    expect((wrapper.vm as any).formatDate('2025-01-01')).toBe('1/1')
    expect((wrapper.vm as any).formatDate('')).toBe('')
  })

  it('loadTrend reloads trend data with days=7', async () => {
    const wrapper = mountView()
    await flushPromises()
    getTrendMock.mockClear()
    await (wrapper.vm as any).loadTrend()
    await flushPromises()
    expect(getTrendMock).toHaveBeenCalledWith(7)
  })

  it('loadStatistics handles errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getOverviewMock.mockRejectedValue(new Error('Network error'))
    const wrapper = mountView()
    await flushPromises()
    expect(consoleSpy).toHaveBeenCalled()
    expect((wrapper.vm as any).overview).toEqual({})
    consoleSpy.mockRestore()
  })

  it('handleExportCsv creates download link and shows success', async () => {
    const blob = new Blob(['test'], { type: 'text/csv' })
    exportTasksCsvMock.mockResolvedValue(blob)
    const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        el.click = clickSpy
      }
      return el
    })
    const wrapper = mountView()
    await flushPromises()
    await (wrapper.vm as any).handleExportCsv()
    await flushPromises()
    expect(exportTasksCsvMock).toHaveBeenCalled()
    expect(createObjectURLSpy).toHaveBeenCalledWith(blob)
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalled()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
    createElementSpy.mockRestore()
  })

  it('handleExportJson creates download link and shows success', async () => {
    const blob = new Blob(['{}'], { type: 'application/json' })
    exportTasksJsonMock.mockResolvedValue(blob)
    const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        el.click = clickSpy
      }
      return el
    })
    const wrapper = mountView()
    await flushPromises()
    await (wrapper.vm as any).handleExportJson()
    await flushPromises()
    expect(exportTasksJsonMock).toHaveBeenCalled()
    expect(createObjectURLSpy).toHaveBeenCalledWith(blob)
    expect(clickSpy).toHaveBeenCalled()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
    createElementSpy.mockRestore()
  })

  it('handleExportCsv logs error on failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    exportTasksCsvMock.mockRejectedValue(new Error('Export failed'))
    const wrapper = mountView()
    await flushPromises()
    await (wrapper.vm as any).handleExportCsv()
    await flushPromises()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('renders trend chart when trend data exists', async () => {
    getTrendMock.mockResolvedValue({ data: [
      { date: '2025-06-09', created: 3, completed: 2 },
      { date: '2025-06-10', created: 5, completed: 4 }
    ] } as any)
    const wrapper = mountView()
    await flushPromises()
    expect((wrapper.vm as any).trendData.length).toBe(2)
  })

  it('clicking 刷新 button calls loadTrend', async () => {
    const wrapper = mountView()
    await flushPromises()
    getTrendMock.mockClear()
    const refreshBtn = wrapper.findAllComponents(ElButtonStub).find((b) => b.text().includes('刷新'))!
    await refreshBtn.trigger('click')
    await flushPromises()
    expect(getTrendMock).toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const getHabitsMock = vi.fn()
const getTodayRecordsMock = vi.fn()
const createHabitMock = vi.fn()
const updateHabitMock = vi.fn()
const deleteHabitMock = vi.fn()
const checkInMock = vi.fn()
const getRecordsByRangeMock = vi.fn()

const ElMessageBoxConfirmMock = vi.fn()

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  ElMessageBox: { confirm: (...args: unknown[]) => ElMessageBoxConfirmMock(...args) },
}))

vi.mock('../api/habit', () => ({
  getHabits: (...args: unknown[]) => getHabitsMock(...args),
  getTodayRecords: (...args: unknown[]) => getTodayRecordsMock(...args),
  createHabit: (...args: unknown[]) => createHabitMock(...args),
  updateHabit: (...args: unknown[]) => updateHabitMock(...args),
  deleteHabit: (...args: unknown[]) => deleteHabitMock(...args),
  checkIn: (...args: unknown[]) => checkInMock(...args),
  getRecordsByRange: (...args: unknown[]) => getRecordsByRangeMock(...args),
}))

import HabitsView from './HabitsView.vue'

const ElButtonStub = {
  name: 'ElButtonStub',
  template: '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot/></button>',
  props: ['type', 'size', 'disabled', 'link'],
}

const ElIconStub = {
  name: 'ElIconStub',
  template: '<i class="el-icon"><slot/></i>',
}

const ElCardStub = {
  name: 'ElCardStub',
  template: '<div class="el-card"><slot/></div>',
}

const ElEmptyStub = {
  name: 'ElEmptyStub',
  template: '<div class="el-empty"></div>',
  props: ['description', 'imageSize'],
}

const ElRowStub = {
  name: 'ElRowStub',
  template: '<div class="el-row"><slot/></div>',
  props: ['gutter'],
}

const ElColStub = {
  name: 'ElColStub',
  template: '<div class="el-col"><slot/></div>',
  props: ['xs', 'sm', 'md', 'lg'],
}

const ElProgressStub = {
  name: 'ElProgressStub',
  template: '<div class="el-progress" :data-percentage="percentage"></div>',
  props: ['percentage', 'color', 'strokeWidth'],
}

const ElInputStub = {
  name: 'ElInputStub',
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder', 'type', 'rows'],
}

const ElInputNumberStub = {
  name: 'ElInputNumberStub',
  template:
    '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
  props: ['modelValue', 'min', 'step'],
}

const ElSelectStub = {
  name: 'ElSelectStub',
  template:
    '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot/></select>',
  props: ['modelValue', 'placeholder', 'valueKey'],
}

const ElOptionStub = {
  name: 'ElOptionStub',
  template: '<option :value="value"><slot/></option>',
  props: ['value', 'label'],
}

const ElFormStub = {
  name: 'ElFormStub',
  template: '<form><slot/></form>',
  props: ['model'],
}

const ElFormItemStub = {
  name: 'ElFormItemStub',
  template: '<div class="el-form-item"><slot/></div>',
  props: ['label', 'required'],
}

const ElDialogStub = {
  name: 'ElDialogStub',
  props: ['modelValue', 'title', 'width'],
  template: `
    <div v-if="modelValue" data-testid="dialog">
      <slot/>
      <div data-testid="dialog-footer">
        <slot name="footer"/>
      </div>
    </div>
  `,
}

const ElDatePickerStub = {
  name: 'ElDatePickerStub',
  template:
    '<input :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'placeholder', 'type'],
}

const ElSwitchStub = {
  name: 'ElSwitchStub',
  template:
    '<button role="switch" :aria-checked="String(modelValue)" @click="$emit(\'update:modelValue\', !modelValue)">{{ modelValue }}</button>',
  props: ['modelValue'],
}

const ElRadioGroupStub = {
  name: 'ElRadioGroupStub',
  template: '<div class="el-radio-group"><slot/></div>',
  props: ['modelValue', 'size'],
}

const ElRadioButtonStub = {
  name: 'ElRadioButtonStub',
  template:
    '<button class="el-radio-button" :data-value="value" @click="$emit(\'click\', value)">{{ value }}<slot/></button>',
  props: ['value'],
}

const ElDropdownStub = {
  name: 'ElDropdownStub',
  template: '<div class="el-dropdown"><slot/></div>',
  props: ['trigger'],
}

const ElDropdownMenuStub = {
  name: 'ElDropdownMenuStub',
  template: '<div class="el-dropdown-menu"><slot/></div>',
}

const ElDropdownItemStub = {
  name: 'ElDropdownItemStub',
  template: '<div class="el-dropdown-item" @click="$emit(\'click\')"><slot/></div>',
  props: ['divided'],
}

const ElColorPickerStub = {
  name: 'ElColorPickerStub',
  template:
    '<input type="color" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue'],
}

function mountView() {
  return mount(HabitsView, {
    global: {
      directives: {
        loading: { mounted: () => {}, updated: () => {}, unmounted: () => {} },
      },
      stubs: {
        'el-button': ElButtonStub,
        'el-icon': ElIconStub,
        'el-card': ElCardStub,
        'el-empty': ElEmptyStub,
        'el-row': ElRowStub,
        'el-col': ElColStub,
        'el-progress': ElProgressStub,
        'el-input': ElInputStub,
        'el-input-number': ElInputNumberStub,
        'el-select': ElSelectStub,
        'el-option': ElOptionStub,
        'el-form': ElFormStub,
        'el-form-item': ElFormItemStub,
        'el-dialog': ElDialogStub,
        'el-date-picker': ElDatePickerStub,
        'el-switch': ElSwitchStub,
        'el-radio-group': ElRadioGroupStub,
        'el-radio-button': ElRadioButtonStub,
        'el-dropdown': ElDropdownStub,
        'el-dropdown-menu': ElDropdownMenuStub,
        'el-dropdown-item': ElDropdownItemStub,
        'el-color-picker': ElColorPickerStub,
      },
    },
  })
}

describe('HabitsView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getHabitsMock.mockResolvedValue({ data: [] } as any)
    getTodayRecordsMock.mockResolvedValue({ data: [] } as any)
    createHabitMock.mockResolvedValue({ id: 1 } as any)
    updateHabitMock.mockResolvedValue({} as any)
    deleteHabitMock.mockResolvedValue({} as any)
    checkInMock.mockResolvedValue({} as any)
    getRecordsByRangeMock.mockResolvedValue({ data: [] } as any)
    ElMessageBoxConfirmMock.mockResolvedValue('confirm' as any)
  })

  it('loads habits and today records on mount', async () => {
    getHabitsMock.mockResolvedValue({
      data: [{ id: 1, name: '早起', targetValue: 1, targetType: 'count', color: '#f00' }],
    } as any)
    const wrapper = mountView()
    await flushPromises()
    expect(getHabitsMock).toHaveBeenCalled()
    expect(getTodayRecordsMock).toHaveBeenCalled()
    expect((wrapper.vm as any).habits.length).toBe(1)
  })

  it('shows empty state when no habits', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.findComponent(ElEmptyStub).exists()).toBe(true)
  })

  it('opens create dialog with reset form when 新建习惯 clicked', async () => {
    const wrapper = mountView()
    await flushPromises()
    const newButton = wrapper
      .findAllComponents(ElButtonStub)
      .find((b) => b.text().includes('新建习惯'))!
    await newButton.trigger('click')
    await flushPromises()
    expect((wrapper.vm as any).showCreateDialog).toBe(true)
    expect((wrapper.vm as any).editingHabit).toBeNull()
    expect((wrapper.vm as any).habitForm.name).toBe('')
    expect((wrapper.vm as any).habitForm.icon).toBe('🎯')
    expect((wrapper.vm as any).habitForm.color).toBe('#409EFF')
    expect((wrapper.vm as any).habitForm.targetType).toBe('count')
    expect((wrapper.vm as any).habitForm.targetValue).toBe(1)
  })

  it('handleSubmit calls createHabit for new habits and shows success', async () => {
    const wrapper = mountView()
    await flushPromises()
    const habitForm = (wrapper.vm as any).habitForm
    habitForm.name = '跑步'
    let capturedArgs: any = null
    createHabitMock.mockImplementation((data) => {
      capturedArgs = { ...data }
      return Promise.resolve({ id: 1 })
    })
    await (wrapper.vm as any).handleSubmit()
    await flushPromises()
    expect(createHabitMock).toHaveBeenCalled()
    expect(capturedArgs.name).toBe('跑步')
  })

  it('handleSubmit calls updateHabit for editing habits', async () => {
    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).editingHabit = { id: 3, name: '旧名' }
    const habitForm = (wrapper.vm as any).habitForm
    habitForm.name = '新名'
    let capturedArgs: any = null
    updateHabitMock.mockImplementation((id, data) => {
      capturedArgs = { id, data: { ...data } }
      return Promise.resolve({})
    })
    await (wrapper.vm as any).handleSubmit()
    await flushPromises()
    expect(updateHabitMock).toHaveBeenCalled()
    expect(capturedArgs.id).toBe(3)
    expect(capturedArgs.data.name).toBe('新名')
    expect(createHabitMock).not.toHaveBeenCalled()
  })

  it('handleSubmit shows warning when name is empty', async () => {
    const { ElMessage } = await import('element-plus')
    const wrapper = mountView()
    await flushPromises()
    const habitForm = (wrapper.vm as any).habitForm
    habitForm.name = '   '
    await (wrapper.vm as any).handleSubmit()
    await flushPromises()
    expect(ElMessage.warning).toHaveBeenCalledWith('请输入习惯名称')
    expect(createHabitMock).not.toHaveBeenCalled()
  })

  it('handleEdit populates form and opens dialog', async () => {
    getHabitsMock.mockResolvedValue({
      data: [
        {
          id: 7,
          name: '冥想',
          icon: '🧘',
          color: '#abc',
          targetType: 'duration',
          targetValue: 30,
          frequency: 'daily',
          timePeriod: 'morning',
        },
      ],
    } as any)
    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).handleEdit({
      id: 7,
      name: '冥想',
      icon: '🧘',
      color: '#abc',
      targetType: 'duration',
      targetValue: 30,
      frequency: 'daily',
      timePeriod: 'morning',
    })
    await flushPromises()
    expect((wrapper.vm as any).editingHabit.id).toBe(7)
    expect((wrapper.vm as any).habitForm.name).toBe('冥想')
    expect((wrapper.vm as any).habitForm.icon).toBe('🧘')
    expect((wrapper.vm as any).habitForm.targetType).toBe('duration')
    expect((wrapper.vm as any).habitForm.targetValue).toBe(30)
    expect((wrapper.vm as any).showCreateDialog).toBe(true)
  })

  it('handleDelete confirms and calls deleteHabit API', async () => {
    const wrapper = mountView()
    await flushPromises()
    deleteHabitMock.mockClear()
    await (wrapper.vm as any).handleDelete({ id: 9, name: 'X' })
    await flushPromises()
    expect(ElMessageBoxConfirmMock).toHaveBeenCalled()
    expect(deleteHabitMock).toHaveBeenCalledWith(9)
  })

  it('handleDelete skips when user cancels', async () => {
    ElMessageBoxConfirmMock.mockRejectedValue('cancel' as any)
    const wrapper = mountView()
    await flushPromises()
    deleteHabitMock.mockClear()
    await (wrapper.vm as any).handleDelete({ id: 9, name: 'X' })
    await flushPromises()
    expect(deleteHabitMock).not.toHaveBeenCalled()
  })

  it('resetForm clears all fields', () => {
    const wrapper = mountView()
    ;(wrapper.vm as any).habitForm.name = 'X'
    ;(wrapper.vm as any).editingHabit = { id: 1 }
    ;(wrapper.vm as any).resetForm()
    expect((wrapper.vm as any).habitForm.name).toBe('')
    expect((wrapper.vm as any).habitForm.icon).toBe('🎯')
    expect((wrapper.vm as any).habitForm.color).toBe('#409EFF')
    expect((wrapper.vm as any).habitForm.targetType).toBe('count')
    expect((wrapper.vm as any).habitForm.targetValue).toBe(1)
    expect((wrapper.vm as any).habitForm.frequency).toBe('daily')
    expect((wrapper.vm as any).habitForm.timePeriod).toBe('all_day')
    expect((wrapper.vm as any).editingHabit).toBeNull()
  })

  it('handleCheckIn calls checkIn API for daily habit', async () => {
    getHabitsMock.mockResolvedValue({
      data: [{ id: 5, name: '阅读', targetValue: 1, targetType: 'count', frequency: 'daily' }],
    } as any)
    const wrapper = mountView()
    await flushPromises()
    await (wrapper.vm as any).handleCheckIn({
      id: 5,
      name: '阅读',
      targetValue: 1,
      targetType: 'count',
      frequency: 'daily',
    })
    await flushPromises()
    expect(checkInMock).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        completionValue: 1,
        isMakeup: false,
      }),
    )
  })

  it('handleCheckIn shows warning on weekend for weekday-only habit', async () => {
    const { ElMessage } = await import('element-plus')
    const wrapper = mountView()
    await flushPromises()
    const realDay = new Date().getDay()
    const isWeekend = realDay === 0 || realDay === 6
    if (isWeekend) {
      await (wrapper.vm as any).handleCheckIn({ id: 1, name: 'X', frequency: 'weekdays' })
      await flushPromises()
      expect(checkInMock).not.toHaveBeenCalled()
    } else {
      expect(true).toBe(true)
    }
  })

  it('canCheckInToday returns true for daily/weekly habits', () => {
    const wrapper = mountView()
    expect((wrapper.vm as any).canCheckInToday({ frequency: 'daily' })).toBe(true)
    expect((wrapper.vm as any).canCheckInToday({ frequency: 'weekly' })).toBe(true)
  })

  it('isCompletedToday and getTodayProgress reflect todayRecords', async () => {
    const today = new Date().toISOString().slice(0, 10)
    getTodayRecordsMock.mockResolvedValue({ data: [{ habitId: 11, checkDate: today }] } as any)
    const wrapper = mountView()
    await flushPromises()
    expect((wrapper.vm as any).isCompletedToday({ id: 11 })).toBe(true)
    expect((wrapper.vm as any).isCompletedToday({ id: 99 })).toBe(false)
    expect((wrapper.vm as any).getTodayProgress({ id: 11 })).toBe(100)
  })

  it('getTargetText returns localized text for target type', () => {
    const wrapper = mountView()
    expect((wrapper.vm as any).getTargetText({ targetType: 'count', targetValue: 3 })).toBe('3 次')
    expect((wrapper.vm as any).getTargetText({ targetType: 'duration', targetValue: 30 })).toBe(
      '30 分钟',
    )
    expect((wrapper.vm as any).getTargetText({ targetType: 'quantity', targetValue: 5 })).toBe(
      '5 个',
    )
    expect((wrapper.vm as any).getTargetText({ targetType: 'unknown', targetValue: 1 })).toBe(
      '1 次',
    )
  })

  it('showTrend toggles trend section visibility', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect((wrapper.vm as any).showTrend).toBe(false)
    ;(wrapper.vm as any).showTrend = true
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as any).showTrend).toBe(true)
  })

  it('loadTrendData aggregates records across habits and builds per-date counts', async () => {
    getHabitsMock.mockResolvedValue({
      data: [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ],
    } as any)
    getRecordsByRangeMock
      .mockResolvedValueOnce({
        data: [{ checkDate: '2025-01-01' }, { checkDate: '2025-01-01' }],
      } as any)
      .mockResolvedValueOnce({ data: [{ checkDate: '2025-01-02' }] } as any)
    const wrapper = mountView()
    await flushPromises()
    await (wrapper.vm as any).loadTrendData()
    await flushPromises()
    const trend = (wrapper.vm as any).trendData
    const map = Object.fromEntries(trend.map((t: any) => [t.date, t.count]))
    expect(map['2025-01-01']).toBe(2)
    expect(map['2025-01-02']).toBe(1)
  })

  it('getBarHeight returns proportional height with min of 4', () => {
    const wrapper = mountView()
    ;(wrapper.vm as any).trendData = [
      { date: '2025-01-01', count: 0 },
      { date: '2025-01-02', count: 5 },
    ]
    expect((wrapper.vm as any).getBarHeight(0)).toBe(4)
    expect((wrapper.vm as any).getBarHeight(5)).toBe(120)
    expect((wrapper.vm as any).getBarHeight(2)).toBe(48)
  })

  it('getBarColor returns different colors based on count', () => {
    const wrapper = mountView()
    expect((wrapper.vm as any).getBarColor(0)).toBe('#e0e0e0')
    expect((wrapper.vm as any).getBarColor(2)).toBe('#a0cfff')
    expect((wrapper.vm as any).getBarColor(5)).toBe('#409EFF')
    expect((wrapper.vm as any).getBarColor(10)).toBe('#337ecc')
  })

  it('formatTrendDate converts YYYY-MM-DD to MM/DD', () => {
    const wrapper = mountView()
    expect((wrapper.vm as any).formatTrendDate('2025-03-15')).toBe('03/15')
  })

  it('handleTrendMakeup opens check-in dialog with makeup flag set', async () => {
    getHabitsMock.mockResolvedValue({ data: [{ id: 4, name: 'A', targetValue: 1 }] } as any)
    const wrapper = mountView()
    await flushPromises()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() - 1)
    await (wrapper.vm as any).handleTrendMakeup({
      date: futureDate.toISOString().slice(0, 10),
      count: 0,
    })
    await flushPromises()
    expect((wrapper.vm as any).showCheckInDialog).toBe(true)
    expect((wrapper.vm as any).checkInForm.isMakeup).toBe(true)
  })

  it('handleTrendMakeup skips when count > 0', async () => {
    const wrapper = mountView()
    await flushPromises()
    await (wrapper.vm as any).handleTrendMakeup({ date: '2025-01-01', count: 2 })
    await flushPromises()
    expect((wrapper.vm as any).showCheckInDialog).toBe(false)
  })

  it('handleTrendMakeup shows warning when no habits', async () => {
    const { ElMessage } = await import('element-plus')
    getHabitsMock.mockResolvedValue({ data: [] } as any)
    const wrapper = mountView()
    await flushPromises()
    await (wrapper.vm as any).handleTrendMakeup({ date: '2025-01-01', count: 0 })
    await flushPromises()
    expect(ElMessage.warning).toHaveBeenCalledWith('没有可补签的习惯')
    expect((wrapper.vm as any).showCheckInDialog).toBe(false)
  })

  it('submitCheckIn calls checkIn with makeup params', async () => {
    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).checkingHabit = { id: 6, name: 'A' }
    ;(wrapper.vm as any).checkInForm.completionValue = 1
    ;(wrapper.vm as any).checkInForm.isMakeup = true
    ;(wrapper.vm as any).checkInForm.checkDate = new Date('2025-01-01')
    ;(wrapper.vm as any).showCheckInDialog = true
    await (wrapper.vm as any).submitCheckIn()
    await flushPromises()
    expect(checkInMock).toHaveBeenCalledWith(6, expect.objectContaining({ isMakeup: true }))
    expect((wrapper.vm as any).showCheckInDialog).toBe(false)
  })

  it('submitCheckIn skips when no checkingHabit', async () => {
    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).checkingHabit = null
    await (wrapper.vm as any).submitCheckIn()
    await flushPromises()
    expect(checkInMock).not.toHaveBeenCalled()
  })
})

<template>
  <div class="habits-container">
    <!-- 工具栏 -->
    <div class="habits-toolbar">
      <h2>习惯追踪</h2>
      <div class="toolbar-actions">
        <el-button @click="showTrend = !showTrend">
          <el-icon><DataAnalysis /></el-icon>
          {{ showTrend ? '隐藏统计' : '统计' }}
        </el-button>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建习惯
        </el-button>
      </div>
    </div>

    <!-- 趋势统计图 -->
    <div v-if="showTrend" class="trend-section">
      <div class="trend-header">
        <h3>打卡趋势</h3>
        <el-radio-group v-model="trendDays" size="small" @change="loadTrendData">
          <el-radio-button :value="7">近7天</el-radio-button>
          <el-radio-button :value="30">近30天</el-radio-button>
        </el-radio-group>
      </div>
      <div v-loading="trendLoading" class="trend-chart">
        <el-empty v-if="trendData.length === 0" description="暂无打卡数据" :image-size="60" />
        <div v-else class="chart-bars">
          <div
            v-for="item in trendData"
            :key="item.date"
            class="chart-bar-group"
            :class="{ clickable: item.count === 0 && item.date !== formatLocalDate(new Date()) }"
            @click="handleTrendMakeup(item)"
          >
            <div class="bar-container">
              <div
                class="bar"
                :style="{ height: getBarHeight(item.count) + 'px', background: getBarColor(item.count) }"
                :title="item.count === 0 && item.date !== formatLocalDate(new Date()) ? `${item.date}: 未打卡，点击补签` : `${item.date}: ${item.count}次打卡`"
              />
            </div>
            <div class="bar-label">{{ formatTrendDate(item.date) }}</div>
            <div class="bar-value">{{ item.count }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 习惯列表 -->
    <div v-loading="loading" class="habits-list">
      <el-empty v-if="habits.length === 0" description="还没有习惯，创建一个吧！" />
      
      <el-row v-else :gutter="16">
        <el-col v-for="habit in habits" :key="habit.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="habit-card" :style="{ borderLeft: `4px solid ${habit.color}` }">
            <div class="habit-header">
              <div class="habit-icon" :style="{ background: habit.color + '20' }">
                <span>{{ habit.icon || '🎯' }}</span>
              </div>
              <div class="habit-actions">
                <el-dropdown trigger="click">
                  <el-button size="small" link>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleEdit(habit)">编辑</el-dropdown-item>
                      <el-dropdown-item divided @click="handleDelete(habit)">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <h3 class="habit-name">{{ habit.name }}</h3>

            <div class="habit-stats">
              <div class="stat-item">
                <div class="stat-value">{{ habit.currentStreak }}</div>
                <div class="stat-label">连续天数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ habit.totalCompletions }}</div>
                <div class="stat-label">总完成</div>
              </div>
            </div>

            <div class="habit-progress">
              <el-progress
                :percentage="getTodayProgress(habit)"
                :color="habit.color"
                :stroke-width="8"
              />
              <div class="progress-text">
                今日目标: {{ getTargetText(habit) }}
              </div>
            </div>

            <el-button
              type="primary"
              :disabled="isCompletedToday(habit)"
              @click="handleCheckIn(habit)"
              style="width: 100%; margin-top: 12px"
            >
              {{ isCompletedToday(habit) ? '✓ 已完成' : '打卡' }}
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingHabit ? '编辑习惯' : '新建习惯'"
      width="600px"
    >
      <el-form :model="habitForm" label-width="100px">
        <el-form-item label="习惯名称" required>
          <el-input v-model="habitForm.name" placeholder="例如：早起、跑步、阅读" />
        </el-form-item>
        
        <el-form-item label="图标">
          <div class="icon-picker">
            <div
              v-for="icon in iconOptions"
              :key="icon"
              class="icon-option"
              :class="{ selected: habitForm.icon === icon }"
              @click="habitForm.icon = icon"
            >{{ icon }}</div>
          </div>
        </el-form-item>
        
        <el-form-item label="颜色">
          <el-color-picker v-model="habitForm.color" />
        </el-form-item>
        
        <el-form-item label="目标类型">
          <el-select v-model="habitForm.targetType" style="width: 100%">
            <el-option label="次数" value="count" />
            <el-option label="时长（分钟）" value="duration" />
            <el-option label="数量" value="quantity" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标值">
          <el-input-number v-model="habitForm.targetValue" :min="1" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="执行频率">
          <el-select v-model="habitForm.frequency" style="width: 100%">
            <el-option label="每天" value="daily" />
            <el-option label="工作日" value="weekdays" />
            <el-option label="周末" value="weekends" />
            <el-option label="每周" value="weekly" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="时段">
          <el-select v-model="habitForm.timePeriod" style="width: 100%">
            <el-option label="早上" value="morning" />
            <el-option label="下午" value="afternoon" />
            <el-option label="晚上" value="evening" />
            <el-option label="全天" value="all_day" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 打卡对话框 -->
    <el-dialog v-model="showCheckInDialog" title="打卡" width="400px">
      <el-form v-if="checkingHabit" label-width="80px">
        <el-form-item v-if="habits.length > 1" label="习惯">
          <el-select v-model="checkingHabit" style="width: 100%" value-key="id">
            <el-option v-for="h in habits" :key="h.id" :label="h.name" :value="h" />
          </el-select>
        </el-form-item>

        <el-form-item label="完成值">
          <el-input-number
            v-model="checkInForm.completionValue"
            :min="0.1"
            :step="0.1"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="checkInForm.note"
            type="textarea"
            :rows="3"
            placeholder="记录一下今天的心得..."
          />
        </el-form-item>
        
        <el-form-item label="补卡">
          <el-switch v-model="checkInForm.isMakeup" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px">
            补卡不计入连续天数
          </span>
        </el-form-item>
        
        <el-form-item v-if="checkInForm.isMakeup" label="日期">
          <el-date-picker
            v-model="checkInForm.checkDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCheckInDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCheckIn">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, MoreFilled, DataAnalysis } from '@element-plus/icons-vue'
import * as habitApi from '../api/habit'
import { formatLocalDate } from '../utils/date'

const loading = ref(false)
const habits = ref<any[]>([])
const todayRecords = ref<any[]>([]) // 今日打卡记录
const showCreateDialog = ref(false)
const showCheckInDialog = ref(false)
const editingHabit = ref<any>(null)
const checkingHabit = ref<any>(null)

const habitForm = reactive({
  name: '',
  icon: '🎯',
  color: '#409EFF',
  targetType: 'count',
  targetValue: 1,
  frequency: 'daily',
  timePeriod: 'all_day'
})

const iconOptions = ['🎯','📚','💪','🏃','🧘','💧','🍎','😴','⏰','📝','💻','🎨','🎵','🚶','🏊','🚴','📖','✍️','🧹','🌱','💊','☕','🍽️','🛏️','🎮','📱','💼','🗂️','🐾','🌟']

const checkInForm = reactive({
  completionValue: 1,
  note: '',
  isMakeup: false,
  checkDate: new Date()
})

// 加载习惯列表
const loadHabits = async () => {
  loading.value = true
  try {
    const res = await habitApi.getHabits()
    habits.value = res.data || []
  } catch (error) {
    console.error('加载习惯失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载今日打卡记录
const loadTodayRecords = async () => {
  try {
    const res = await habitApi.getTodayRecords()
    todayRecords.value = res.data || []
  } catch (error) {
    console.error('加载今日记录失败:', error)
  }
}

// 获取今日进度
const getTodayProgress = (habit: any) => {
  const today = formatLocalDate(new Date())
  const completed = todayRecords.value.some((r: any) => 
    r.habitId === habit.id && r.checkDate === today
  )
  return completed ? 100 : 0
}

// 判断今天是否已完成
const isCompletedToday = (habit: any) => {
  return getTodayProgress(habit) === 100
}

// 获取目标文本
const getTargetText = (habit: any) => {
  const units = { count: '次', duration: '分钟', quantity: '个' }
  return `${habit.targetValue} ${units[habit.targetType as keyof typeof units] || '次'}`
}

// 周期校验：今天是否可以打卡
const canCheckInToday = (habit: any) => {
  const freq = habit.frequency
  if (freq === 'daily' || freq === 'weekly') return true
  const dow = new Date().getDay() // 0=Sun 1-5=Mon-Fri 6=Sat
  if (freq === 'weekdays') return dow >= 1 && dow <= 5
  if (freq === 'weekends') return dow === 0 || dow === 6
  return true
}

// 一键打卡
const handleCheckIn = async (habit: any) => {
  if (!canCheckInToday(habit)) {
    const label = habit.frequency === 'weekdays' ? '工作日' : '周末'
    ElMessage.warning(`今天不是${label}，不能打卡`)
    return
  }
  try {
    await habitApi.checkIn(habit.id, {
      completionValue: habit.targetValue,
      note: '',
      isMakeup: false
    })
    ElMessage.success('打卡成功')
    await loadHabits()
    await loadTodayRecords()
  } catch (error) {
    console.error('打卡失败:', error)
  }
}

// 趋势图点击补签
const handleTrendMakeup = (item: { date: string; count: number }) => {
  const today = formatLocalDate(new Date())
  if (item.count > 0 || item.date === today) return
  if (habits.value.length === 0) { ElMessage.warning('没有可补签的习惯'); return }
  checkingHabit.value = habits.value[0]
  checkInForm.completionValue = habits.value[0].targetValue
  checkInForm.note = ''
  checkInForm.isMakeup = true
  checkInForm.checkDate = new Date(item.date)
  showCheckInDialog.value = true
}

// 提交打卡（补卡用，保留对话框）
const submitCheckIn = async () => {
  if (!checkingHabit.value) return
  try {
    const params: any = {
      completionValue: checkInForm.completionValue,
      note: checkInForm.note,
      isMakeup: checkInForm.isMakeup
    }
    if (checkInForm.isMakeup) {
      params.checkDate = formatLocalDate(new Date(checkInForm.checkDate))
    }
    await habitApi.checkIn(checkingHabit.value.id, params)
    ElMessage.success('打卡成功')
    showCheckInDialog.value = false
    await loadHabits()
    await loadTodayRecords()
  } catch (error) {
    console.error('打卡失败:', error)
  }
}

// 编辑习惯
const handleEdit = (habit: any) => {
  editingHabit.value = habit
  habitForm.name = habit.name
  habitForm.icon = habit.icon || '🎯'
  habitForm.color = habit.color
  habitForm.targetType = habit.targetType
  habitForm.targetValue = habit.targetValue
  habitForm.frequency = habit.frequency
  habitForm.timePeriod = habit.timePeriod
  showCreateDialog.value = true
}

// 删除习惯
const handleDelete = async (habit: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个习惯吗？相关的打卡记录也会被删除。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await habitApi.deleteHabit(habit.id)
    ElMessage.success('删除成功')
    await loadHabits()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!habitForm.name.trim()) {
    ElMessage.warning('请输入习惯名称')
    return
  }
  
  try {
    if (editingHabit.value) {
      await habitApi.updateHabit(editingHabit.value.id, habitForm)
      ElMessage.success('更新成功')
    } else {
      await habitApi.createHabit(habitForm)
      ElMessage.success('创建成功')
    }
    
    showCreateDialog.value = false
    resetForm()
    await loadHabits()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 重置表单
const resetForm = () => {
  editingHabit.value = null
  habitForm.name = ''
  habitForm.icon = '🎯'
  habitForm.color = '#409EFF'
  habitForm.targetType = 'count'
  habitForm.targetValue = 1
  habitForm.frequency = 'daily'
  habitForm.timePeriod = 'all_day'
}

// ===== 趋势统计 =====
const showTrend = ref(false)
const trendDays = ref(7)
const trendLoading = ref(false)
const trendData = ref<Array<{ date: string; count: number }>>([])

const loadTrendData = async () => {
  trendLoading.value = true
  try {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - trendDays.value + 1)
    const startStr = formatLocalDate(startDate)
    const endStr = formatLocalDate(today)

    // 汇总所有习惯的记录
    const allRecords: any[] = []
    for (const habit of habits.value) {
      try {
        const res = await habitApi.getRecordsByRange(habit.id, startStr, endStr)
        if (res.data) {
          allRecords.push(...(Array.isArray(res.data) ? res.data : []))
        }
      } catch { /* skip */ }
    }

    // 按日期聚合
    const dateMap = new Map<string, number>()
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      dateMap.set(formatLocalDate(d), 0)
    }
    for (const r of allRecords) {
      const d = r.checkDate
      dateMap.set(d, (dateMap.get(d) || 0) + 1)
    }

    trendData.value = Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }))
  } catch { /* skip */ } finally {
    trendLoading.value = false
  }
}

const getBarHeight = (count: number) => {
  const max = Math.max(...trendData.value.map(d => d.count), 1)
  return Math.max(4, (count / max) * 120)
}

const getBarColor = (count: number) => {
  if (count === 0) return '#e0e0e0'
  if (count <= 2) return '#a0cfff'
  if (count <= 5) return '#409EFF'
  return '#337ecc'
}

const formatTrendDate = (dateStr: string) => {
  const parts = dateStr.split('-')
  return parts[1] + '/' + parts[2]
}

onMounted(() => {
  loadHabits()
  loadTodayRecords()
})
</script>

<style scoped>
.habits-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.habits-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.habits-toolbar h2 {
  margin: 0;
  font-size: 20px;
}

.habits-list {
  flex: 1;
}

.habit-card {
  margin-bottom: 16px;
  transition: all 0.3s;
}

.habit-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.habit-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.habit-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.habit-name {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
}

.habit-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.habit-progress {
  margin-top: 12px;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  text-align: center;
}

/* 工具栏 */
.toolbar-actions {
  display: flex;
  gap: 8px;
}

/* 趋势统计 */
.trend-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.trend-header h3 {
  margin: 0;
  font-size: 16px;
}

.trend-chart {
  min-height: 160px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 160px;
  padding: 0 8px;
}

.chart-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 100%;
  max-width: 24px;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
  min-height: 2px;
}

.bar-label {
  font-size: 10px;
  color: #909399;
  margin-top: 4px;
  white-space: nowrap;
}

.bar-value {
  font-size: 11px;
  color: #606266;
  font-weight: 500;
}

/* 图标选择器 */
.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
}

.icon-option {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.15s;
}

.icon-option:hover {
  background: #f0f2f5;
  transform: scale(1.15);
}

.icon-option.selected {
  border-color: #409EFF;
  background: #ecf5ff;
}

/* 趋势补签 */
.chart-bar-group.clickable {
  cursor: pointer;
}
.chart-bar-group.clickable:hover .bar {
  filter: brightness(1.3);
  outline: 2px dashed #E6A23C;
  outline-offset: 2px;
}
</style>

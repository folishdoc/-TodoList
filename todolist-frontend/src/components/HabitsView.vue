<template>
  <div class="habits-container">
    <!-- 工具栏 -->
    <div class="habits-toolbar">
      <h2>习惯追踪</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建习惯
      </el-button>
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
          <el-input v-model="habitForm.icon" placeholder="输入emoji或图标" maxlength="2" />
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
import { Plus, MoreFilled } from '@element-plus/icons-vue'
import * as habitApi from '../api/habit'

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
  const today = new Date().toISOString().split('T')[0]
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

// 打卡
const handleCheckIn = (habit: any) => {
  checkingHabit.value = habit
  checkInForm.completionValue = habit.targetValue
  checkInForm.note = ''
  checkInForm.isMakeup = false
  checkInForm.checkDate = new Date()
  showCheckInDialog.value = true
}

// 提交打卡
const submitCheckIn = async () => {
  if (!checkingHabit.value) return
  
  try {
    const params: any = {
      completionValue: checkInForm.completionValue,
      note: checkInForm.note,
      isMakeup: checkInForm.isMakeup
    }
    
    if (checkInForm.isMakeup) {
      params.checkDate = checkInForm.checkDate.toISOString().split('T')[0]
    }
    
    await habitApi.checkIn(checkingHabit.value.id, params)
    ElMessage.success('打卡成功')
    showCheckInDialog.value = false
    await loadHabits()
    await loadTodayRecords() // 刷新今日记录
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
</style>

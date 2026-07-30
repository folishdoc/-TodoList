<!--
/**
 * StatisticsView.vue — 数据统计概览组件
 *
 * 展示任务系统的统计数据：
 * 1. 总体统计卡片（总任务数、已完成、待完成、完成率）
 * 2. 优先级分布 + 清单分布（带进度条）
 * 3. 近7天任务创建/完成趋势图
 * 4. CSV/JSON 导出按钮
 * 数据来源：statisticsApi（后端统计接口）
 */
-->
<template>
  <div class="statistics-container">
    <el-row :gutter="20">
      <!-- 总体统计卡片 -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <h3>📊 任务统计概览</h3>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="总任务数" :value="overview.totalTasks || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="已完成" :value="overview.completedTasks || 0">
                <template #suffix>
                  <span style="color: #67c23a">✓</span>
                </template>
              </el-statistic>
            </el-col>
            <el-col :span="6">
              <el-statistic title="待完成" :value="overview.pendingTasks || 0">
                <template #suffix>
                  <span style="color: #e6a23c">⏳</span>
                </template>
              </el-statistic>
            </el-col>
            <el-col :span="6">
              <el-statistic title="完成率" :value="overview.completionRate || 0" suffix="%" />
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 优先级分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <h3>🎯 优先级分布</h3>
          </template>
          <div v-if="priorityData.length > 0">
            <div v-for="item in priorityData" :key="item.name" class="distribution-item">
              <div class="distribution-label">
                <span>{{ item.name }}</span>
                <span>{{ item.count }} 个任务</span>
              </div>
              <el-progress
                :percentage="getPercentage(item.count)"
                :color="item.color"
                :stroke-width="20"
              />
            </div>
          </div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>

      <!-- 清单分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <h3>📁 清单分布</h3>
          </template>
          <div v-if="listData.length > 0">
            <div v-for="item in listData" :key="item.name" class="distribution-item">
              <div class="distribution-label">
                <span>{{ item.name }}</span>
                <span>{{ item.count }} 个任务</span>
              </div>
              <el-progress
                :percentage="getPercentage(item.count)"
                :color="item.color"
                :stroke-width="20"
              />
            </div>
          </div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 任务趋势图 -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>📈 近7天任务趋势</h3>
              <el-button size="small" @click="loadTrend">刷新</el-button>
            </div>
          </template>
          <div v-if="trendData.length > 0" class="trend-chart">
            <div v-for="item in trendData" :key="item.date" class="trend-bar">
              <div class="trend-date">{{ formatDate(item.date) }}</div>
              <div class="trend-bars">
                <div
                  class="trend-created"
                  :style="{ height: item.created * 20 + 'px' }"
                  title="创建"
                ></div>
                <div
                  class="trend-completed"
                  :style="{ height: item.completed * 20 + 'px' }"
                  title="完成"
                ></div>
              </div>
              <div class="trend-count">
                <span class="created-count">+{{ item.created }}</span>
                <span class="completed-count">✓{{ item.completed }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as statisticsApi from '../api/statistics'

const overview = ref<any>({})
const priorityData = ref<any[]>([])
const listData = ref<any[]>([])
const trendData = ref<any[]>([])

// 加载统计数据
const loadStatistics = async () => {
  try {
    const [overviewRes, priorityRes, listRes] = await Promise.all([
      statisticsApi.getOverview(),
      statisticsApi.getByPriority(),
      statisticsApi.getByList(),
    ])

    overview.value = overviewRes.data
    priorityData.value = priorityRes.data
    listData.value = listRes.data

    await loadTrend()
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载趋势数据
const loadTrend = async () => {
  try {
    const res = await statisticsApi.getTrend(7)
    trendData.value = res.data
  } catch (error) {
    console.error('加载趋势数据失败:', error)
  }
}

// 计算百分比
const getPercentage = (count: number) => {
  const total = priorityData.value.reduce((sum, item) => sum + item.count, 0)
  return total > 0 ? Math.round((count / total) * 100) : 0
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.statistics-container {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.distribution-item {
  margin-bottom: 15px;
}

.distribution-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
}

.trend-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  padding: 20px 0;
}

.trend-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.trend-date {
  font-size: 12px;
  color: #666;
}

.trend-bars {
  display: flex;
  gap: 5px;
  align-items: flex-end;
  height: 150px;
}

.trend-created {
  width: 20px;
  background: linear-gradient(to top, #409eff, #79bbff);
  border-radius: 3px 3px 0 0;
  transition: height 0.3s;
}

.trend-completed {
  width: 20px;
  background: linear-gradient(to top, #67c23a, #95d475);
  border-radius: 3px 3px 0 0;
  transition: height 0.3s;
}

.trend-count {
  display: flex;
  gap: 10px;
  font-size: 12px;
}

.created-count {
  color: #409eff;
}

.completed-count {
  color: #67c23a;
}

/* 让统计卡片可以滚动 */
.statistics-container :deep(.el-card) {
  margin-bottom: 0;
}
</style>

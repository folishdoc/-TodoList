<template>
  <div class="anniversary-list">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索名称..."
          clearable
          prefix-icon="Search"
          style="width: 220px"
          @input="loadList"
        />
        <el-select
          v-model="filterTag"
          placeholder="标签筛选"
          clearable
          style="width: 150px"
          @change="loadList"
        >
          <el-option v-for="tag in allTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
        <el-select v-model="sortBy" style="width: 140px" @change="loadList">
          <el-option label="按最近发生日" value="nextDate" />
          <el-option label="按名称" value="name" />
          <el-option label="按创建时间" value="createdAt" />
        </el-select>
        <el-button :icon="sortOrder === 'asc' ? 'SortUp' : 'SortDown'" @click="toggleOrder" />
      </div>
      <el-button type="primary" @click="openCreate"
        ><el-icon><Plus /></el-icon>新建纪念日</el-button
      >
    </div>

    <!-- 列表 -->
    <div v-loading="loading" class="list-body">
      <el-empty v-if="!loading && list.length === 0" description="暂无纪念日" />
      <div v-else class="anniversary-cards">
        <div
          v-for="item in list"
          :key="item.id"
          class="anniversary-card"
          :class="countdownClass(item.daysUntil)"
          @click="openDetail(item)"
        >
          <div class="card-left">
            <span v-if="item.remindEnabled" class="remind-icon" title="已开启提醒">🔔</span>
          </div>
          <div class="card-body">
            <div class="card-name">{{ item.name }}</div>
            <div class="card-date">{{ formatDate(item.date) }}</div>
            <div class="card-meta">
              <el-tag v-if="item.repeatType !== 'NONE'" size="small" type="info">{{
                repeatText(item.repeatType)
              }}</el-tag>
              <el-tag
                v-if="item.tags"
                v-for="tag in parseTags(item.tags)"
                :key="tag"
                size="small"
                type="success"
                class="tag-chip"
                >{{ tag }}</el-tag
              >
            </div>
          </div>
          <div class="card-right">
            <div class="countdown" :class="countdownClass(item.daysUntil)">
              <template v-if="item.daysUntil === 0">今天</template>
              <template v-else-if="item.daysUntil > 0">还有{{ item.daysUntil }}天</template>
              <template v-else>已过{{ Math.abs(item.daysUntil) }}天</template>
            </div>
            <div class="next-date">{{ formatDate(item.nextDate) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="showForm"
      :title="editingItem ? '编辑纪念日' : '新建纪念日'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="纪念日名称" />
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="重复类型">
          <el-select v-model="form.repeatType" style="width: 100%">
            <el-option label="不重复" value="NONE" />
            <el-option label="每年" value="YEARLY" />
            <el-option label="每月" value="MONTHLY" />
            <el-option label="每周" value="WEEKLY" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒">
          <el-switch v-model="form.remindEnabled" />
        </el-form-item>
        <el-form-item v-if="form.remindEnabled" label="提前天数">
          <el-checkbox-group v-model="remindDaysArr">
            <el-checkbox label="0">当天</el-checkbox>
            <el-checkbox label="1">1天前</el-checkbox>
            <el-checkbox label="3">3天前</el-checkbox>
            <el-checkbox label="7">7天前</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="form.remindEnabled" label="提醒时间">
          <el-time-picker
            v-model="form.remindTime"
            placeholder="选择时间"
            format="HH:mm"
            value-format="HH:mm"
          />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tags" placeholder="逗号分隔多个标签" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="showDetail" title="纪念日详情" size="420px">
      <template v-if="detailItem">
        <div class="detail-header">
          <div class="detail-countdown" :class="countdownClass(detailItem.daysUntil)">
            <template v-if="detailItem.daysUntil === 0">🎉 今天!</template>
            <template v-else-if="detailItem.daysUntil > 0"
              >还有 {{ detailItem.daysUntil }} 天</template
            >
            <template v-else>已过去 {{ Math.abs(detailItem.daysUntil) }} 天</template>
          </div>
          <h2>{{ detailItem.name }}</h2>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="日期">{{
            formatDate(detailItem.date)
          }}</el-descriptions-item>
          <el-descriptions-item label="下一次发生日">{{
            formatDate(detailItem.nextDate)
          }}</el-descriptions-item>
          <el-descriptions-item label="重复类型">{{
            repeatText(detailItem.repeatType)
          }}</el-descriptions-item>
          <el-descriptions-item label="提醒">{{
            detailItem.remindEnabled ? '已开启' : '未开启'
          }}</el-descriptions-item>
          <el-descriptions-item
            v-if="detailItem.nextRemindTimes && detailItem.nextRemindTimes.length > 0"
            label="提醒时间"
          >
            <div v-for="(t, i) in detailItem.nextRemindTimes" :key="i">{{ formatDateTime(t) }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="标签">{{ detailItem.tags || '无' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detailItem.notes || '无' }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-actions">
          <el-button type="primary" @click="editFromDetail">编辑</el-button>
          <el-button type="success" @click="handleGenerateTodo">生成待办</el-button>
          <el-button type="danger" @click="handleDelete">删除</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import * as anniversaryApi from '../api/anniversary'

const loading = ref(false)
const saving = ref(false)
const list = ref<any[]>([])
const searchKeyword = ref('')
const filterTag = ref('')
const sortBy = ref('nextDate')
const sortOrder = ref('asc')
const showForm = ref(false)
const showDetail = ref(false)
const editingItem = ref<any>(null)
const detailItem = ref<any>(null)
const formRef = ref<FormInstance>()
const remindDaysArr = ref<string[]>(['0'])

const form = reactive({
  name: '',
  date: '',
  repeatType: 'NONE',
  remindEnabled: false,
  remindTime: '09:00',
  tags: '',
  notes: '',
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
}

const allTags = computed(() => {
  const tags = new Set<string>()
  list.value.forEach((item) => {
    if (item.tags) parseTags(item.tags).forEach((t) => tags.add(t))
  })
  return Array.from(tags)
})

const parseTags = (tags: string) =>
  tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
const formatDate = (d: string) => d || ''
const formatDateTime = (d: string) => {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}
const repeatText = (t: string) =>
  (({ NONE: '不重复', YEARLY: '每年', MONTHLY: '每月', WEEKLY: '每周' }) as any)[t] || t

const countdownClass = (days: number) => {
  if (days === 0) return 'countdown-today'
  if (days > 0 && days <= 7) return 'countdown-urgent'
  if (days > 0 && days <= 30) return 'countdown-near'
  return 'countdown-far'
}

const toggleOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  loadList()
}

const loadList = async () => {
  loading.value = true
  try {
    const params: any = { sortBy: sortBy.value, order: sortOrder.value }
    if (searchKeyword.value) params.search = searchKeyword.value
    if (filterTag.value) params.tag = filterTag.value
    const res = await anniversaryApi.getAnniversaries(params)
    list.value = res.data || []
  } catch (e: any) {
    console.error('加载纪念日列表失败:', e)
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingItem.value = null
  Object.assign(form, {
    name: '',
    date: '',
    repeatType: 'NONE',
    remindEnabled: false,
    remindTime: '09:00',
    tags: '',
    notes: '',
  })
  remindDaysArr.value = ['0']
  showForm.value = true
}

const openDetail = async (item: any) => {
  try {
    const res = await anniversaryApi.getAnniversaryById(item.id)
    detailItem.value = res.data
    showDetail.value = true
  } catch (e) {
    console.error('获取详情失败:', e)
  }
}

const editFromDetail = () => {
  if (!detailItem.value) return
  editingItem.value = detailItem.value
  form.name = detailItem.value.name
  form.date = detailItem.value.date
  form.repeatType = detailItem.value.repeatType
  form.remindEnabled = detailItem.value.remindEnabled
  form.remindTime = detailItem.value.remindTime || '09:00'
  form.tags = detailItem.value.tags || ''
  form.notes = detailItem.value.notes || ''
  remindDaysArr.value = detailItem.value.remindDaysBefore
    ? detailItem.value.remindDaysBefore.split(',').map((s: string) => s.trim())
    : ['0']
  showDetail.value = false
  showForm.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const data = {
        ...form,
        remindDaysBefore: remindDaysArr.value.join(','),
        tags: form.tags || null,
        notes: form.notes || null,
      }
      if (editingItem.value) {
        await anniversaryApi.updateAnniversary(editingItem.value.id, data)
        ElMessage.success('更新成功')
      } else {
        await anniversaryApi.createAnniversary(data)
        ElMessage.success('创建成功')
      }
      showForm.value = false
      await loadList()
    } catch (e: any) {
      const msg = e?.response?.data?.message || '保存失败'
      ElMessage.error(msg)
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = async () => {
  if (!detailItem.value) return
  try {
    await ElMessageBox.confirm('确定要删除这个纪念日吗？', '提示', { type: 'warning' })
    await anniversaryApi.deleteAnniversary(detailItem.value.id)
    ElMessage.success('删除成功')
    showDetail.value = false
    await loadList()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const handleGenerateTodo = async () => {
  if (!detailItem.value) return
  try {
    await anniversaryApi.generateTodo(detailItem.value.id)
    ElMessage.success('待办已生成，请查看任务列表')
  } catch (e: any) {
    ElMessage.error('生成待办失败')
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.anniversary-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.list-body {
  flex: 1;
  overflow-y: auto;
}
.anniversary-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.anniversary-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.2s;
}
.anniversary-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
.card-left {
  width: 36px;
  flex-shrink: 0;
}
.card-body {
  flex: 1;
  min-width: 0;
}
.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-date {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.card-meta {
  margin-top: 6px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.card-right {
  text-align: right;
  flex-shrink: 0;
  margin-left: 16px;
}
.countdown {
  font-size: 20px;
  font-weight: 700;
}
.countdown-today {
  color: #f56c6c;
}
.countdown-urgent {
  color: #f56c6c;
}
.countdown-near {
  color: #e6a23c;
}
.countdown-far {
  color: #909399;
}
.next-date {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}
.tag-chip {
  margin-right: 0;
}
.detail-header {
  text-align: center;
  margin-bottom: 20px;
}
.detail-countdown {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.detail-countdown.countdown-today {
  color: #f56c6c;
}
.detail-countdown.countdown-urgent {
  color: #f56c6c;
}
.detail-countdown.countdown-near {
  color: #e6a23c;
}
.detail-header h2 {
  margin: 0;
  font-size: 22px;
}
.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;
}
.remind-icon {
  font-size: 16px;
}
</style>

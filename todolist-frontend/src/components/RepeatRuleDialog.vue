<template>
  <el-dialog
    v-model="visible"
    title="设置重复规则"
    width="500px"
    @close="handleClose"
  >
    <el-form :model="ruleForm" label-width="100px">
      <el-form-item label="重复类型">
        <el-select v-model="ruleForm.type" placeholder="选择重复类型" style="width: 100%">
          <el-option label="每天" value="DAILY" />
          <el-option label="每周" value="WEEKLY" />
          <el-option label="每月" value="MONTHLY" />
          <el-option label="每年" value="YEARLY" />
        </el-select>
      </el-form-item>

      <el-form-item label="间隔">
        <el-input-number 
          v-model="ruleForm.interval" 
          :min="1" 
          :max="365"
          style="width: 100%"
        />
        <div class="hint">每 {{ ruleForm.interval }} {{ getTypeText() }}</div>
      </el-form-item>

      <el-form-item label="结束条件">
        <el-radio-group v-model="endType">
          <el-radio label="never">永不结束</el-radio>
          <el-radio label="date">直到指定日期</el-radio>
          <el-radio label="count">重复指定次数</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="endType === 'date'" label="结束日期">
        <el-date-picker
          v-model="ruleForm.endDate"
          type="date"
          placeholder="选择结束日期"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item v-if="endType === 'count'" label="重复次数">
        <el-input-number 
          v-model="ruleForm.count" 
          :min="1" 
          :max="100"
          style="width: 100%"
        />
      </el-form-item>

      <el-alert
        title="提示"
        type="info"
        :closable="false"
        show-icon
      >
        <p>• 任务完成后会自动生成下一个重复任务</p>
        <p>• 新任务的截止日期会根据重复规则自动计算</p>
      </el-alert>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as repeatApi from '../api/repeat'
import { formatLocalDateTime } from '../utils/date'

const props = defineProps<{
  modelValue: boolean
  taskId: number | null
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(props.modelValue)
const loading = ref(false)
const endType = ref('never')

const ruleForm = reactive({
  type: 'DAILY',
  interval: 1,
  endDate: null as Date | null,
  count: 10
})

watch(() => props.modelValue, (val) => {
  visible.value = val
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const getTypeText = () => {
  const texts: any = {
    DAILY: '天',
    WEEKLY: '周',
    MONTHLY: '月',
    YEARLY: '年'
  }
  return texts[ruleForm.type] || '天'
}

const handleSubmit = async () => {
  if (!props.taskId) return
  
  loading.value = true
  try {
    const rule: any = {
      type: ruleForm.type,
      interval: ruleForm.interval
    }
    
    if (endType.value === 'date' && ruleForm.endDate) {
      rule.endDate = formatLocalDateTime(new Date(ruleForm.endDate))
    } else if (endType.value === 'count') {
      rule.count = ruleForm.count
    }
    
    await repeatApi.setRepeatRule(props.taskId, rule)
    ElMessage.success('设置成功')
    emit('success')
    handleClose()
  } catch (error) {
    console.error('设置重复规则失败:', error)
    ElMessage.error('设置失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  ruleForm.type = 'DAILY'
  ruleForm.interval = 1
  ruleForm.endDate = null
  ruleForm.count = 10
  endType.value = 'never'
}
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>

<template>
  <el-dialog
    v-model="visible"
    title="AI 智能录入"
    width="580px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <!-- 第1步：输入自然语言 -->
    <div v-if="step === 'input'" class="ai-input-step">
      <p class="ai-input-hint">输入自然语言描述，AI 会自动解析为任务字段</p>
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="4"
        placeholder="例如：明天下午3点开会讨论Q3规划，高优先级，标签：会议、规划"
      />
      <div class="ai-input-actions">
        <el-button @click="visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="parsing"
          :disabled="!inputText.trim()"
          @click="handleParse"
        >
          解析
        </el-button>
      </div>
    </div>

    <!-- 第2步：解析中 -->
    <div v-else-if="step === 'parsing'" class="ai-parsing-step">
      <div class="parsing-animation">
        <el-icon :size="48" class="parsing-icon"><MagicStick /></el-icon>
        <p>AI 正在解析...</p>
      </div>
    </div>

    <!-- 第3步：预览解析结果 -->
    <div v-else-if="step === 'preview'" class="ai-preview-step">
      <div class="preview-card">
        <div class="preview-field">
          <span class="field-label">标题</span>
          <span class="field-value">{{ parsedResult.title || '（未识别）' }}</span>
        </div>
        <div class="preview-field" v-if="parsedResult.description">
          <span class="field-label">描述</span>
          <span class="field-value">{{ parsedResult.description }}</span>
        </div>
        <div class="preview-field">
          <span class="field-label">优先级</span>
          <el-tag :type="priorityType" size="small">
            {{ priorityText }}
          </el-tag>
        </div>
        <div class="preview-field" v-if="parsedResult.dueDate">
          <span class="field-label">截止时间</span>
          <span class="field-value">{{ parsedResult.dueDate }}</span>
        </div>
        <div class="preview-field" v-if="parsedResult.startDate">
          <span class="field-label">开始时间</span>
          <span class="field-value">{{ parsedResult.startDate }}</span>
        </div>
        <div class="preview-field" v-if="parsedResult.listName">
          <span class="field-label">清单</span>
          <span class="field-value">{{ parsedResult.listName }}</span>
        </div>
        <div class="preview-field" v-if="parsedResult.tags && parsedResult.tags.length > 0">
          <span class="field-label">标签</span>
          <div class="field-tags">
            <el-tag
              v-for="tag in parsedResult.tags"
              :key="tag"
              size="small"
              style="margin-right: 4px; margin-bottom: 4px"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
      <div class="ai-input-actions">
        <el-button @click="step = 'input'">重新输入</el-button>
        <el-button type="primary" @click="handleConfirm">确认并填充</el-button>
      </div>
    </div>

    <template #footer><!-- 使用自定义按钮布局，不需要 dialog 默认 footer --></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { parseTask } from '../api/ai'
import type { ParsedTask } from '../api/ai'

const emit = defineEmits<{
  confirm: [data: ParsedTask]
}>()

const visible = ref(false)
const inputText = ref('')
const step = ref<'input' | 'parsing' | 'preview'>('input')
const parsing = ref(false)
const parsedResult = ref<ParsedTask>({
  title: '',
  description: '',
  priority: 0,
  dueDate: '',
  startDate: '',
  listName: '',
  tags: [],
})

const priorityType = computed(() => {
  const types: Record<number, string> = { 0: '', 1: 'info', 2: 'warning', 3: 'danger' }
  return types[parsedResult.value.priority] || ''
})

const priorityText = computed(() => {
  const texts: Record<number, string> = { 0: '无', 1: '低', 2: '中', 3: '高' }
  return texts[parsedResult.value.priority] || '无'
})

function open() {
  visible.value = true
  step.value = 'input'
  inputText.value = ''
  parsedResult.value = { title: '', description: '', priority: 0, dueDate: '', startDate: '', listName: '', tags: [] }
}

async function handleParse() {
  if (!inputText.value.trim()) return
  parsing.value = true
  step.value = 'parsing'
  try {
    const result = await parseTask(inputText.value.trim())
    parsedResult.value = result
    step.value = 'preview'
  } catch (e: any) {
    ElMessage.error(e?.message || 'AI 解析失败，请稍后重试')
    step.value = 'input'
  } finally {
    parsing.value = false
  }
}

function handleConfirm() {
  emit('confirm', { ...parsedResult.value })
  visible.value = false
}

defineExpose({ open })
</script>

<style scoped>
.ai-input-step,
.ai-parsing-step,
.ai-preview-step {
  min-height: 200px;
}

.ai-input-hint {
  font-size: 13px;
  color: #909399;
  margin: 0 0 12px;
}

.ai-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.parsing-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  gap: 16px;
  color: #909399;
}

.parsing-icon {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.preview-card {
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-field {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.field-label {
  font-size: 12px;
  color: #909399;
  min-width: 60px;
  flex-shrink: 0;
  line-height: 24px;
}

.field-value {
  font-size: 14px;
  color: var(--el-text-color-primary, #303133);
  line-height: 24px;
  word-break: break-all;
}

.field-tags {
  display: flex;
  flex-wrap: wrap;
}

/* 暗色主题适配 */
:root.dark-theme .preview-card {
  background: #2d2d2d;
}
</style>

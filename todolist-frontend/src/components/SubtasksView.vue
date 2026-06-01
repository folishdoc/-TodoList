<template>
  <div class="subtasks-container">
    <div class="subtasks-header">
      <h4>子任务</h4>
      <el-button size="small" type="primary" @click="showAddSubtask = true">
        <el-icon><Plus /></el-icon>
        添加子任务
      </el-button>
    </div>

    <div v-if="subtasks.length === 0" class="empty-subtasks">
      <el-empty description="暂无子任务" :image-size="60" />
    </div>

    <div v-else class="subtasks-list">
      <div
        v-for="subtask in subtasks"
        :key="subtask.id"
        class="subtask-item"
        :class="{ 'completed': subtask.status === 1 }"
      >
        <el-checkbox
          :model-value="subtask.status === 1"
          @change="handleCompleteSubtask(subtask)"
        />
        <span class="subtask-title">{{ subtask.title }}</span>
        <el-button
          size="small"
          type="danger"
          link
          @click="handleDeleteSubtask(subtask)"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 添加子任务对话框 -->
    <el-dialog v-model="showAddSubtask" title="添加子任务" width="400px">
      <el-form :model="subtaskForm" ref="subtaskFormRef">
        <el-form-item label="标题" required>
          <el-input v-model="subtaskForm.title" placeholder="请输入子任务标题" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddSubtask = false">取消</el-button>
        <el-button type="primary" @click="handleAddSubtask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import * as taskApi from '../api/task'

const props = defineProps<{
  parentId: number
}>()

const emit = defineEmits(['refresh'])

const subtasks = ref<any[]>([])
const showAddSubtask = ref(false)

const subtaskForm = reactive({
  title: ''
})

// 加载子任务
const loadSubtasks = async () => {
  try {
    const res = await taskApi.getSubtasks(props.parentId)
    subtasks.value = res.data || []
  } catch (error) {
    console.error('加载子任务失败:', error)
  }
}

// 添加子任务
const handleAddSubtask = async () => {
  if (!subtaskForm.title.trim()) {
    ElMessage.warning('请输入子任务标题')
    return
  }

  try {
    await taskApi.createTask({
      title: subtaskForm.title,
      parentId: props.parentId,
      priority: 2,
      status: 0
    })
    ElMessage.success('添加成功')
    showAddSubtask.value = false
    subtaskForm.title = ''
    await loadSubtasks()
    emit('refresh')
  } catch (error) {
    console.error('添加子任务失败:', error)
  }
}

// 完成子任务
const handleCompleteSubtask = async (subtask: any) => {
  try {
    if (subtask.status === 1) {
      // 取消完成
      await taskApi.uncompleteTask(subtask.id)
    } else {
      // 完成任务
      await taskApi.completeTask(subtask.id)
      ElMessage.success('子任务已完成')
    }
    await loadSubtasks()
    emit('refresh')
  } catch (error) {
    console.error('操作失败:', error)
  }
}

// 删除子任务
const handleDeleteSubtask = async (subtask: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个子任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await taskApi.deleteTask(subtask.id)
    ElMessage.success('删除成功')
    await loadSubtasks()
    emit('refresh')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除子任务失败:', error)
    }
  }
}

// 监听父任务ID变化
watch(() => props.parentId, () => {
  loadSubtasks()
})

onMounted(() => {
  loadSubtasks()
})
</script>

<style scoped>
.subtasks-container {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.subtasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.subtasks-header h4 {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.empty-subtasks {
  padding: 20px 0;
}

.subtasks-list {
  max-height: 300px;
  overflow-y: auto;
}

.subtask-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 5px;
  background: #f5f7fa;
  border-radius: 4px;
  transition: all 0.3s;
}

.subtask-item:hover {
  background: #e8e8e8;
}

.subtask-item.completed .subtask-title {
  text-decoration: line-through;
  color: #999;
}

.subtask-title {
  flex: 1;
  margin-left: 10px;
  font-size: 14px;
}
</style>

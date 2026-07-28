<!--
/**
 * TagsView.vue — 标签管理组件
 *
 * 提供标签的 CRUD 操作界面：以表格展示所有标签（名称、颜色、创建时间），
 * 支持编辑名称/颜色、删除标签。通常由 Dashboard 的标签管理菜单项加载。
 * 标签的增删直接操作后端 API，不涉及任务关联。
 */
-->
<template>
  <div class="tags-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>标签管理</h3>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新建标签
          </el-button>
        </div>
      </template>

      <!-- 空白显示 -->
      <el-empty v-if="tags.length === 0" description="暂无标签" />

      <!-- 标签列表 -->
      <el-table v-else :data="tags" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="标签名称" width="200" />
        <el-table-column prop="color" label="颜色" width="120">
          <template #default="{ row }">
            <el-tag :color="row.color" effect="dark">{{ row.color }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑标签对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTag ? '编辑标签' : '新建标签'"
      width="400px"
    >
      <el-form :model="tagForm" :rules="tagRules" ref="tagFormRef" label-width="60px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="tagForm.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading"> 确定 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import * as tagApi from '../api/tag'

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const editingTag = ref<any>(null)
const tagFormRef = ref<FormInstance>()

const tags = ref<any[]>([])

const tagForm = reactive({
  name: '',
  color: '#409EFF',
})

const tagRules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
}

// 加载标签列表
const loadTags = async () => {
  loading.value = true
  try {
    const res = await tagApi.getTags()
    tags.value = res.data
  } catch (error) {
    console.error('加载标签失败:', error)
  } finally {
    loading.value = false
  }
}

// 编辑标签
const handleEdit = (tag: any) => {
  editingTag.value = tag
  tagForm.name = tag.name
  tagForm.color = tag.color
  showCreateDialog.value = true
}

// 删除标签
const handleDelete = async (tag: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个标签吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await tagApi.deleteTag(tag.id)
    ElMessage.success('删除成功')
    loadTags()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除标签失败:', error)
    }
  }
}

// 提交标签
const handleSubmit = async () => {
  if (!tagFormRef.value) return

  await tagFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (editingTag.value) {
          await tagApi.updateTag(editingTag.value.id, tagForm)
          ElMessage.success('更新成功')
        } else {
          await tagApi.createTag(tagForm)
          ElMessage.success('创建成功')
        }
        showCreateDialog.value = false
        resetForm()
        loadTags()
      } catch (error) {
        console.error('提交标签失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  editingTag.value = null
  tagForm.name = ''
  tagForm.color = '#409EFF'
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadTags()
})
</script>

<style scoped>
.tags-container {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tags-container :deep(.el-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tags-container :deep(.el-card__body) {
  flex: 1;
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
</style>

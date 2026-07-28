/**
 * useTags — 标签管理逻辑
 *
 * 封装标签的增删改查以及任务-标签多对多关系管理。
 * 支持通过 diff 检查标签变更并逐条调用后端 API（添加/移除）。
 */
import { ref } from 'vue'
import type { Tag } from '../types'
import * as tagApi from '../api/tag'

export function useTags() {
  // ── 状态 ──
  const allTags = ref<Tag[]>([])
  const taskTags = ref<Tag[]>([])
  const selectedTagIds = ref<number[]>([])

  // ── 方法 ──

  /** 加载全部标签（用于标签选择器） */
  const loadAllTags = async () => {
    try {
      const res = await tagApi.getTags()
      allTags.value = res.data || []
    } catch (e) {
      console.warn('加载全部标签失败', e)
    }
  }

  /** 标签选择变化时：对比当前集合与新集合，逐个添加/移除 */
  const handleTagChange = async (tagIds: number[], editingTask: Record<string, any>) => {
    if (!editingTask) return
    const taskId = editingTask.id
    const currentIds = new Set(taskTags.value.map((t: Tag) => t.id))
    const newIds = new Set(tagIds)
    for (const id of tagIds) {
      if (!currentIds.has(id)) {
        try {
          await tagApi.addTagToTask(taskId, id)
        } catch (e) {
          console.warn('添加标签失败', e)
        }
      }
    }
    for (const id of currentIds) {
      if (!newIds.has(id)) {
        try {
          await tagApi.removeTagFromTask(taskId, id)
        } catch (e) {
          console.warn('移除标签失败', e)
        }
      }
    }
    try {
      const res = await tagApi.getTaskTags(taskId)
      taskTags.value = res.data || []
      selectedTagIds.value = taskTags.value.map((t: Tag) => t.id)
    } catch (e) {
      console.warn('刷新标签失败', e)
    }
  }

  /** 移除任务的单个标签（通过"×"按钮触发） */
  const handleRemoveTag = async (tagId: number, editingTask: Record<string, any>) => {
    if (!editingTask) return
    try {
      await tagApi.removeTagFromTask(editingTask.id, tagId)
      taskTags.value = taskTags.value.filter((t: Tag) => t.id !== tagId)
      selectedTagIds.value = selectedTagIds.value.filter((id) => id !== tagId)
    } catch (e) {
      console.warn('移除标签失败', e)
    }
  }

  return {
    allTags,
    taskTags,
    selectedTagIds,
    loadAllTags,
    handleTagChange,
    handleRemoveTag,
  }
}

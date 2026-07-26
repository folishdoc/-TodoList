import { ref } from 'vue'
import type { Tag } from '../types'
import * as tagApi from '../api/tag'

export function useTags() {
  const allTags = ref<Tag[]>([])
  const taskTags = ref<Tag[]>([])
  const selectedTagIds = ref<number[]>([])

  const loadAllTags = async () => {
    try {
      const res = await tagApi.getTags()
      allTags.value = res.data || []
    } catch (e) {
      console.warn('加载全部标签失败', e)
    }
  }

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

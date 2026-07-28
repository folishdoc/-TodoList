/**
 * useLists — 任务清单管理逻辑
 *
 * 封装清单的 CRUD 操作、表单管理、列表加载。
 * 清单仅用于分类任务，删除清单不会删除该清单下的任务（仅 listId 置空）。
 */
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import * as listApi from '../api/list'

/** 清单创建表单的数据结构 */
export interface ListForm {
  name: string
  color: string
}

export function useLists() {
  // ── 状态 ──
  const taskLists = ref<any[]>([])
  const showCreateListDialog = ref(false)
  const submitLoading = ref(false)
  const listFormRef = ref<FormInstance>()
  const listRules = {
    name: [{ required: true, message: '请输入清单名称', trigger: 'blur' }],
  }

  // ── 表单数据 ──
  const listForm = reactive<ListForm>({
    name: '',
    color: '#409EFF',
  })

  // ── 方法 ──

  /** 加载所有清单列表 */
  const loadLists = async () => {
    try {
      const res = await listApi.getLists()
      taskLists.value = res.data || []
    } catch (e) {
      console.warn('加载清单失败', e)
    }
  }

  /** 重置创建清单的表单 */
  const resetListForm = () => {
    listForm.name = ''
    listForm.color = '#409EFF'
  }

  /** 提交创建/更新清单表单 */
  const handleSubmitList = async () => {
    if (!listFormRef.value) return

    await listFormRef.value.validate(async (valid) => {
      if (valid) {
        submitLoading.value = true
        try {
          await listApi.createList(listForm)
          ElMessage.success('创建成功')
          showCreateListDialog.value = false
          resetListForm()
          loadLists()
        } catch (error) {
          console.error('创建清单失败:', error)
        } finally {
          submitLoading.value = false
        }
      }
    })
  }

  /** 删除清单：确认后删除，如果当前活动的视图正是该清单则自动切到"全部" */
  const handleDeleteList = async (list: any, activeMenu: any, setActiveMenu: (v: string) => void, loadTasks: () => void) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除清单"${list.name}"吗？该清单下的任务将不会被删除。`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )

      await listApi.deleteList(list.id)
      ElMessage.success('删除成功')
      loadLists()

      if (activeMenu === `list-${list.id}`) {
        setActiveMenu('all')
        loadTasks()
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除清单失败:', error)
      }
    }
  }

  return {
    taskLists,
    showCreateListDialog,
    submitLoading,
    listFormRef,
    listForm,
    listRules,
    loadLists,
    resetListForm,
    handleSubmitList,
    handleDeleteList,
  }
}

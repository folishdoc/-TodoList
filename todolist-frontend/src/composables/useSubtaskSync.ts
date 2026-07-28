/**
 * useSubtaskSync — 子任务同步逻辑
 *
 * 将前端子任务快照与后端数据库同步，执行增/删/改操作。
 * 策略：删除前端不存在的后端子任务，新增前端新增的子任务，更新已有子任务的标题和状态。
 */
import * as taskApi from '../api/task'

/** 子任务快照：用于与后端同步的轻量级数据结构 */
export interface SubtaskSnapshot {
  id?: number
  title: string
  completed: boolean
}

export async function syncSubtasks(
  taskId: number,
  subtasksSnapshot: SubtaskSnapshot[],
  taskFormSubtasks: any[],
  loadTasks: () => void,
  emitTaskChanged: () => void,
) {
  const existingSubtasksRes = await taskApi.getSubtasks(taskId)
  const existingSubtasks = existingSubtasksRes.data || []

  const dbSubtaskById = new Map<number, any>()
  existingSubtasks.forEach((st: any) => {
    dbSubtaskById.set(st.id, st)
  })

  const frontendIds = new Set<number>()
  subtasksSnapshot.forEach((st) => {
    if (st.id) frontendIds.add(st.id)
  })

  // 1. Delete subtasks no longer in frontend
  for (const [id, dbSubtask] of dbSubtaskById) {
    if (!frontendIds.has(id)) {
      await taskApi.deleteTask(dbSubtask.id)
    }
  }

  // 2. Update or create subtasks
  for (const subtask of subtasksSnapshot) {
    const dbSubtask =
      subtask.id && dbSubtaskById.has(subtask.id) ? dbSubtaskById.get(subtask.id) : null

    if (dbSubtask) {
      await taskApi.updateTask(dbSubtask.id, {
        title: subtask.title,
        status: subtask.completed ? 1 : 0,
        parentId: taskId,
      })
    } else {
      const res = await taskApi.createTask({
        title: subtask.title,
        parentId: taskId,
        status: subtask.completed ? 1 : 0,
        priority: 0,
      })
      // Backfill id to original reactive object
      const originalSubtask = taskFormSubtasks?.find(
        (st: any) => st.title && st.title.trim() === subtask.title && !st.id,
      )
      if (res.data && res.data.id && originalSubtask) {
        originalSubtask.id = res.data.id
      }
    }
  }

  loadTasks()
  emitTaskChanged()
}

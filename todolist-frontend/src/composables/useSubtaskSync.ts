import * as taskApi from '../api/task'

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

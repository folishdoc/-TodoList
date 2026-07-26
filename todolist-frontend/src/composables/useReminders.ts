import { ref } from 'vue'
import * as anniversaryApi from '../api/anniversary'

export function useReminders() {
  const reminders = ref<any[]>([])
  const unreadReminderCount = ref(0)
  let reminderTimer: any = null

  const loadReminders = async () => {
    try {
      const res = await anniversaryApi.getPendingReminders()
      reminders.value = res.data || []
      unreadReminderCount.value = reminders.value.filter((r: any) => !r.isRead).length
    } catch (e) {
      console.warn('加载提醒失败', e)
    }
  }

  const getReminderName = (anniversaryId: number) => {
    return `纪念日 #${anniversaryId}`
  }

  const formatReminderTime = (time: string) => {
    if (!time) return ''
    const d = new Date(time)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const onMountedReminders = () => {
    loadReminders()
    reminderTimer = setInterval(loadReminders, 60000)
  }

  const onUnmountedReminders = () => {
    if (reminderTimer) clearInterval(reminderTimer)
  }

  return {
    reminders,
    unreadReminderCount,
    loadReminders,
    getReminderName,
    formatReminderTime,
    onMountedReminders,
    onUnmountedReminders,
  }
}

/**
 * useReminders — 纪念日提醒管理逻辑
 *
 * 封装纪念日提醒的加载、计数、格式化和定时轮询。
 * 使用 setInterval 每 60 秒自动刷新未读提醒。
 */
import { ref } from 'vue'
import * as anniversaryApi from '../api/anniversary'

export function useReminders() {
  // ── 状态 ──
  const reminders = ref<any[]>([])
  const unreadReminderCount = ref(0)
  let reminderTimer: any = null

  // ── 方法 ──

  /** 从后端加载未读提醒，并更新未读数 */
  const loadReminders = async () => {
    try {
      const res = await anniversaryApi.getPendingReminders()
      reminders.value = res.data || []
      unreadReminderCount.value = reminders.value.filter((r: any) => !r.isRead).length
    } catch (e) {
      console.warn('加载提醒失败', e)
    }
  }

  /** 根据纪念日 ID 获取显示名称（当前为简化版，仅显示 ID） */
  const getReminderName = (anniversaryId: number) => {
    return `纪念日 #${anniversaryId}`
  }

  /** 格式化提醒时间为可读文本 */
  const formatReminderTime = (time: string) => {
    if (!time) return ''
    const d = new Date(time)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  /** 初始化提醒（立即加载 + 开启 60s 轮询），在组件 onMounted 中调用 */
  const onMountedReminders = () => {
    loadReminders()
    reminderTimer = setInterval(loadReminders, 60000)
  }

  /** 清理定时器，在组件 onUnmounted 中调用 */
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

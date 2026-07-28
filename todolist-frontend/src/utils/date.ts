/**
 * 本地日期时间工具函数
 *
 * 提供不依赖时区的本地日期时间格式化函数。
 * 避免 `toISOString()` 在非 UTC 时区下产生的日期偏移问题。
 */

/**
 * 格式化本地时间为 ISO-like 字符串（无时区后缀）
 * 输出格式：`YYYY-MM-DDTHH:mm:ss`
 */
export const formatLocalDateTime = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}:${s}`
}

/** 格式化为纯日期 (YYYY-MM-DD) */
export const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

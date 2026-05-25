/**
 * 格式化本地时间为 ISO 字符串（不带时区后缀）。
 * 避免 toISOString() 在 UTC+8 等时区下产生的日期偏移。
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

/** 格式化为仅日期 (YYYY-MM-DD) */
export const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

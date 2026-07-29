/**
 * JWT 工具函数
 *
 * 解码 JWT payload 获取过期时间，用于前端路由守卫判断 token 是否有效。
 * 不验证签名（签名由后端验证），仅读取 exp 声明。
 */

/** JWT payload 的解码结构（只关心过期相关字段） */
interface JwtPayload {
  sub?: string
  exp?: number
  iat?: number
}

/** Base64 URL 安全解码 */
function base64UrlDecode(str: string): string {
  // 替换 URL 安全字符为标准 base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  // 补全 padding
  while (base64.length % 4 !== 0) base64 += '='
  try {
    return atob(base64)
  } catch {
    return ''
  }
}

/**
 * 解码 JWT token，返回 payload 对象。
 * 解码失败（非法格式）返回 null。
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const decoded = base64UrlDecode(parts[1])
    if (!decoded) return null
    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}

/**
 * 判断 JWT token 是否已过期。
 *
 * - token 为空 → 视为过期
 * - 解码失败 → 视为过期
 * - 不含 exp 字段 → 视为永不过期（兼容旧 token）
 * - exp 是秒级时间戳，与当前时间比较
 */
export function isJwtExpired(token: string | null): boolean {
  if (!token) return true

  const payload = decodeJwt(token)
  if (!payload) return true

  // 没有 exp 字段 → 视为永不过期
  if (payload.exp === undefined || payload.exp === null) return false

  // exp 是秒级 Unix 时间戳
  return Date.now() >= payload.exp * 1000
}

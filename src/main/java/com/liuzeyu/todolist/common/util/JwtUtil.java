package com.liuzeyu.todolist.common.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 令牌工具类
 * <p>
 * 使用 HMAC-SHA256 签名算法，密钥和过期时间从 application.yml 配置注入。
 * 令牌 subject 存储 userId（字符串形式），用于 {@link com.liuzeyu.todolist.common.config.SecurityConfig} 中的认证过滤器。
 * 单用户模式下，前端使用硬编码的个人 token 直接映射到 userId=1L。
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expiration;

    /**
     * @param secret    JWT 签名密钥（从配置 app.jwt.secret 注入）
     * @param expiration 令牌过期时间（毫秒，从配置 app.jwt.expiration 注入）
     */
    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                   @Value("${app.jwt.expiration}") long expiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    /**
     * 生成 JWT 令牌
     *
     * @param userId 用户 ID（存入 subject）
     * @return 签名的 JWT 字符串
     */
    public String generateToken(Long userId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration))
                .signWith(key)
                .compact();
    }

    /**
     * 从 JWT 令牌中解析用户 ID
     *
     * @param token JWT 字符串
     * @return 用户 ID
     * @throws io.jsonwebtoken.JwtException 如果令牌无效或已过期
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return Long.parseLong(claims.getSubject());
    }
}

package com.liuzeyu.todolist.module.ai.service;

import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * AI 接口限流器 - 仅生产环境激活。
 * 基于 Redis 计数器实现用户级频率限制（每分钟 N 次），防止 LLM API 滥用。
 */
@Component
@Profile("prod")
public class AiRateLimiter {

    private static final int MAX_PER_MINUTE = 10;

    private final RedisTemplate<String, Object> redisTemplate;

    public AiRateLimiter(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * 检查用户是否允许调用 AI 接口。
     * @param userId 用户 ID
     * @return true 允许，false 超过限流阈值
     */
    public boolean allow(Long userId) {
        String key = "ai:rate:" + userId + ":" + (System.currentTimeMillis() / 60000);
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, Duration.ofMinutes(1));
        }
        return count == null || count <= MAX_PER_MINUTE;
    }
}

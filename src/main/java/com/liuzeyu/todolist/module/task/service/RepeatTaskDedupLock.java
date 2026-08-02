package com.liuzeyu.todolist.module.task.service;

import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;

/**
 * 重复任务生成去重锁 - 仅生产环境激活。
 * 基于 Redis SETNX 实现跨实例/跨重启的幂等去重，替代 JVM 内存变量 lastGenerateDate。
 */
@Component
@Profile("prod")
public class RepeatTaskDedupLock {

    private final RedisTemplate<String, Object> redisTemplate;

    public RepeatTaskDedupLock(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * 尝试获取当天的去重锁。
     * @param date 日期
     * @return true 首次获取（可执行），false 当天已执行过
     */
    public boolean tryAcquire(LocalDate date) {
        String key = "repeat:generate:" + date;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(key, "1", Duration.ofDays(1));
        return Boolean.TRUE.equals(acquired);
    }
}

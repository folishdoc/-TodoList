package com.liuzeyu.todolist.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 配置 - 仅生产环境激活。
 * <p>
 * 桌面版（H2/默认 profile）不依赖 Redis：spring-boot-starter-data-redis 的 Lettuce
 * 连接为懒加载，桌面版不注入 RedisTemplate、不触发任何 Redis 操作，启动时不会因
 * 缺少 Redis 连接而失败。
 * <p>
 * 生产环境通过 application-prod.properties 配置 spring.data.redis.* 连接参数，
 * 此处自定义 RedisTemplate 序列化策略（key=String，value=JSON）。
 */
@Configuration
@Profile("prod")
public class RedisConfig {

    /**
     * 自定义 RedisTemplate：key 用 String 序列化，value 用 JSON 序列化，
     * 避免默认 JDK 序列化产生的乱码与跨语言兼容问题。
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        template.afterPropertiesSet();
        return template;
    }
}

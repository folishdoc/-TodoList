package com.liuzeyu.todolist.module.ai.config;

import com.liuzeyu.todolist.module.ai.service.TaskAiService;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AI 模块显式配置 — 仅在 ChatModel bean 存在时创建 TaskAiService 代理。
 * <p>
 * 相比 {@code @AiService} 自动扫描，显式 {@code @Configuration} 更可控：
 * <ul>
 *   <li>通过 {@code @ConditionalOnBean(ChatModel.class)} 实现优雅降级</li>
 *   <li>不依赖 starter 的自动扫描机制，配置意图更清晰</li>
 * </ul>
 */
@Configuration
public class AiConfig {

    @Bean
    @ConditionalOnBean(ChatModel.class)
    public TaskAiService taskAiService(ChatModel chatModel) {
        return AiServices.builder(TaskAiService.class)
                .chatModel(chatModel)
                .build();
    }
}
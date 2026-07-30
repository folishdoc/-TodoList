package com.liuzeyu.todolist.module.ai.config;

import com.liuzeyu.todolist.module.ai.service.TaskAiService;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AI 模块显式配置 - 创建 TaskAiService 代理。
 * <p>
 * 相比 {@code @AiService} 自动扫描，显式 {@code @Configuration} 更可控、意图更清晰。
 * <p>
 * 注意：不使用 {@code @ConditionalOnBean(ChatModel.class)}。用户 @Configuration 中的
 * @ConditionalOnBean 会在自动配置 bean 实例化前评估（顺序问题），导致匹配不到 starter
 * 创建的 ChatModel bean，从而使 TaskAiService 不被创建。ChatModel bean 由
 * langchain4j-open-ai-spring-boot4-starter 自动配置提供，此处直接声明依赖即可。
 */
@Configuration
public class AiConfig {

    @Bean
    public TaskAiService taskAiService(ChatModel chatModel) {
        return AiServices.builder(TaskAiService.class)
                .chatModel(chatModel)
                .build();
    }
}
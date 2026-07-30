package com.liuzeyu.todolist.module.ai.service;

import com.liuzeyu.todolist.module.ai.dto.ParsedTask;
import dev.langchain4j.service.spring.AiService;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

/**
 * AI 任务解析服务 — 将自然语言描述解析为结构化任务 POJO。
 * <p>
 * 由 langchain4j {@code @AiService} 注解自动生成代理实现，
 * 依赖 {@code OpenAiChatModel} bean（由 langchain4j-open-ai-spring-boot4-starter 自动配置）。
 */
@AiService
public interface TaskAiService {

    @SystemMessage("""
            你是智能任务解析助手。将用户自然语言解析为结构化任务 JSON。
            规则：
            1. 提取标题、描述、优先级、截止/开始时间、所属列表名、标签
            2. 未指定优先级默认 2
            3. 时间格式 yyyy-MM-dd HH:mm
            4. "明天""后天""下周一"等相对时间按当前日期推算
            5. 无法确定的字段留 null
            6. 只返回 JSON，不要额外解释
            """)
    ParsedTask parseTask(@UserMessage String userInput);
}

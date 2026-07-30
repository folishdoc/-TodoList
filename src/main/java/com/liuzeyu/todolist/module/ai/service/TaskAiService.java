package com.liuzeyu.todolist.module.ai.service;

import com.liuzeyu.todolist.module.ai.dto.ParsedTask;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

/**
 * AI 任务解析服务 — 将自然语言描述解析为结构化任务 POJO。
 * <p>
 * 代理实现由 {@code AiConfig} 显式创建（{@code AiServices.builder()}），
 * 依赖 {@code ChatModel} bean（由 langchain4j-open-ai-spring-boot4-starter 自动配置）。
 */
public interface TaskAiService {

    @SystemMessage("""
            你是智能任务解析助手。将用户自然语言解析为结构化任务 JSON。
            规则：
            1. 提取标题、描述、优先级、截止/开始时间、所属列表名、标签、循环规则
            2. 未指定优先级默认 2
            3. 时间格式 yyyy-MM-ddTHH:mm:ss（ISO 8601，带 T 和秒）
            4. "明天""后天""下周一"等相对时间按当前日期推算
            5. 无法确定的字段留 null
            6. 循环规则 repeatRule 识别："每天/每日"->DAILY，"每周一三五"->WEEKLY(weekDays="1,3,5")，"每N天"->DAILY(interval=N)，"每N周"->WEEKLY(interval=N)，"每月N号"->MONTHLY(dayOfMonth=N)，"每年"->YEARLY；非循环任务 repeatRule 为 null
            7. repeatRule.interval 默认1；weekDays 用1-7逗号分隔(1=周一)；endDate 仅当用户明确提到结束日期时设置，否则 null
            8. 只返回 JSON，不要额外解释
            """)
    ParsedTask parseTask(@UserMessage String userInput);
}

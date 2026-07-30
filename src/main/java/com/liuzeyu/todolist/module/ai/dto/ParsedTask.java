package com.liuzeyu.todolist.module.ai.dto;

import dev.langchain4j.model.output.structured.Description;

import java.util.List;

/**
 * AI 解析自然语言后输出的结构化任务数据。
 * 字段使用 @Description 注解为 LLM 提供中文语义提示。
 */
public record ParsedTask(
        @Description("任务标题")
        String title,

        @Description("任务描述")
        String description,

        @Description("优先级：1-低，2-中，3-高")
        Integer priority,

        @Description("截止时间，ISO 格式 yyyy-MM-ddTHH:mm:ss")
        String dueDate,

        @Description("开始时间，ISO 格式 yyyy-MM-ddTHH:mm:ss")
        String startDate,

        @Description("所属列表名称")
        String listName,

        @Description("标签名称列表")
        List<String> tags
) {
}

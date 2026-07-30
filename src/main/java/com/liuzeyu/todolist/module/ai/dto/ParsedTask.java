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
        List<String> tags,

        @Description("循环规则，非循环任务为 null")
        AiRepeatRule repeatRule
) {
    /**
     * AI 解析输出的循环规则。endDate 用 String（ISO 格式）而非 LocalDateTime，
     * 与 ParsedTask 其他时间字段保持一致，规避 langchain4j Jackson 反序列化问题。
     */
    @Description("循环规则")
    public record AiRepeatRule(
            @Description("循环类型：DAILY-每天, WEEKLY-每周, MONTHLY-每月, YEARLY-每年")
            String type,

            @Description("间隔，默认1，如每2天则 interval=2")
            Integer interval,

            @Description("周几，1-7逗号分隔，仅 WEEKLY，如周一三五为 \"1,3,5\"")
            String weekDays,

            @Description("每月几号，仅 MONTHLY")
            Integer dayOfMonth,

            @Description("循环结束时间，ISO 格式 yyyy-MM-ddTHH:mm:ss，无结束限制为 null")
            String endDate
    ) {
    }
}

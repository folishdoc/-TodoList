package com.liuzeyu.todolist.module.task.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 重复规则 DTO
 * <p>
 * 定义任务的重复模式，以 JSON 格式存储在 Task.repeatRule 字段中。
 * type 支持：DAILY（每天）、WEEKLY（每周）、MONTHLY（每月）、YEARLY（每年）、CUSTOM（自定义）。
 * interval 表示间隔（如每2天、每3周），weekDays 用于 WEEKLY 类型指定周几。
 * count 限制重复次数（null 表示无限），endDate 限制结束日期。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepeatRule {
    
    private String type;        // DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM
    private Integer interval;   // 间隔（每几天/几周/几月）
    private String weekDays;    // 星期几（1-7，逗号分隔）
    private Integer dayOfMonth; // 每月几号
    private Integer count;      // 重复次数（null表示无限）
    private LocalDateTime endDate; // 结束日期
}

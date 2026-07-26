package com.liuzeyu.todolist.module.task.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 重复规则DTO
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

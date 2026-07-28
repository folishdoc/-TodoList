package com.liuzeyu.todolist.module.task.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 任务时间更新请求 DTO（仅更新开始/截止时间）
 * <p>
 * 用于日历视图拖拽修改任务时间，只更新 startDate 和 dueDate 两个字段。
 * 不触发其他字段的校验或变更。
 */
@Data
public class TaskTimeRequest {
    private LocalDateTime startDate;
    private LocalDateTime dueDate;
}

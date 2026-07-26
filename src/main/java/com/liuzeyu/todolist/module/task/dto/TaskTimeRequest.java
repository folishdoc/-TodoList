package com.liuzeyu.todolist.module.task.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 任务时间更新请求DTO（仅更新开始/截止时间）
 */
@Data
public class TaskTimeRequest {
    private LocalDateTime startDate;
    private LocalDateTime dueDate;
}

package com.liuzeyu.todolist.module.task.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 任务实体
 */
@Data
public class Task {
    private Long id;

    private Long userId;

    private Long listId;

    private Long parentId; // 父任务ID，用于子任务

    private String title;

    private String description;

    private Integer priority = 2; // 默认中等优先级

    private Integer status = 0; // 默认未完成

    private LocalDateTime dueDate;

    private LocalDateTime startDate; // 预定日期/开始日期

    private LocalDateTime reminderTime;

    private String repeatRule;

    private LocalDateTime completedAt;

    private Integer sortOrder = 0;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

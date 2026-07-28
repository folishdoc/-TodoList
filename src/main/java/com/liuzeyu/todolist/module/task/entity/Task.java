package com.liuzeyu.todolist.module.task.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 任务实体
 * <p>
 * 对应数据库 tasks 表。任务以扁平结构存储（parentId 表示父子关系），
 * 前端在内存中构建树形层级。支持优先级、状态、截止日期、重复规则等字段。
 * sortOrder 用于同层级任务的手动排序。
 */
@Data
public class Task {
    private Long id;

    private Long userId;

    private Long listId;

    private Long parentId; // 父任务ID，null 表示顶层任务

    private String title;

    private String description;

    private Integer priority = 2; // 默认中等优先级

    private Integer status = 0; // 默认未完成

    private LocalDateTime dueDate;

    private LocalDateTime startDate; // 预定日期/开始日期

    private LocalDateTime reminderTime;

    private String repeatRule; // JSON 格式的 RepeatRule

    private LocalDateTime completedAt;

    private Integer sortOrder = 0;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

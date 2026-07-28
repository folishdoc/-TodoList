package com.liuzeyu.todolist.module.list.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 清单实体
 */
@Data
public class TaskList {
    private Long id;

    private Long userId;

    private String name;

    private String color;

    private Integer sortOrder = 0;

    private Boolean isDefault = false;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

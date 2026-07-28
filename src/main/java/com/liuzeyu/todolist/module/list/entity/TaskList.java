package com.liuzeyu.todolist.module.list.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 清单实体
 * <p>
 * 对应数据库 task_lists 表。用于对任务进行分组管理（如"工作"、"生活"、"学习"）。
 * isDefault 标记默认清单（不可删除），sortOrder 控制显示顺序。
 */
@Data
public class TaskList {
    private Long id;

    private Long userId;

    private String name; // 清单名称

    private String color; // 显示颜色

    private Integer sortOrder = 0; // 排序顺序

    private Boolean isDefault = false; // 是否默认清单

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

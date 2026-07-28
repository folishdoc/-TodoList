package com.liuzeyu.todolist.module.tag.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 任务-标签关联实体类
 * <p>
 * 对应数据库 task_tags 表。实现 Task 与 Tag 的多对多关系。
 * 每条记录表示一个任务关联一个标签。
 */
@Data
public class TaskTag {

    private Long id;

    private Long taskId; // 任务 ID

    private Long tagId; // 标签 ID

    private LocalDateTime createdAt;
}

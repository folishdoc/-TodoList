package com.liuzeyu.todolist.module.tag.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 任务-标签关联实体类
 */
@Data
public class TaskTag {

    private Long id;

    private Long taskId;

    private Long tagId;

    private LocalDateTime createdAt;
}

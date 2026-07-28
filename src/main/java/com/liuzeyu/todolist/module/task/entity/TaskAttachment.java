package com.liuzeyu.todolist.module.task.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 任务附件实体
 */
@Data
public class TaskAttachment {
    
    private Long id;

    private Long taskId;

    private String fileName;

    private String filePath;

    private Long fileSize;

    private String contentType;

    private String fileUrl;

    private LocalDateTime createdAt;
}

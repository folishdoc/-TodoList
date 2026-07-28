package com.liuzeyu.todolist.module.task.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 任务附件实体
 * <p>
 * 对应数据库 task_attachments 表。记录上传文件的元信息（文件名、路径、大小、类型）。
 * 实际文件存储在服务器文件系统（uploadDir 配置），fileUrl 提供 HTTP 访问路径。
 */
@Data
public class TaskAttachment {
    
    private Long id;

    private Long taskId;

    private String fileName; // 原始文件名

    private String filePath; // 服务器存储路径

    private Long fileSize; // 文件大小（字节）

    private String contentType; // MIME 类型

    private String fileUrl; // HTTP 访问 URL

    private LocalDateTime createdAt;
}

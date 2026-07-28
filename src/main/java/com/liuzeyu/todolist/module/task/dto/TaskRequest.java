package com.liuzeyu.todolist.module.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 任务创建/更新请求 DTO
 * <p>
 * 使用 Jakarta Validation 注解进行参数校验。
 * title 为必填（@NotBlank），description 可选但限制长度。
 * parentId 用于创建子任务，null 表示顶层任务。
 */
@Data
public class TaskRequest {
    @NotBlank(message = "任务标题不能为空")
    @Size(max = 200, message = "任务标题不能超过200个字符")
    private String title;

    @Size(max = 5000, message = "任务描述不能超过5000个字符")
    private String description;

    private Long listId;

    private Long parentId; // 父任务ID，用于子任务

    private Integer priority; // 1:低, 2:中, 3:高

    private Integer status; // 0:未完成, 1:已完成

    private LocalDateTime dueDate;

    private LocalDateTime startDate; // 预定日期/开始日期

    private LocalDateTime reminderTime;

    private String repeatRule;
}

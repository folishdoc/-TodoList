package com.liuzeyu.todolist.module.task.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 任务实体
 */
@Data
@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "list_id")
    private Long listId;

    @Column(name = "parent_id")
    private Long parentId; // 父任务ID，用于子任务

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer priority = 2; // 默认中等优先级

    @Column(nullable = false)
    private Integer status = 0; // 默认未完成

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "start_date")
    private LocalDateTime startDate; // 预定日期/开始日期

    @Column(name = "reminder_time")
    private LocalDateTime reminderTime;

    @Column(name = "repeat_rule", length = 500)
    private String repeatRule;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

package com.liuzeyu.todolist.module.anniversary.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "reminder_logs")
public class ReminderLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "anniversary_id", nullable = false)
    private Long anniversaryId;

    @Column(name = "remind_datetime", nullable = false)
    private LocalDateTime remindDatetime;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

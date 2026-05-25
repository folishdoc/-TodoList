package com.liuzeyu.todolist.module.anniversary.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Entity
@Table(name = "anniversaries")
public class Anniversary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "repeat_type", length = 20)
    private String repeatType = "NONE";

    @Column(name = "remind_enabled")
    private Boolean remindEnabled = false;

    @Column(name = "remind_days_before", length = 100)
    private String remindDaysBefore = "0";

    @Column(name = "remind_time")
    private LocalTime remindTime = LocalTime.of(9, 0);

    @Column(length = 255)
    private String tags;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

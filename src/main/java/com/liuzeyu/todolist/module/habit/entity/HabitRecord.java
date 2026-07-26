package com.liuzeyu.todolist.module.habit.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 习惯打卡记录
 */
@Data
@Entity
@Table(name = "habit_records")
public class HabitRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "habit_id", nullable = false)
    private Long habitId;

    @Column(name = "check_date", nullable = false)
    private LocalDate checkDate; // 打卡日期

    @Column(name = "completion_value")
    private Double completionValue = 1.0; // 完成值（次数/时长/数量）

    @Column(columnDefinition = "TEXT")
    private String note; // 备注/心得

    @Column(name = "is_makeup")
    private Boolean isMakeup = false; // 是否补卡

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

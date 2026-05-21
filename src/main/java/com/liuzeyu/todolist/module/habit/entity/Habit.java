package com.liuzeyu.todolist.module.habit.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 习惯实体
 */
@Data
@Entity
@Table(name = "habits")
public class Habit {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name; // 习惯名称

    @Column(length = 50)
    private String icon; // 图标

    @Column(length = 7)
    private String color = "#409EFF"; // 颜色

    @Column(name = "target_type", length = 20)
    private String targetType = "count"; // 目标类型：count(次数), duration(时长), quantity(数量)

    @Column(name = "target_value")
    private Double targetValue = 1.0; // 目标值

    @Column(name = "frequency", length = 20)
    private String frequency = "daily"; // 频率：daily, weekly, weekdays, weekends, custom

    @Column(name = "custom_days")
    private String customDays; // 自定义周几：1,2,3,4,5 (周一到周日)

    @Column(name = "time_period", length = 20)
    private String timePeriod; // 执行时段：morning, afternoon, evening, all_day

    @Column(name = "start_time")
    private String startTime; // 开始时间 HH:mm

    @Column(name = "end_time")
    private String endTime; // 结束时间 HH:mm

    @Column(name = "min_completion")
    private Double minCompletion; // 最低完成量（弹性规则）

    @Column(name = "start_date")
    private LocalDateTime startDate; // 开始日期

    @Column(name = "end_date")
    private LocalDateTime endDate; // 结束日期

    @Column(name = "rest_days")
    private String restDays; // 休息日：6,0 (周六、周日)

    @Column(name = "current_streak")
    private Integer currentStreak = 0; // 当前连续天数

    @Column(name = "max_streak")
    private Integer maxStreak = 0; // 最长连续天数

    @Column(name = "total_completions")
    private Integer totalCompletions = 0; // 总完成次数

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

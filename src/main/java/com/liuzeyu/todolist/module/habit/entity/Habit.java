package com.liuzeyu.todolist.module.habit.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 习惯实体
 */
@Data
public class Habit {
    
    private Long id;

    private String name; // 习惯名称

    private String icon; // 图标

    private String color = "#409EFF"; // 颜色

    private String targetType = "count"; // 目标类型：count(次数), duration(时长), quantity(数量)

    private Double targetValue = 1.0; // 目标值

    private String frequency = "daily"; // 频率：daily, weekly, weekdays, weekends, custom

    private String customDays; // 自定义周几：1,2,3,4,5 (周一到周日)

    private String timePeriod; // 执行时段：morning, afternoon, evening, all_day

    private String startTime; // 开始时间 HH:mm

    private String endTime; // 结束时间 HH:mm

    private Double minCompletion; // 最低完成量（弹性规则）

    private LocalDateTime startDate; // 开始日期

    private LocalDateTime endDate; // 结束日期

    private String restDays; // 休息日：6,0 (周六、周日)

    private Integer currentStreak = 0; // 当前连续天数

    private Integer maxStreak = 0; // 最长连续天数

    private Integer totalCompletions = 0; // 总完成次数

    private Long userId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

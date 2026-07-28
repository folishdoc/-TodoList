package com.liuzeyu.todolist.module.habit.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 习惯打卡记录
 */
@Data
public class HabitRecord {
    
    private Long id;

    private Long habitId;

    private LocalDate checkDate; // 打卡日期

    private Double completionValue = 1.0; // 完成值（次数/时长/数量）

    private String note; // 备注/心得

    private Boolean isMakeup = false; // 是否补卡

    private Long userId;

    private LocalDateTime createdAt;
}

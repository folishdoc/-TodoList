package com.liuzeyu.todolist.module.habit.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 习惯打卡记录
 * <p>
 * 对应数据库 habit_records 表。记录每次打卡的日期、完成值、备注。
 * isMakeup 标记是否为补卡（非当天打卡）。
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

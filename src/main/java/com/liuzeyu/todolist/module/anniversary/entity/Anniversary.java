package com.liuzeyu.todolist.module.anniversary.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 纪念日实体
 * <p>
 * 对应数据库 anniversaries 表。记录重要日期（生日、纪念日等），
 * 支持重复类型（NONE/YEARLY/MONTHLY/WEEKLY）和提醒功能。
 * remindDaysBefore 为逗号分隔的天数（如 "1,3,7" 表示提前1天、3天、7天提醒）。
 */
@Data
public class Anniversary {
    private Long id;

    private Long userId;

    private String name; // 纪念日名称

    private LocalDate date; // 原始日期

    private String repeatType = "NONE"; // 重复类型：NONE, YEARLY, MONTHLY, WEEKLY

    private Boolean remindEnabled = false;

    private String remindDaysBefore = "0"; // 逗号分隔的提前提醒天数

    private LocalTime remindTime = LocalTime.of(9, 0); // 提醒时间

    private String tags; // 逗号分隔的标签

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

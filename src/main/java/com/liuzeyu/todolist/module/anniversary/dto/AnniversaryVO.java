package com.liuzeyu.todolist.module.anniversary.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 纪念日视图对象 — 包含计算后的下次日期和倒计时
 * <p>
 * 在 Anniversary 实体基础上增加 nextDate（下次发生日期）、
 * daysUntil（距离天数）、nextRemindTimes（下次提醒时间列表）等计算字段。
 */
@Data
@AllArgsConstructor
public class AnniversaryVO {
    private Long id;
    private String name;
    private LocalDate date;
    private String repeatType;
    private Boolean remindEnabled;
    private String remindDaysBefore;
    private String remindTime;
    private String tags;
    private String notes;
    private LocalDate nextDate;          // 计算出的下次日期
    private Long daysUntil;              // 距离天数（正数=未来）
    private List<LocalDateTime> nextRemindTimes; // 下次提醒时间列表
}

package com.liuzeyu.todolist.module.anniversary.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 提醒日志实体
 * <p>
 * 对应数据库 reminder_logs 表。记录纪念日提醒的触发历史，
 * 用于去重（防止同一条提醒被多次触发）和已读/未读状态管理。
 */
@Data
public class ReminderLog {
    private Long id;

    private Long anniversaryId; // 关联的纪念日 ID

    private LocalDateTime remindDatetime; // 提醒触发时间

    private Boolean isRead = false; // 是否已读

    private LocalDateTime createdAt;
}

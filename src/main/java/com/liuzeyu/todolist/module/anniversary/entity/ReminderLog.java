package com.liuzeyu.todolist.module.anniversary.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReminderLog {
    private Long id;

    private Long anniversaryId;

    private LocalDateTime remindDatetime;

    private Boolean isRead = false;

    private LocalDateTime createdAt;
}

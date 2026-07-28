package com.liuzeyu.todolist.module.anniversary.entity;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class Anniversary {
    private Long id;

    private Long userId;

    private String name;

    private LocalDate date;

    private String repeatType = "NONE";

    private Boolean remindEnabled = false;

    private String remindDaysBefore = "0";

    private LocalTime remindTime = LocalTime.of(9, 0);

    private String tags;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

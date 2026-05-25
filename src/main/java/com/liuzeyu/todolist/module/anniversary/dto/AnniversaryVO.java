package com.liuzeyu.todolist.module.anniversary.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
    private LocalDate nextDate;
    private Long daysUntil;
    private List<LocalDateTime> nextRemindTimes;
}

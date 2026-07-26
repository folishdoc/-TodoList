package com.liuzeyu.todolist.module.anniversary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AnniversaryRequest {
    @NotBlank(message = "名称不能为空")
    private String name;

    @NotNull(message = "日期不能为空")
    private LocalDate date;

    private String repeatType = "NONE";

    private Boolean remindEnabled = false;

    private String remindDaysBefore = "0";

    private LocalTime remindTime;

    private String tags;

    private String notes;
}

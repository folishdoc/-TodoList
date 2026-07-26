package com.liuzeyu.todolist.module.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 每日任务统计DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyTaskStats {
    
    private LocalDate date;     // 日期
    private Long created;       // 创建数量
    private Long completed;     // 完成数量
}

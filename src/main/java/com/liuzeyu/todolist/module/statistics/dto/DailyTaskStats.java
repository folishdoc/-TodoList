package com.liuzeyu.todolist.module.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 每日任务统计 DTO — 趋势图数据
 * <p>
 * 用于折线图展示每日创建和完成的任务数量。
 * 由 StatisticsService.getDailyTrend() 生成，按日期升序排列。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyTaskStats {
    
    private LocalDate date;     // 日期
    private Long created;       // 创建数量
    private Long completed;     // 完成数量
}

package com.liuzeyu.todolist.module.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 任务统计 DTO — 仪表盘概览数据
 * <p>
 * 包含总任务数、完成/待办数、完成率、按优先级分布、今日/未来任务数。
 * 由 StatisticsService.getTaskStatistics() 计算填充。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatistics {
    
    private Long totalTasks;          // 总任务数
    private Long completedTasks;      // 已完成任务数
    private Long pendingTasks;        // 待完成任务数
    private Double completionRate;    // 完成率（百分比）
    
    private Long highPriority;        // 高优先级任务数
    private Long mediumPriority;      // 中优先级任务数
    private Long lowPriority;         // 低优先级任务数
    
    private Long todayTasks;          // 今日任务数
    private Long upcomingTasks;       // 未来任务数
}

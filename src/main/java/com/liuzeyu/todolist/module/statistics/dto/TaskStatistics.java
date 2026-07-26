package com.liuzeyu.todolist.module.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 任务统计DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatistics {
    
    private Long totalTasks;          // 总任务数
    private Long completedTasks;      // 已完成任务数
    private Long pendingTasks;        // 待完成任务数
    private Double completionRate;    // 完成率
    
    private Long highPriority;        // 高优先级
    private Long mediumPriority;      // 中优先级
    private Long lowPriority;         // 低优先级
    
    private Long todayTasks;          // 今日任务
    private Long upcomingTasks;       // 未来任务
}

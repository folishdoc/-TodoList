package com.liuzeyu.todolist.module.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 任务分布 DTO — 按清单或优先级分组的统计数据
 * <p>
 * 用于图表展示（饼图/柱状图），包含名称、数量和颜色。
 * 由 StatisticsService.getTasksByList() / getTasksByPriority() 生成。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDistribution {
    
    private String name;      // 名称（清单名/优先级）
    private Long count;       // 数量
    private String color;     // 颜色（用于图表）
}

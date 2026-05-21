package com.liuzeyu.todolist.module.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 任务分布DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDistribution {
    
    private String name;      // 名称（清单名/优先级）
    private Long count;       // 数量
    private String color;     // 颜色（用于图表）
}

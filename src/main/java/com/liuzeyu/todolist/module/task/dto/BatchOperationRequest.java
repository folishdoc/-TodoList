package com.liuzeyu.todolist.module.task.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 批量操作DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchOperationRequest {
    
    private List<Long> taskIds;     // 任务ID列表
    private String operation;       // 操作类型：complete, delete, move, setPriority
    
    // 移动操作参数
    private Long targetListId;      // 目标清单ID
    
    // 设置优先级参数
    private Integer priority;       // 新优先级
}

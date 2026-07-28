package com.liuzeyu.todolist.module.task.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 批量操作请求 DTO
 * <p>
 * 支持四种批量操作：complete（完成）、delete（删除）、move（移动清单）、setPriority（设置优先级）。
 * taskIds 为待操作的任务 ID 列表，operation 指定操作类型。
 * targetListId 和 priority 分别为 move 和 setPriority 操作的附加参数。
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

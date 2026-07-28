package com.liuzeyu.todolist.module.task.dto;

import com.liuzeyu.todolist.module.task.entity.Task;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 任务 DTO — 包含直接子任务列表
 * <p>
 * 用于 getTasksWithSubtasks 接口，将 Task 及其直接子任务打包返回。
 * 前端根据此结构在内存中构建树形层级。子任务只包含直接子级（非递归）。
 */
@Data
@NoArgsConstructor
public class TaskWithSubtasks {
    
    private Task task;              // 主任务
    private List<Task> subtasks;    // 子任务列表
    
    public TaskWithSubtasks(Task task) {
        this.task = task;
        this.subtasks = new ArrayList<>();
    }
}

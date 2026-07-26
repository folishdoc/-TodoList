package com.liuzeyu.todolist.module.task.dto;

import com.liuzeyu.todolist.module.task.entity.Task;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 任务DTO，包含子任务
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

package com.liuzeyu.todolist.module.task.event;

import com.liuzeyu.todolist.module.task.entity.Task;
import org.springframework.context.ApplicationEvent;

/** 任务完成事件，用于触发循环任务生成下一条（解耦 TaskService 与 RepeatTaskService 的循环依赖）。 */
public class TaskCompletedEvent extends ApplicationEvent {
    private final Task task;

    public TaskCompletedEvent(Object source, Task task) {
        super(source);
        this.task = task;
    }

    public Task getTask() {
        return task;
    }
}

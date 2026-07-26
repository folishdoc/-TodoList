package com.liuzeyu.todolist.module.task.controller;

import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.task.dto.TaskRequest;
import com.liuzeyu.todolist.module.task.dto.TaskTimeRequest;
import com.liuzeyu.todolist.module.task.dto.TaskWithSubtasks;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 任务控制器
 */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "任务管理", description = "任务的增删改查接口")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @Operation(summary = "创建任务")
    public Result<Task> createTask(@AuthenticationPrincipal Long userId,
                                   @Valid @RequestBody TaskRequest request) {
        return Result.success("创建成功", taskService.createTask(userId, request));
    }

    @GetMapping
    @Operation(summary = "获取任务列表")
    public Result<Page<Task>> getTasks(@AuthenticationPrincipal Long userId,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return Result.success(taskService.getTasks(userId, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取任务详情")
    public Result<Task> getTask(@AuthenticationPrincipal Long userId,
                                @PathVariable Long id) {
        return Result.success(taskService.getTask(userId, id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新任务")
    public Result<Task> updateTask(@AuthenticationPrincipal Long userId,
                                   @PathVariable Long id,
                                   @Valid @RequestBody TaskRequest request) {
        return Result.success("更新成功", taskService.updateTask(userId, id, request));
    }

    @PatchMapping("/{id}/time")
    @Operation(summary = "更新任务时间（拖拽修改开始/截止时间）")
    public Result<Task> updateTaskTime(@AuthenticationPrincipal Long userId,
                                        @PathVariable Long id,
                                        @RequestBody TaskTimeRequest request) {
        return Result.success("时间更新成功", taskService.updateTaskTime(userId, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除任务")
    public Result<Void> deleteTask(@AuthenticationPrincipal Long userId,
                                   @PathVariable Long id) {
        taskService.deleteTask(userId, id);
        return Result.success();
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "完成任务")
    public Result<Task> completeTask(@AuthenticationPrincipal Long userId,
                                     @PathVariable Long id) {
        return Result.success("任务已完成", taskService.completeTask(userId, id));
    }

    @PatchMapping("/{id}/uncomplete")
    @Operation(summary = "取消完成任务")
    public Result<Task> uncompleteTask(@AuthenticationPrincipal Long userId,
                                       @PathVariable Long id) {
        return Result.success("已取消完成", taskService.uncompleteTask(userId, id));
    }

    @GetMapping("/today")
    @Operation(summary = "获取今日任务")
    public Result<List<Task>> getTodayTasks(@AuthenticationPrincipal Long userId) {
        return Result.success(taskService.getTodayTasks(userId));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "获取未来任务")
    public Result<List<Task>> getUpcomingTasks(@AuthenticationPrincipal Long userId) {
        return Result.success(taskService.getUpcomingTasks(userId));
    }

    @GetMapping("/search")
    @Operation(summary = "搜索任务")
    public Result<Page<Task>> searchTasks(@AuthenticationPrincipal Long userId,
                                          @RequestParam String keyword,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return Result.success(taskService.searchTasks(userId, keyword, page, size));
    }

    @GetMapping("/{id}/subtasks")
    @Operation(summary = "获取子任务列表")
    public Result<List<Task>> getSubtasks(@AuthenticationPrincipal Long userId,
                                          @PathVariable Long id) {
        return Result.success(taskService.getSubtasks(userId, id));
    }
    
    @GetMapping("/with-subtasks")
    @Operation(summary = "获取带子任务的任务列表")
    public Result<Page<TaskWithSubtasks>> getTasksWithSubtasks(@AuthenticationPrincipal Long userId,
                                                               @RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "20") int size) {
        return Result.success(taskService.getTasksWithSubtasks(userId, page, size));
    }

    @GetMapping("/range")
    @Operation(summary = "获取日期范围内的任务（日历视图用）")
    public Result<List<Task>> getTasksByDateRange(@AuthenticationPrincipal Long userId,
                                                   @RequestParam String start,
                                                   @RequestParam String end) {
        LocalDateTime rangeStart = LocalDateTime.parse(start);
        LocalDateTime rangeEnd = LocalDateTime.parse(end);
        return Result.success(taskService.getTasksByDateRange(userId, rangeStart, rangeEnd));
    }
}

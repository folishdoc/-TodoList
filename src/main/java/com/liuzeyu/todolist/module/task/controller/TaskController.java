package com.liuzeyu.todolist.module.task.controller;

import com.liuzeyu.todolist.common.result.PageResult;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 任务控制器 — 任务 CRUD 及查询接口
 * <p>
 * 路径前缀 /api/tasks，提供任务的增删改查、状态变更、今日/未来任务、
 * 搜索、子任务管理、日历范围查询等功能。
 * 所有接口需要 JWT 认证，userId 通过 @AuthenticationPrincipal 注入。
 */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "任务管理", description = "任务的增删改查接口")
public class TaskController {

    private final TaskService taskService;

    /**
     * 创建任务
     *
     * @param userId  用户 ID（从 JWT 解析）
     * @param request 任务请求体
     * @return 创建结果
     */
    @PostMapping
    @Operation(summary = "创建任务")
    public Result<Task> createTask(@AuthenticationPrincipal Long userId,
                                   @Valid @RequestBody TaskRequest request) {
        return Result.success("创建成功", taskService.createTask(userId, request));
    }

    /**
     * 获取任务列表（分页）
     *
     * @param userId 用户 ID
     * @param page   页码（默认 0）
     * @param size   每页大小（默认 20）
     * @return 分页结果
     */
    @GetMapping
    @Operation(summary = "获取任务列表")
    public Result<PageResult<Task>> getTasks(@AuthenticationPrincipal Long userId,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return Result.success(taskService.getTasks(userId, page, size));
    }

    /**
     * 获取任务详情
     *
     * @param userId 用户 ID
     * @param id     任务 ID
     * @return 任务实体
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取任务详情")
    public Result<Task> getTask(@AuthenticationPrincipal Long userId,
                                @PathVariable Long id) {
        return Result.success(taskService.getTask(userId, id));
    }

    /**
     * 更新任务
     *
     * @param userId  用户 ID
     * @param id      任务 ID
     * @param request 更新请求体
     * @return 更新后的任务
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新任务")
    public Result<Task> updateTask(@AuthenticationPrincipal Long userId,
                                   @PathVariable Long id,
                                   @Valid @RequestBody TaskRequest request) {
        return Result.success("更新成功", taskService.updateTask(userId, id, request));
    }

    /**
     * 更新任务时间（拖拽修改开始/截止时间）
     *
     * @param userId  用户 ID
     * @param id      任务 ID
     * @param request 时间更新请求
     * @return 更新后的任务
     */
    @PatchMapping("/{id}/time")
    @Operation(summary = "更新任务时间（拖拽修改开始/截止时间）")
    public Result<Task> updateTaskTime(@AuthenticationPrincipal Long userId,
                                        @PathVariable Long id,
                                        @RequestBody TaskTimeRequest request) {
        return Result.success("时间更新成功", taskService.updateTaskTime(userId, id, request));
    }

    /**
     * 删除任务
     *
     * @param userId 用户 ID
     * @param id     任务 ID
     * @return 空响应
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除任务")
    public Result<Void> deleteTask(@AuthenticationPrincipal Long userId,
                                   @PathVariable Long id) {
        taskService.deleteTask(userId, id);
        return Result.success();
    }

    /**
     * 完成任务
     *
     * @param userId 用户 ID
     * @param id     任务 ID
     * @return 更新后的任务
     */
    @PatchMapping("/{id}/complete")
    @Operation(summary = "完成任务")
    public Result<Task> completeTask(@AuthenticationPrincipal Long userId,
                                     @PathVariable Long id) {
        return Result.success("任务已完成", taskService.completeTask(userId, id));
    }

    /**
     * 取消完成任务
     *
     * @param userId 用户 ID
     * @param id     任务 ID
     * @return 更新后的任务
     */
    @PatchMapping("/{id}/uncomplete")
    @Operation(summary = "取消完成任务")
    public Result<Task> uncompleteTask(@AuthenticationPrincipal Long userId,
                                       @PathVariable Long id) {
        return Result.success("已取消完成", taskService.uncompleteTask(userId, id));
    }

    /**
     * 获取今日任务
     *
     * @param userId 用户 ID
     * @return 今日任务列表
     */
    @GetMapping("/today")
    @Operation(summary = "获取今日任务")
    public Result<List<Task>> getTodayTasks(@AuthenticationPrincipal Long userId) {
        return Result.success(taskService.getTodayTasks(userId));
    }

    /**
     * 获取未来任务
     *
     * @param userId 用户 ID
     * @return 未来任务列表
     */
    @GetMapping("/upcoming")
    @Operation(summary = "获取未来任务")
    public Result<List<Task>> getUpcomingTasks(@AuthenticationPrincipal Long userId) {
        return Result.success(taskService.getUpcomingTasks(userId));
    }

    /**
     * 搜索任务
     *
     * @param userId  用户 ID
     * @param keyword 关键词
     * @param page    页码
     * @param size    每页大小
     * @return 分页结果
     */
    @GetMapping("/search")
    @Operation(summary = "搜索任务")
    public Result<PageResult<Task>> searchTasks(@AuthenticationPrincipal Long userId,
                                                @RequestParam String keyword,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        return Result.success(taskService.searchTasks(userId, keyword, page, size));
    }

    /**
     * 获取子任务列表
     *
     * @param userId 用户 ID
     * @param id     父任务 ID
     * @return 直接子任务列表
     */
    @GetMapping("/{id}/subtasks")
    @Operation(summary = "获取子任务列表")
    public Result<List<Task>> getSubtasks(@AuthenticationPrincipal Long userId,
                                          @PathVariable Long id) {
        return Result.success(taskService.getSubtasks(userId, id));
    }
    
    /**
     * 获取带子任务的任务列表（分页）
     *
     * @param userId 用户 ID
     * @param page   页码
     * @param size   每页大小
     * @return 分页结果（含子任务）
     */
    @GetMapping("/with-subtasks")
    @Operation(summary = "获取带子任务的任务列表")
    public Result<PageResult<TaskWithSubtasks>> getTasksWithSubtasks(@AuthenticationPrincipal Long userId,
                                                                      @RequestParam(defaultValue = "0") int page,
                                                                      @RequestParam(defaultValue = "20") int size) {
        return Result.success(taskService.getTasksWithSubtasks(userId, page, size));
    }

    /**
     * 获取日期范围内的任务（日历视图用）
     *
     * @param userId 用户 ID
     * @param start  范围开始（ISO 格式）
     * @param end    范围结束（ISO 格式）
     * @return 任务列表
     */
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

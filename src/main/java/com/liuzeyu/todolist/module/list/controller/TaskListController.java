package com.liuzeyu.todolist.module.list.controller;

import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.list.dto.TaskListRequest;
import com.liuzeyu.todolist.module.list.entity.TaskList;
import com.liuzeyu.todolist.module.list.service.TaskListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 清单控制器
 */
@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
@Tag(name = "清单管理", description = "清单的增删改查接口")
public class TaskListController {

    private final TaskListService taskListService;

    @PostMapping
    @Operation(summary = "创建清单")
    public Result<TaskList> createTaskList(@AuthenticationPrincipal Long userId,
                                           @Valid @RequestBody TaskListRequest request) {
        return Result.success("创建成功", taskListService.createTaskList(userId, request));
    }

    @GetMapping
    @Operation(summary = "获取清单列表")
    public Result<List<TaskList>> getTaskLists(@AuthenticationPrincipal Long userId) {
        return Result.success(taskListService.getTaskLists(userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取清单详情")
    public Result<TaskList> getTaskList(@AuthenticationPrincipal Long userId,
                                        @PathVariable Long id) {
        return Result.success(taskListService.getTaskList(userId, id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新清单")
    public Result<TaskList> updateTaskList(@AuthenticationPrincipal Long userId,
                                           @PathVariable Long id,
                                           @Valid @RequestBody TaskListRequest request) {
        return Result.success("更新成功", taskListService.updateTaskList(userId, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除清单")
    public Result<Void> deleteTaskList(@AuthenticationPrincipal Long userId,
                                       @PathVariable Long id) {
        taskListService.deleteTaskList(userId, id);
        return Result.success();
    }
}

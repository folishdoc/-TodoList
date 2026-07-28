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
 * 清单控制器 — 清单 CRUD 接口
 * <p>
 * 路径前缀 /api/lists。提供清单的增删改查功能。
 */
@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
@Tag(name = "清单管理", description = "清单的增删改查接口")
public class TaskListController {

    private final TaskListService taskListService;

    /**
     * 创建清单
     *
     * @param userId  用户 ID
     * @param request 清单请求
     * @return 创建后的清单
     */
    @PostMapping
    @Operation(summary = "创建清单")
    public Result<TaskList> createTaskList(@AuthenticationPrincipal Long userId,
                                           @Valid @RequestBody TaskListRequest request) {
        return Result.success("创建成功", taskListService.createTaskList(userId, request));
    }

    /**
     * 获取清单列表
     *
     * @param userId 用户 ID
     * @return 清单列表
     */
    @GetMapping
    @Operation(summary = "获取清单列表")
    public Result<List<TaskList>> getTaskLists(@AuthenticationPrincipal Long userId) {
        return Result.success(taskListService.getTaskLists(userId));
    }

    /**
     * 获取清单详情
     *
     * @param userId 用户 ID
     * @param id     清单 ID
     * @return 清单实体
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取清单详情")
    public Result<TaskList> getTaskList(@AuthenticationPrincipal Long userId,
                                        @PathVariable Long id) {
        return Result.success(taskListService.getTaskList(userId, id));
    }

    /**
     * 更新清单
     *
     * @param userId  用户 ID
     * @param id      清单 ID
     * @param request 更新请求
     * @return 更新后的清单
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新清单")
    public Result<TaskList> updateTaskList(@AuthenticationPrincipal Long userId,
                                           @PathVariable Long id,
                                           @Valid @RequestBody TaskListRequest request) {
        return Result.success("更新成功", taskListService.updateTaskList(userId, id, request));
    }

    /**
     * 删除清单
     *
     * @param userId 用户 ID
     * @param id     清单 ID
     * @return 空响应
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除清单")
    public Result<Void> deleteTaskList(@AuthenticationPrincipal Long userId,
                                       @PathVariable Long id) {
        taskListService.deleteTaskList(userId, id);
        return Result.success();
    }
}

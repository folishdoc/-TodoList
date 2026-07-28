package com.liuzeyu.todolist.module.task.controller;

import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.task.dto.BatchOperationRequest;
import com.liuzeyu.todolist.module.task.service.BatchOperationService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 批量操作控制器 — 批量完成/删除/移动/设置优先级
 * <p>
 * 路径前缀 /api/tasks/batch。提供通用 execute 接口和四个便捷接口。
 * 所有操作先验证任务归属权再执行。
 */
@RestController
@RequestMapping("/api/tasks/batch")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "批量操作", description = "任务批量操作接口")
public class BatchOperationController {

    private final BatchOperationService batchOperationService;

    /**
     * 执行批量操作（通用接口，由请求中的 operation 字段指定类型）
     *
     * @param userId  用户 ID
     * @param request 批量操作请求
     * @return 受影响的任务数
     */
    @PostMapping("/execute")
    @Operation(summary = "执行批量操作")
    public Result<Integer> executeBatch(
            @AuthenticationPrincipal Long userId,
            @RequestBody BatchOperationRequest request) {
        try {
            int count = batchOperationService.executeBatchOperation(userId, request);
            return Result.success(count);
        } catch (IllegalArgumentException e) {
            return Result.error(e.getMessage());
        } catch (Exception e) {
            return Result.error("批量操作失败: " + e.getMessage());
        }
    }

    /**
     * 批量完成任务
     *
     * @param userId  用户 ID
     * @param request 请求（需包含 taskIds）
     * @return 完成的任务数
     */
    @PostMapping("/complete")
    @Operation(summary = "批量完成任务")
    public Result<Integer> batchComplete(
            @AuthenticationPrincipal Long userId,
            @RequestBody BatchOperationRequest request) {
        request.setOperation("complete");
        try {
            int count = batchOperationService.executeBatchOperation(userId, request);
            return Result.success(count);
        } catch (Exception e) {
            return Result.error("批量完成失败: " + e.getMessage());
        }
    }

    /**
     * 批量删除任务
     *
     * @param userId  用户 ID
     * @param request 请求（需包含 taskIds）
     * @return 删除的任务数
     */
    @PostMapping("/delete")
    @Operation(summary = "批量删除任务")
    public Result<Integer> batchDelete(
            @AuthenticationPrincipal Long userId,
            @RequestBody BatchOperationRequest request) {
        request.setOperation("delete");
        try {
            int count = batchOperationService.executeBatchOperation(userId, request);
            return Result.success(count);
        } catch (Exception e) {
            return Result.error("批量删除失败: " + e.getMessage());
        }
    }

    /**
     * 批量移动任务到指定清单
     *
     * @param userId  用户 ID
     * @param request 请求（需包含 taskIds 和 targetListId）
     * @return 移动的任务数
     */
    @PostMapping("/move")
    @Operation(summary = "批量移动任务")
    public Result<Integer> batchMove(
            @AuthenticationPrincipal Long userId,
            @RequestBody BatchOperationRequest request) {
        request.setOperation("move");
        try {
            int count = batchOperationService.executeBatchOperation(userId, request);
            return Result.success(count);
        } catch (Exception e) {
            return Result.error("批量移动失败: " + e.getMessage());
        }
    }

    /**
     * 批量设置优先级
     *
     * @param userId  用户 ID
     * @param request 请求（需包含 taskIds 和 priority）
     * @return 更新的任务数
     */
    @PostMapping("/set-priority")
    @Operation(summary = "批量设置优先级")
    public Result<Integer> batchSetPriority(
            @AuthenticationPrincipal Long userId,
            @RequestBody BatchOperationRequest request) {
        request.setOperation("setPriority");
        try {
            int count = batchOperationService.executeBatchOperation(userId, request);
            return Result.success(count);
        } catch (Exception e) {
            return Result.error("批量设置优先级失败: " + e.getMessage());
        }
    }
}

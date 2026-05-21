package com.liuzeyu.todolist.module.task.controller;

import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.task.dto.BatchOperationRequest;
import com.liuzeyu.todolist.module.task.service.BatchOperationService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 批量操作控制器
 */
@RestController
@RequestMapping("/api/tasks/batch")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "批量操作", description = "任务批量操作接口")
public class BatchOperationController {

    private final BatchOperationService batchOperationService;

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

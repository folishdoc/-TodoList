package com.liuzeyu.todolist.module.task.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.task.dto.RepeatRule;
import com.liuzeyu.todolist.module.task.service.RepeatTaskService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 重复任务控制器 — 设置/取消重复规则，手动触发生成
 * <p>
 * 路径前缀 /api/tasks/repeat。重复规则的自动生成由 RepeatTaskService 的定时任务处理，
 * 此控制器提供手动管理和触发接口。
 */
@RestController
@RequestMapping("/api/tasks/repeat")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "重复任务", description = "重复任务相关接口")
public class RepeatTaskController {

    private final RepeatTaskService repeatTaskService;

    /**
     * 设置任务重复规则
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     * @param rule   重复规则
     * @return 空响应
     */
    @PostMapping("/{taskId}")
    @Operation(summary = "设置任务重复规则")
    public Result<Void> setRepeatRule(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long taskId,
            @RequestBody RepeatRule rule) {
        try {
            repeatTaskService.setRepeatRule(userId, taskId, rule);
            return Result.success(null);
        } catch (JsonProcessingException e) {
            return Result.error("设置重复规则失败: " + e.getMessage());
        }
    }

    /**
     * 取消任务重复规则
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     * @return 空响应
     */
    @DeleteMapping("/{taskId}")
    @Operation(summary = "取消任务重复规则")
    public Result<Void> cancelRepeatRule(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long taskId) {
        repeatTaskService.cancelRepeatRule(userId, taskId);
        return Result.success(null);
    }

    /**
     * 手动生成重复任务（测试用）
     *
     * @param userId 用户 ID
     * @return 空响应
     */
    @PostMapping("/generate")
    @Operation(summary = "手动生成重复任务（测试用）")
    public Result<Void> generateRepeatTasks(
            @AuthenticationPrincipal Long userId) {
        repeatTaskService.generateRepeatTasks(userId);
        return Result.success(null);
    }
}

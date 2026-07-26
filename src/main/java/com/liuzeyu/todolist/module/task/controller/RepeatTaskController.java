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
 * 重复任务控制器
 */
@RestController
@RequestMapping("/api/tasks/repeat")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "重复任务", description = "重复任务相关接口")
public class RepeatTaskController {

    private final RepeatTaskService repeatTaskService;

    @PostMapping("/{taskId}")
    @Operation(summary = "设置任务重复规则")
    public Result<Void> setRepeatRule(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long taskId,
            @RequestBody RepeatRule rule) {
        try {
            repeatTaskService.setRepeatRule(taskId, rule);
            return Result.success(null);
        } catch (JsonProcessingException e) {
            return Result.error("设置重复规则失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{taskId}")
    @Operation(summary = "取消任务重复规则")
    public Result<Void> cancelRepeatRule(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long taskId) {
        repeatTaskService.cancelRepeatRule(taskId);
        return Result.success(null);
    }

    @PostMapping("/generate")
    @Operation(summary = "手动生成重复任务（测试用）")
    public Result<Void> generateRepeatTasks() {
        repeatTaskService.generateRepeatTasks();
        return Result.success(null);
    }
}

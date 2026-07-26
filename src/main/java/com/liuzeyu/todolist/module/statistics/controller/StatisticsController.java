package com.liuzeyu.todolist.module.statistics.controller;

import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.statistics.dto.DailyTaskStats;
import com.liuzeyu.todolist.module.statistics.dto.TaskDistribution;
import com.liuzeyu.todolist.module.statistics.dto.TaskStatistics;
import com.liuzeyu.todolist.module.statistics.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 统计控制器
 */
@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "数据统计", description = "统计相关接口")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/overview")
    @Operation(summary = "获取任务总体统计")
    public Result<TaskStatistics> getOverview(@AuthenticationPrincipal Long userId) {
        TaskStatistics stats = statisticsService.getTaskStatistics(userId);
        return Result.success(stats);
    }

    @GetMapping("/by-list")
    @Operation(summary = "获取按清单分布的任务统计")
    public Result<List<TaskDistribution>> getByList(@AuthenticationPrincipal Long userId) {
        List<TaskDistribution> distribution = statisticsService.getTasksByList(userId);
        return Result.success(distribution);
    }

    @GetMapping("/by-priority")
    @Operation(summary = "获取按优先级分布的任务统计")
    public Result<List<TaskDistribution>> getByPriority(@AuthenticationPrincipal Long userId) {
        List<TaskDistribution> distribution = statisticsService.getTasksByPriority(userId);
        return Result.success(distribution);
    }

    @GetMapping("/trend")
    @Operation(summary = "获取任务趋势")
    public Result<List<DailyTaskStats>> getTrend(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "7") int days) {
        List<DailyTaskStats> trend = statisticsService.getDailyTrend(userId, days);
        return Result.success(trend);
    }
}

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
 * 统计控制器 — 仪表盘数据接口
 * <p>
 * 路径前缀 /api/statistics。提供任务总体统计、按清单/优先级分布、
 * 每日趋势等数据，供前端图表组件使用。
 */
@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "数据统计", description = "统计相关接口")
public class StatisticsController {

    private final StatisticsService statisticsService;

    /**
     * 获取任务总体统计
     *
     * @param userId 用户 ID
     * @return 任务统计
     */
    @GetMapping("/overview")
    @Operation(summary = "获取任务总体统计")
    public Result<TaskStatistics> getOverview(@AuthenticationPrincipal Long userId) {
        TaskStatistics stats = statisticsService.getTaskStatistics(userId);
        return Result.success(stats);
    }

    /**
     * 获取按清单分布的任务统计
     *
     * @param userId 用户 ID
     * @return 分布列表
     */
    @GetMapping("/by-list")
    @Operation(summary = "获取按清单分布的任务统计")
    public Result<List<TaskDistribution>> getByList(@AuthenticationPrincipal Long userId) {
        List<TaskDistribution> distribution = statisticsService.getTasksByList(userId);
        return Result.success(distribution);
    }

    /**
     * 获取按优先级分布的任务统计
     *
     * @param userId 用户 ID
     * @return 分布列表
     */
    @GetMapping("/by-priority")
    @Operation(summary = "获取按优先级分布的任务统计")
    public Result<List<TaskDistribution>> getByPriority(@AuthenticationPrincipal Long userId) {
        List<TaskDistribution> distribution = statisticsService.getTasksByPriority(userId);
        return Result.success(distribution);
    }

    /**
     * 获取任务趋势
     *
     * @param userId 用户 ID
     * @param days   天数（默认 7）
     * @return 每日统计列表
     */
    @GetMapping("/trend")
    @Operation(summary = "获取任务趋势")
    public Result<List<DailyTaskStats>> getTrend(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "7") int days) {
        List<DailyTaskStats> trend = statisticsService.getDailyTrend(userId, days);
        return Result.success(trend);
    }
}

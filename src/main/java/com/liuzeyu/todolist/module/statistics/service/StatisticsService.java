package com.liuzeyu.todolist.module.statistics.service;

import com.liuzeyu.todolist.module.list.entity.TaskList;
import com.liuzeyu.todolist.module.list.service.TaskListService;
import com.liuzeyu.todolist.module.statistics.dto.DailyTaskStats;
import com.liuzeyu.todolist.module.statistics.dto.TaskDistribution;
import com.liuzeyu.todolist.module.statistics.dto.TaskStatistics;
import com.liuzeyu.todolist.module.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 统计服务类 — 仪表盘数据聚合
 * <p>
 * 提供任务总体统计、按清单/优先级分布统计、每日趋势统计。
 * 数据来源于 TaskService / TaskListService 的委托查询。
 */
@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final TaskService taskService;
    private final TaskListService taskListService;

    /**
     * 获取任务总体统计
     * <p>
     * 包括总数、完成数、待办数、完成率、优先级分布、今日/未来任务数。
     *
     * @param userId 用户 ID
     * @return 任务统计
     */
    public TaskStatistics getTaskStatistics(Long userId) {
        long totalTasks = taskService.countByUserId(userId);
        long completedTasks = taskService.countByUserIdAndStatus(userId, 1);
        long pendingTasks = totalTasks - completedTasks;
        double completionRate = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0;

        List<Map<String, Object>> priorityCounts = taskService.countByUserIdGroupByPriority(userId);
        long highPriority = 0, mediumPriority = 0, lowPriority = 0;
        for (Map<String, Object> row : priorityCounts) {
            Integer priority = (Integer) row.get("key");
            Long count = (Long) row.get("value");
            if (priority == 3) highPriority = count;
            else if (priority == 2) mediumPriority = count;
            else if (priority == 1) lowPriority = count;
        }

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
        long todayTasks = taskService.countByUserIdAndDueDateBetween(userId, startOfDay, endOfDay);

        long upcomingTasks = taskService.countByUserIdAndDueDateAfter(userId, endOfDay);

        return new TaskStatistics(
            totalTasks, completedTasks, pendingTasks, completionRate,
            highPriority, mediumPriority, lowPriority,
            todayTasks, upcomingTasks
        );
    }

    /**
     * 获取按清单分布的任务统计
     * <p>
     * 只返回有任务（count > 0）的清单，每个清单分配一个颜色用于图表。
     *
     * @param userId 用户 ID
     * @return 分布列表
     */
    public List<TaskDistribution> getTasksByList(Long userId) {
        List<TaskList> lists = taskListService.getTaskLists(userId);
        List<Map<String, Object>> countByList = taskService.countByUserIdGroupByListId(userId);

        java.util.Map<Long, Long> countMap = new java.util.HashMap<>();
        for (Map<String, Object> row : countByList) {
            countMap.put((Long) row.get("key"), (Long) row.get("value"));
        }

        List<TaskDistribution> distributions = new ArrayList<>();
        String[] colors = {"#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"};
        int colorIndex = 0;

        for (TaskList list : lists) {
            Long count = countMap.getOrDefault(list.getId(), 0L);
            if (count > 0) {
                distributions.add(new TaskDistribution(
                    list.getName(),
                    count,
                    colors[colorIndex++ % colors.length]
                ));
            }
        }

        return distributions;
    }

    /**
     * 获取按优先级分布的任务统计
     *
     * @param userId 用户 ID
     * @return 分布列表
     */
    public List<TaskDistribution> getTasksByPriority(Long userId) {
        List<Map<String, Object>> priorityCounts = taskService.countByUserIdGroupByPriority(userId);

        List<TaskDistribution> distributions = new ArrayList<>();
        for (Map<String, Object> row : priorityCounts) {
            Integer priority = (Integer) row.get("key");
            Long count = (Long) row.get("value");
            if (priority == 3 && count > 0) distributions.add(new TaskDistribution("高优先级", count, "#FF6B6B"));
            else if (priority == 2 && count > 0) distributions.add(new TaskDistribution("中优先级", count, "#4ECDC4"));
            else if (priority == 1 && count > 0) distributions.add(new TaskDistribution("低优先级", count, "#45B7D1"));
        }

        return distributions;
    }

    /**
     * 获取近 N 天任务趋势
     * <p>
     * 按日期升序返回每日创建和完成的任务数量，无数据的日期补 0。
     *
     * @param userId 用户 ID
     * @param days   天数（默认 7）
     * @return 每日统计列表
     */
    public List<DailyTaskStats> getDailyTrend(Long userId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);
        LocalDateTime startDateTime = startDate.atStartOfDay();

        List<Map<String, Object>> createdRaw = taskService.countCreatedByDateAfter(userId, startDateTime);
        List<Map<String, Object>> completedRaw = taskService.countCompletedByDateAfter(userId, startDateTime);

        java.util.Map<LocalDate, Long> createdMap = new java.util.HashMap<>();
        for (Map<String, Object> row : createdRaw) {
            Object key = row.get("key");
            LocalDate date = key instanceof java.sql.Date ? ((java.sql.Date) key).toLocalDate() : (LocalDate) key;
            createdMap.put(date, (Long) row.get("value"));
        }
        java.util.Map<LocalDate, Long> completedMap = new java.util.HashMap<>();
        for (Map<String, Object> row : completedRaw) {
            Object key = row.get("key");
            LocalDate date = key instanceof java.sql.Date ? ((java.sql.Date) key).toLocalDate() : (LocalDate) key;
            completedMap.put(date, (Long) row.get("value"));
        }

        List<DailyTaskStats> trend = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            trend.add(new DailyTaskStats(
                date,
                createdMap.getOrDefault(date, 0L),
                completedMap.getOrDefault(date, 0L)
            ));
        }

        return trend;
    }
}

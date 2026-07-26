package com.liuzeyu.todolist.module.statistics.service;

import com.liuzeyu.todolist.module.list.entity.TaskList;
import com.liuzeyu.todolist.module.list.mapper.TaskListRepository;
import com.liuzeyu.todolist.module.statistics.dto.DailyTaskStats;
import com.liuzeyu.todolist.module.statistics.dto.TaskDistribution;
import com.liuzeyu.todolist.module.statistics.dto.TaskStatistics;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 统计服务类
 */
@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final TaskRepository taskRepository;
    private final TaskListRepository taskListRepository;

    /**
     * 获取任务总体统计
     */
    public TaskStatistics getTaskStatistics(Long userId) {
        long totalTasks = taskRepository.countByUserId(userId);
        long completedTasks = taskRepository.countByUserIdAndStatus(userId, 1);
        long pendingTasks = totalTasks - completedTasks;
        double completionRate = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0;

        List<Object[]> priorityCounts = taskRepository.countByUserIdGroupByPriority(userId);
        long highPriority = 0, mediumPriority = 0, lowPriority = 0;
        for (Object[] row : priorityCounts) {
            Integer priority = (Integer) row[0];
            Long count = (Long) row[1];
            if (priority == 3) highPriority = count;
            else if (priority == 2) mediumPriority = count;
            else if (priority == 1) lowPriority = count;
        }

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
        long todayTasks = taskRepository.countByUserIdAndDueDateBetween(userId, startOfDay, endOfDay);

        long upcomingTasks = taskRepository.countByUserIdAndDueDateAfter(userId, endOfDay);

        return new TaskStatistics(
            totalTasks, completedTasks, pendingTasks, completionRate,
            highPriority, mediumPriority, lowPriority,
            todayTasks, upcomingTasks
        );
    }

    /**
     * 获取按清单分布的任务统计
     */
    public List<TaskDistribution> getTasksByList(Long userId) {
        List<TaskList> lists = taskListRepository.findByUserId(userId);
        List<Object[]> countByList = taskRepository.countByUserIdGroupByListId(userId);

        java.util.Map<Long, Long> countMap = new java.util.HashMap<>();
        for (Object[] row : countByList) {
            countMap.put((Long) row[0], (Long) row[1]);
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
     */
    public List<TaskDistribution> getTasksByPriority(Long userId) {
        List<Object[]> priorityCounts = taskRepository.countByUserIdGroupByPriority(userId);

        List<TaskDistribution> distributions = new ArrayList<>();
        for (Object[] row : priorityCounts) {
            Integer priority = (Integer) row[0];
            Long count = (Long) row[1];
            if (priority == 3 && count > 0) distributions.add(new TaskDistribution("高优先级", count, "#FF6B6B"));
            else if (priority == 2 && count > 0) distributions.add(new TaskDistribution("中优先级", count, "#4ECDC4"));
            else if (priority == 1 && count > 0) distributions.add(new TaskDistribution("低优先级", count, "#45B7D1"));
        }

        return distributions;
    }

    /**
     * 获取近7天任务趋势
     */
    public List<DailyTaskStats> getDailyTrend(Long userId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);
        LocalDateTime startDateTime = startDate.atStartOfDay();

        List<Object[]> createdRaw = taskRepository.countCreatedByDateAfter(userId, startDateTime);
        List<Object[]> completedRaw = taskRepository.countCompletedByDateAfter(userId, startDateTime);

        java.util.Map<LocalDate, Long> createdMap = new java.util.HashMap<>();
        for (Object[] row : createdRaw) {
            LocalDate date = row[0] instanceof java.sql.Date ? ((java.sql.Date) row[0]).toLocalDate() : (LocalDate) row[0];
            createdMap.put(date, (Long) row[1]);
        }
        java.util.Map<LocalDate, Long> completedMap = new java.util.HashMap<>();
        for (Object[] row : completedRaw) {
            LocalDate date = row[0] instanceof java.sql.Date ? ((java.sql.Date) row[0]).toLocalDate() : (LocalDate) row[0];
            completedMap.put(date, (Long) row[1]);
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

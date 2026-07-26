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
        List<Task> allTasks = taskRepository.findAllByUserId(userId);
        
        long totalTasks = allTasks.size();
        long completedTasks = allTasks.stream().filter(t -> t.getStatus() == 1).count();
        long pendingTasks = totalTasks - completedTasks;
        double completionRate = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0;
        
        long highPriority = allTasks.stream().filter(t -> t.getPriority() == 3).count();
        long mediumPriority = allTasks.stream().filter(t -> t.getPriority() == 2).count();
        long lowPriority = allTasks.stream().filter(t -> t.getPriority() == 1).count();
        
        LocalDate today = LocalDate.now();
        long todayTasks = allTasks.stream()
            .filter(t -> t.getDueDate() != null && t.getDueDate().toLocalDate().equals(today))
            .count();
        
        long upcomingTasks = allTasks.stream()
            .filter(t -> t.getDueDate() != null && t.getDueDate().toLocalDate().isAfter(today))
            .count();
        
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
        List<Task> allTasks = taskRepository.findAllByUserId(userId);
        
        Map<Long, Long> countByList = allTasks.stream()
            .filter(t -> t.getListId() != null)
            .collect(Collectors.groupingBy(Task::getListId, Collectors.counting()));
        
        List<TaskDistribution> distributions = new ArrayList<>();
        String[] colors = {"#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"};
        int colorIndex = 0;
        
        for (TaskList list : lists) {
            long count = countByList.getOrDefault(list.getId(), 0L);
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
        List<Task> allTasks = taskRepository.findAllByUserId(userId);
        
        long high = allTasks.stream().filter(t -> t.getPriority() == 3).count();
        long medium = allTasks.stream().filter(t -> t.getPriority() == 2).count();
        long low = allTasks.stream().filter(t -> t.getPriority() == 1).count();
        
        List<TaskDistribution> distributions = new ArrayList<>();
        if (high > 0) distributions.add(new TaskDistribution("高优先级", high, "#FF6B6B"));
        if (medium > 0) distributions.add(new TaskDistribution("中优先级", medium, "#4ECDC4"));
        if (low > 0) distributions.add(new TaskDistribution("低优先级", low, "#45B7D1"));
        
        return distributions;
    }

    /**
     * 获取近7天任务趋势
     */
    public List<DailyTaskStats> getDailyTrend(Long userId, int days) {
        List<Task> allTasks = taskRepository.findAllByUserId(userId);
        List<DailyTaskStats> trend = new ArrayList<>();
        
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
            
            long created = allTasks.stream()
                .filter(t -> t.getCreatedAt() != null 
                    && !t.getCreatedAt().isBefore(startOfDay) 
                    && t.getCreatedAt().isBefore(endOfDay))
                .count();
            
            long completed = allTasks.stream()
                .filter(t -> t.getCompletedAt() != null 
                    && !t.getCompletedAt().isBefore(startOfDay) 
                    && t.getCompletedAt().isBefore(endOfDay))
                .count();
            
            trend.add(new DailyTaskStats(date, created, completed));
        }
        
        return trend;
    }
}

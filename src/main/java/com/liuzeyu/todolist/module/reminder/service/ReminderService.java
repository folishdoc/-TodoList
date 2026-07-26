package com.liuzeyu.todolist.module.reminder.service;

import com.liuzeyu.todolist.common.constant.TaskStatusEnum;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 任务提醒服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderService {

    private final TaskRepository taskRepository;

    /**
     * 每分钟检查即将到期的任务
     */
    @Scheduled(cron = "0 * * * * ?")
    public void checkDueTasks() {
        log.info("开始检查即将到期的任务...");
        Long userId = 1L;
        List<Task> upcomingTasks = getUpcomingDueTasks(userId);
        if (upcomingTasks.isEmpty()) {
            log.info("没有即将到期的任务");
        } else {
            log.info("发现 {} 个即将到期的任务:", upcomingTasks.size());
            for (Task task : upcomingTasks) {
                log.info("  任务: id={}, title={}, 截止时间={}", task.getId(), task.getTitle(), task.getDueDate());
            }
        }
        log.info("提醒检查完成");
    }

    /**
     * 获取即将到期的任务（1小时内）
     */
    public List<Task> getUpcomingDueTasks(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourLater = now.plusHours(1);
        
        return taskRepository.findAllByUserId(userId).stream()
            .filter(task -> task.getStatus() == TaskStatusEnum.INCOMPLETE.getCode()) // 未完成
            .filter(task -> task.getDueDate() != null)
            .filter(task -> !task.getDueDate().isBefore(now))
            .filter(task -> task.getDueDate().isBefore(oneHourLater))
            .toList();
    }
}

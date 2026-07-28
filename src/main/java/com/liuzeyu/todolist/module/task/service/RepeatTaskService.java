package com.liuzeyu.todolist.module.task.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.liuzeyu.todolist.common.constant.TaskStatusEnum;
import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.task.dto.RepeatRule;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 重复任务服务
 */
@Slf4j
@Service
public class RepeatTaskService {

    private final TaskMapper taskMapper;
    private final ObjectMapper objectMapper;
    private LocalDate lastGenerateDate = null;

    public RepeatTaskService(TaskMapper taskMapper) {
        this.taskMapper = taskMapper;
        this.objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * 每天凌晨检查并生成重复任务（处理所有用户）
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void scheduledGenerateRepeatTasks() {
        LocalDate today = LocalDate.now();
        if (today.equals(lastGenerateDate)) {
            log.info("今天已生成过重复任务，跳过");
            return;
        }

        log.info("开始定时生成重复任务...");
        
        LocalDateTime now = LocalDateTime.now();
        List<Task> allTasks = taskMapper.findAll();
        
        int generatedCount = 0;
        
        for (Task task : allTasks) {
            if (task.getRepeatRule() != null && !task.getRepeatRule().isEmpty()) {
                try {
                    RepeatRule rule = objectMapper.readValue(task.getRepeatRule(), RepeatRule.class);

                    if (shouldGenerateNewTask(task, rule, now)) {
                        Task newTask = createRepeatedTask(task, rule);
                        taskMapper.insert(newTask);
                        generatedCount++;

                        log.info("生成重复任务: {} -> {}", task.getTitle(), newTask.getTitle());
                    }

                    // 检查循环结束日期是否临近（7天内）
                    checkEndDateApproaching(task, rule, now);
                } catch (JsonProcessingException e) {
                    log.error("解析重复规则失败: taskId={}", task.getId(), e);
                }
            }
        }

        log.info("重复任务生成完成，共生成 {} 个新任务", generatedCount);

        lastGenerateDate = today;
    }

    /**
     * 为指定用户生成重复任务
     */
    @Transactional
    public void generateRepeatTasks(Long userId) {
        log.info("开始为用户 {} 生成重复任务...", userId);

        LocalDateTime now = LocalDateTime.now();
        List<Task> userTasks = taskMapper.findAllByUserId(userId);

        int generatedCount = 0;

        for (Task task : userTasks) {
            if (task.getRepeatRule() != null && !task.getRepeatRule().isEmpty()) {
                try {
                    RepeatRule rule = objectMapper.readValue(task.getRepeatRule(), RepeatRule.class);

                    if (shouldGenerateNewTask(task, rule, now)) {
                        Task newTask = createRepeatedTask(task, rule);
                        taskMapper.insert(newTask);
                        generatedCount++;

                        log.info("生成重复任务: {} -> {}", task.getTitle(), newTask.getTitle());
                    }

                    // 检查循环结束日期是否临近（7天内）
                    checkEndDateApproaching(task, rule, now);
                } catch (JsonProcessingException e) {
                    log.error("解析重复规则失败: taskId={}", task.getId(), e);
                }
            }
        }

        log.info("用户 {} 重复任务生成完成，共生成 {} 个新任务", userId, generatedCount);
    }

    /**
     * 判断是否应该生成新任务
     */
    private boolean shouldGenerateNewTask(Task task, RepeatRule rule, LocalDateTime now) {
        // 如果任务未完成，不生成新任务
        if (task.getStatus() == TaskStatusEnum.INCOMPLETE.getCode()) {
            return false;
        }
        
        // 检查是否超过结束日期
        if (rule.getEndDate() != null && now.isAfter(rule.getEndDate())) {
            return false;
        }
        
        // 简单实现：每次完成后都生成新任务（不限制次数）
        return true;
    }

    /**
     * 检查循环结束日期是否临近（7天内），如果是则记录提醒
     */
    private void checkEndDateApproaching(Task task, RepeatRule rule, LocalDateTime now) {
        if (rule.getEndDate() == null) return;

        LocalDateTime endDate = rule.getEndDate();
        long daysUntilEnd = java.time.Duration.between(now, endDate).toDays();

        if (daysUntilEnd >= 0 && daysUntilEnd <= 7) {
            log.info("循环即将结束: taskId={}, title={}, 剩余{}天, endDate={}",
                task.getId(), task.getTitle(), daysUntilEnd, endDate);
        }
    }

    /**
     * 创建重复任务
     */
    private Task createRepeatedTask(Task originalTask, RepeatRule rule) {
        Task newTask = new Task();
        newTask.setUserId(originalTask.getUserId());
        newTask.setListId(originalTask.getListId());
        newTask.setTitle(originalTask.getTitle());
        newTask.setDescription(originalTask.getDescription());
        newTask.setPriority(originalTask.getPriority());
        newTask.setStatus(TaskStatusEnum.INCOMPLETE.getCode()); // 未完成
        newTask.setSortOrder(originalTask.getSortOrder());
        newTask.setRepeatRule(originalTask.getRepeatRule());
        
        // 计算新的截止日期
        LocalDateTime newDueDate = calculateNextDueDate(originalTask.getDueDate(), rule);
        newTask.setDueDate(newDueDate);
        
        // 设置提醒时间
        if (originalTask.getReminderTime() != null) {
            LocalDateTime newReminderTime = calculateNextDueDate(originalTask.getReminderTime(), rule);
            newTask.setReminderTime(newReminderTime);
        }
        
        return newTask;
    }

    /**
     * 计算下一个截止日期
     */
    private LocalDateTime calculateNextDueDate(LocalDateTime currentDueDate, RepeatRule rule) {
        if (currentDueDate == null) {
            return LocalDateTime.now().plusDays(1);
        }
        
        return switch (rule.getType()) {
            case "DAILY" -> currentDueDate.plusDays(rule.getInterval() != null ? rule.getInterval() : 1);
            case "WEEKLY" -> currentDueDate.plusWeeks(rule.getInterval() != null ? rule.getInterval() : 1);
            case "MONTHLY" -> currentDueDate.plusMonths(rule.getInterval() != null ? rule.getInterval() : 1);
            case "YEARLY" -> currentDueDate.plusYears(rule.getInterval() != null ? rule.getInterval() : 1);
            default -> currentDueDate.plusDays(1);
        };
    }

    /**
     * 为任务设置重复规则
     */
    @Transactional
    public void setRepeatRule(Long taskId, RepeatRule rule) throws JsonProcessingException {
        Task task = taskMapper.findById(taskId);
        if (task == null) {
            throw new BusinessException(404, "任务不存在");
        }
        
        String ruleJson = objectMapper.writeValueAsString(rule);
        task.setRepeatRule(ruleJson);
        taskMapper.update(task);
        
        log.info("设置重复规则: taskId={}, rule={}", taskId, rule.getType());
    }

    /**
     * 取消任务的重复规则
     */
    @Transactional
    public void cancelRepeatRule(Long taskId) {
        Task task = taskMapper.findById(taskId);
        if (task == null) {
            throw new BusinessException(404, "任务不存在");
        }
        
        task.setRepeatRule(null);
        taskMapper.update(task);
        
        log.info("取消重复规则: taskId={}", taskId);
    }
}

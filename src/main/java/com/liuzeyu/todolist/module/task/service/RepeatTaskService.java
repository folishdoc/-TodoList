package com.liuzeyu.todolist.module.task.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.liuzeyu.todolist.common.constant.TaskStatusEnum;
import com.liuzeyu.todolist.module.task.dto.RepeatRule;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.event.TaskCompletedEvent;
import com.liuzeyu.todolist.module.task.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 重复任务服务 — 定时生成与手动触发
 * <p>
 * 每天凌晨 0 点（@Scheduled(cron = "0 0 0 * * ?")）自动扫描所有已完成且有重复规则的任务，
 * 根据 RepeatRule 计算下一个截止日期并生成新任务。
 * 也提供手动触发（generateRepeatTasks）和规则管理（setRepeatRule / cancelRepeatRule）功能。
 * 去重策略：生产环境用 Redis SETNX（RepeatTaskDedupLock，跨实例/跨重启），桌面版降级为 JVM 内存变量 lastGenerateDate。
 */
@Slf4j
@Service
public class RepeatTaskService {

    private final TaskMapper taskMapper;
    private final TaskService taskService;
    private final ObjectMapper objectMapper;
    private final Optional<RepeatTaskDedupLock> dedupLockOptional;
    private LocalDate lastGenerateDate = null;

    public RepeatTaskService(TaskMapper taskMapper, TaskService taskService, Optional<RepeatTaskDedupLock> dedupLockOptional) {
        this.taskMapper = taskMapper;
        this.taskService = taskService;
        this.dedupLockOptional = dedupLockOptional;
        this.objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * 每天凌晨检查并生成重复任务（处理所有用户）
     * <p>
     * 扫描所有已完成且有 repeatRule 的任务，根据规则生成新任务。
     * 去重策略：生产环境用 Redis 锁，桌面版用 lastGenerateDate 变量，避免同一天多次执行。
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void scheduledGenerateRepeatTasks() {
        LocalDate today = LocalDate.now();
        if (dedupLockOptional.isPresent()) {
            // 生产环境：Redis 跨实例去重
            if (!dedupLockOptional.get().tryAcquire(today)) {
                log.info("今天已生成过重复任务（Redis 去重），跳过");
                return;
            }
        } else if (today.equals(lastGenerateDate)) {
            // 桌面版降级：JVM 内存变量去重
            log.info("今天已生成过重复任务，跳过");
            return;
        }

        log.info("开始定时生成重复任务...");

        LocalDateTime now = LocalDateTime.now();
        // 系统级定时任务，无用户上下文，直接访问 Mapper 是有意为之
        List<Task> allTasks = taskMapper.findAll();
        
        int generatedCount = 0;
        
        for (Task task : allTasks) {
            if (task.getRepeatRule() != null && !task.getRepeatRule().isEmpty()) {
                try {
                    RepeatRule rule = objectMapper.readValue(task.getRepeatRule(), RepeatRule.class);

                    if (shouldGenerateNewTask(task, rule, now)) {
                        Task newTask = createRepeatedTask(task, rule, now);
                        taskMapper.insert(newTask);
                        generatedCount++;
                        // 接力：清除原任务 repeatRule，避免重复生成
                        task.setRepeatRule(null);
                        taskMapper.update(task);

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
     * 为指定用户手动生成重复任务
     *
     * @param userId 用户 ID
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
                        Task newTask = createRepeatedTask(task, rule, now);
                        taskMapper.insert(newTask);
                        generatedCount++;
                        // 接力：清除原任务 repeatRule，避免重复生成
                        task.setRepeatRule(null);
                        taskMapper.update(task);

                        log.info("生成重复任务: {} -> {}", task.getTitle(), newTask.getTitle());
                    }

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
     * <p>
     * 条件：任务已完成、未超过结束日期（如果设置了）。
     *
     * @param task 原始任务
     * @param rule 重复规则
     * @param now  当前时间
     * @return true 如果需要生成新任务
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
     *
     * @param task 原始任务
     * @param rule 重复规则
     * @param now  当前时间
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
     * 创建重复任务（基于原始任务复制并计算新日期）
     *
     * @param originalTask 原始任务
     * @param rule         重复规则
     * @param now          当前时间
     * @return 新任务（未持久化）
     */
    private Task createRepeatedTask(Task originalTask, RepeatRule rule, LocalDateTime now) {
        Task newTask = new Task();
        newTask.setUserId(originalTask.getUserId());
        newTask.setListId(originalTask.getListId());
        newTask.setTitle(originalTask.getTitle());
        newTask.setDescription(originalTask.getDescription());
        newTask.setPriority(originalTask.getPriority());
        newTask.setStatus(TaskStatusEnum.INCOMPLETE.getCode()); // 新任务默认未完成
        newTask.setSortOrder(originalTask.getSortOrder());
        newTask.setRepeatRule(originalTask.getRepeatRule());
        
        // 计算新的截止日期
        LocalDateTime newDueDate = calculateNextDueDate(originalTask.getDueDate(), rule, now);
        newTask.setDueDate(newDueDate);
        
        // 同步计算新的提醒时间
        if (originalTask.getReminderTime() != null) {
            LocalDateTime newReminderTime = calculateNextDueDate(originalTask.getReminderTime(), rule, now);
            newTask.setReminderTime(newReminderTime);
        }
        
        return newTask;
    }

    /**
     * 在当前日期上增加一个重复周期
     *
     * @param date 当前日期
     * @param rule 重复规则
     * @return 增加一个周期后的日期
     */
    private LocalDateTime addPeriod(LocalDateTime date, RepeatRule rule) {
        int interval = rule.getInterval() != null ? rule.getInterval() : 1;
        return switch (rule.getType()) {
            case "DAILY" -> date.plusDays(interval);
            case "WEEKLY" -> date.plusWeeks(interval);
            case "MONTHLY" -> date.plusMonths(interval);
            case "YEARLY" -> date.plusYears(interval);
            default -> date.plusDays(interval);
        };
    }

    /**
     * 计算下一个截止日期
     * <p>
     * 如果推算出的日期已过期（早于 now），继续增加周期直到追上当前时间，
     * 避免过期任务完成后新任务仍然过期。
     *
     * @param currentDueDate 当前截止日期
     * @param rule           重复规则
     * @param now            当前时间
     * @return 下一个截止日期
     */
    private LocalDateTime calculateNextDueDate(LocalDateTime currentDueDate, RepeatRule rule, LocalDateTime now) {
        if (currentDueDate == null) {
            return now.plusDays(1);
        }

        LocalDateTime next = addPeriod(currentDueDate, rule);
        while (next.isBefore(now)) {
            next = addPeriod(next, rule);
        }
        return next;
    }

    /**
     * 为任务设置重复规则
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     * @param rule   重复规则（序列化为 JSON 存储）
     * @throws JsonProcessingException JSON 序列化失败
     */
    @Transactional
    public void setRepeatRule(Long userId, Long taskId, RepeatRule rule) throws JsonProcessingException {
        // 通过 TaskService 查找任务，自带权限校验
        Task task = taskService.getTask(userId, taskId);

        String ruleJson = objectMapper.writeValueAsString(rule);
        task.setRepeatRule(ruleJson);
        taskMapper.update(task);

        log.info("设置重复规则: taskId={}, rule={}", taskId, rule.getType());
    }

    /**
     * 取消任务的重复规则
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     */
    @Transactional
    public void cancelRepeatRule(Long userId, Long taskId) {
        // 通过 TaskService 查找任务，自带权限校验
        Task task = taskService.getTask(userId, taskId);

        task.setRepeatRule(null);
        taskMapper.update(task);

        log.info("取消重复规则: taskId={}", taskId);
    }

    /**
     * 任务完成事件监听 — 完成时立即生成下一条（接力模型），
     * 无需等待每天 0 点的定时任务。通过事件解耦，避免与 TaskService 循环依赖。
     */
    @EventListener
    @Transactional
    public void onTaskCompleted(TaskCompletedEvent event) {
        generateNextForTask(event.getTask());
    }

    /**
     * 为已完成的循环任务生成下一条（接力模型）：生成带规则的新任务，清除原任务 repeatRule。
     */
    @Transactional
    public void generateNextForTask(Task originalTask) {
        if (originalTask.getRepeatRule() == null || originalTask.getRepeatRule().isEmpty()) return;
        if (originalTask.getStatus() != TaskStatusEnum.COMPLETE.getCode()) return;
        try {
            RepeatRule rule = objectMapper.readValue(originalTask.getRepeatRule(), RepeatRule.class);
            LocalDateTime now = LocalDateTime.now();
            if (!shouldGenerateNewTask(originalTask, rule, now)) return;
            Task newTask = createRepeatedTask(originalTask, rule, now);
            taskMapper.insert(newTask);
            // 接力：规则传递给新任务，原任务清除 repeatRule 避免定时任务重复生成
            originalTask.setRepeatRule(null);
            taskMapper.update(originalTask);
            log.info("循环任务接力: {} -> 新任务 {}", originalTask.getTitle(), newTask.getTitle());
        } catch (Exception e) {
            log.error("生成下一条循环任务失败: taskId={}", originalTask.getId(), e);
        }
    }
}

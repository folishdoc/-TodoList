package com.liuzeyu.todolist.module.task.service;

import com.liuzeyu.todolist.common.constant.TaskStatusEnum;
import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.common.result.PageResult;
import com.liuzeyu.todolist.module.task.dto.TaskRequest;
import com.liuzeyu.todolist.module.task.dto.TaskTimeRequest;
import com.liuzeyu.todolist.module.task.dto.TaskWithSubtasks;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 任务服务 — 核心业务逻辑
 * <p>
 * 提供任务的完整 CRUD、状态变更（完成/取消完成）、今日/未来任务查询、
 * 搜索、子任务管理、日历范围查询等功能。
 * 删除任务时使用 BFS 级联删除所有子任务，避免递归栈溢出。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskMapper taskMapper;

    /**
     * 校验日期范围：结束时间不能早于开始时间
     *
     * @param request 任务请求
     * @throws BusinessException 400 如果结束时间早于开始时间
     */
    private void validateDateRange(TaskRequest request) {
        if (request.getStartDate() != null && request.getDueDate() != null
                && request.getDueDate().isBefore(request.getStartDate())) {
            throw new BusinessException(400, "结束时间不能早于开始时间");
        }
    }

    /**
     * 创建任务
     *
     * @param userId  用户 ID
     * @param request 任务请求
     * @return 创建后的任务（含自动生成的 id）
     */
    public Task createTask(Long userId, TaskRequest request) {
        validateDateRange(request);
        Task task = new Task();
        task.setUserId(userId);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setListId(request.getListId());
        task.setParentId(request.getParentId());
        task.setPriority(request.getPriority() != null ? request.getPriority() : 2);
        task.setStatus(request.getStatus() != null ? request.getStatus() : TaskStatusEnum.INCOMPLETE.getCode());
        if (request.getStatus() != null && request.getStatus() == TaskStatusEnum.COMPLETE.getCode()) {
            task.setCompletedAt(LocalDateTime.now());
        }
        task.setDueDate(request.getDueDate());
        task.setStartDate(request.getStartDate());
        task.setReminderTime(request.getReminderTime());
        task.setRepeatRule(request.getRepeatRule());

        taskMapper.insert(task);
        return task;
    }

    /**
     * 获取任务列表（分页）
     *
     * @param userId 用户 ID
     * @param page   页码（从 0 开始）
     * @param size   每页大小
     * @return 分页结果
     */
    public PageResult<Task> getTasks(Long userId, int page, int size) {
        int offset = page * size;
        List<Task> content = taskMapper.findByUserId(userId, offset, size);
        long total = taskMapper.countByUserId(userId);
        return new PageResult<>(content, total, page, size);
    }

    /**
     * 获取任务详情（含权限校验）
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     * @return 任务实体
     * @throws BusinessException 404 任务不存在，403 无权访问
     */
    public Task getTask(Long userId, Long taskId) {
        Task task = taskMapper.findById(taskId);
        if (task == null) {
            throw new BusinessException(404, "任务不存在");
        }
        
        if (!task.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权访问该任务");
        }
        
        return task;
    }

    /**
     * 更新任务
     *
     * @param userId  用户 ID
     * @param taskId  任务 ID
     * @param request 更新请求
     * @return 更新后的任务
     */
    public Task updateTask(Long userId, Long taskId, TaskRequest request) {
        validateDateRange(request);
        Task task = getTask(userId, taskId);

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setListId(request.getListId());
        if (request.getParentId() != null) {
            task.setParentId(request.getParentId());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
            if (request.getStatus() == TaskStatusEnum.COMPLETE.getCode()) {
                if (task.getCompletedAt() == null) {
                    task.setCompletedAt(LocalDateTime.now());
                }
            } else {
                task.setCompletedAt(null);
            }
        }
        task.setDueDate(request.getDueDate());
        task.setStartDate(request.getStartDate());
        task.setReminderTime(request.getReminderTime());
        task.setRepeatRule(request.getRepeatRule());

        taskMapper.update(task);
        return task;
    }

    /**
     * 更新任务时间（仅更新开始/截止时间，用于拖拽修改）
     *
     * @param userId  用户 ID
     * @param taskId  任务 ID
     * @param request 时间更新请求
     * @return 更新后的任务
     */
    public Task updateTaskTime(Long userId, Long taskId, TaskTimeRequest request) {
        Task task = getTask(userId, taskId);

        LocalDateTime newStart = request.getStartDate() != null ? request.getStartDate() : task.getStartDate();
        LocalDateTime newDue = request.getDueDate() != null ? request.getDueDate() : task.getDueDate();

        if (newStart != null && newDue != null && newDue.isBefore(newStart)) {
            throw new BusinessException(400, "结束时间不能早于开始时间");
        }

        if (request.getStartDate() != null) {
            task.setStartDate(request.getStartDate());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }

        taskMapper.update(task);
        return task;
    }

    /**
     * 删除任务（级联删除所有子任务）
     * <p>
     * 使用 BFS 遍历所有层级子任务，避免递归栈溢出。
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     */
    @org.springframework.transaction.annotation.Transactional
    public void deleteTask(Long userId, Long taskId) {
        Task task = getTask(userId, taskId);
        
        // BFS 迭代删除所有子任务
        java.util.Queue<Long> queue = new java.util.LinkedList<>();
        queue.add(taskId);
        while (!queue.isEmpty()) {
            Long currentId = queue.poll();
            List<Task> subtasks = taskMapper.findByUserIdAndParentId(userId, currentId);
            for (Task subtask : subtasks) {
                queue.add(subtask.getId());
            }
            if (!currentId.equals(taskId)) {
                taskMapper.deleteById(currentId);
            }
        }
        taskMapper.deleteById(task.getId());
    }

    /**
     * 完成任务
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     * @return 更新后的任务
     */
    public Task completeTask(Long userId, Long taskId) {
        Task task = getTask(userId, taskId);
        task.setStatus(TaskStatusEnum.COMPLETE.getCode());
        task.setCompletedAt(LocalDateTime.now());
        taskMapper.update(task);
        return task;
    }

    /**
     * 取消完成任务
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     * @return 更新后的任务
     */
    public Task uncompleteTask(Long userId, Long taskId) {
        Task task = getTask(userId, taskId);
        task.setStatus(TaskStatusEnum.INCOMPLETE.getCode());
        task.setCompletedAt(null);
        taskMapper.update(task);
        return task;
    }

    /**
     * 获取今日任务
     * <p>
     * 显示条件：
     * 1. 已开始（startDate <= 今天）或者没有设置 startDate
     * 2. 未完成
     * 3. 截止日期在今天或之后，或者没有设置 dueDate
     *
     * @param userId 用户 ID
     * @return 今日任务列表
     */
    public List<Task> getTodayTasks(Long userId) {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        
        return taskMapper.findTodayTasks(userId, startOfDay, endOfDay);
    }

    /**
     * 获取未来任务
     *
     * @param userId 用户 ID
     * @return 未来任务列表
     */
    public List<Task> getUpcomingTasks(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        return taskMapper.findUpcomingTasks(userId, now);
    }

    /**
     * 搜索任务（标题/描述模糊匹配）
     *
     * @param userId  用户 ID
     * @param keyword 关键词
     * @param page    页码
     * @param size    每页大小
     * @return 分页结果
     */
    public PageResult<Task> searchTasks(Long userId, String keyword, int page, int size) {
        int offset = page * size;
        List<Task> content = taskMapper.searchTasks(userId, keyword, offset, size);
        long total = taskMapper.countSearchTasks(userId, keyword);
        return new PageResult<>(content, total, page, size);
    }

    /**
     * 获取子任务列表（只获取直接子任务）
     *
     * @param userId   用户 ID
     * @param parentId 父任务 ID
     * @return 直接子任务列表
     */
    public List<Task> getSubtasks(Long userId, Long parentId) {
        return taskMapper.findByUserIdAndParentId(userId, parentId);
    }
    
    /**
     * 递归收集所有层级的子任务
     *
     * @param userId   用户 ID
     * @param parentId 父任务 ID
     * @param result   结果列表（累加）
     */
    private void collectAllSubtasks(Long userId, Long parentId, List<Task> result) {
        List<Task> directSubtasks = taskMapper.findByUserIdAndParentId(userId, parentId);
        for (Task subtask : directSubtasks) {
            result.add(subtask);
            collectAllSubtasks(userId, subtask.getId(), result);
        }
    }
    
    /**
     * 获取日期范围内的任务（日历视图用）
     *
     * @param userId     用户 ID
     * @param rangeStart 范围开始时间
     * @param rangeEnd   范围结束时间
     * @return 任务列表
     */
    public List<Task> getTasksByDateRange(Long userId, LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        return taskMapper.findByDateRange(userId, rangeStart, rangeEnd);
    }

    /**
     * 获取带子任务的任务列表（分页）
     * <p>
     * 批量查询所有直接子任务（避免 N+1 问题），
     * 将每个 Task 包装为 TaskWithSubtasks 返回，前端自行构建层级。
     *
     * @param userId 用户 ID
     * @param page   页码
     * @param size   每页大小
     * @return 分页结果（含子任务）
     */
    public PageResult<TaskWithSubtasks> getTasksWithSubtasks(Long userId, int page, int size) {
        int offset = page * size;
        List<Task> tasks = taskMapper.findByUserId(userId, offset, size);
        long total = taskMapper.countByUserId(userId);
        
        // 批量获取所有子任务（避免 N+1）
        List<Long> taskIds = tasks.stream().map(Task::getId).collect(Collectors.toList());
        List<Task> allSubtasks = taskMapper.findByUserIdAndParentIdIn(userId, taskIds);
        java.util.Map<Long, List<Task>> subtasksByParentId = allSubtasks.stream()
            .collect(Collectors.groupingBy(Task::getParentId));
        
        // 将所有任务包装成 TaskWithSubtasks
        List<TaskWithSubtasks> tasksWithSubtasks = tasks.stream()
            .map(task -> {
                TaskWithSubtasks wrapper = new TaskWithSubtasks(task);
                wrapper.setSubtasks(subtasksByParentId.getOrDefault(task.getId(), java.util.Collections.emptyList()));
                return wrapper;
            })
            .collect(Collectors.toList());
        
        return new PageResult<>(tasksWithSubtasks, total, page, size);
    }
}

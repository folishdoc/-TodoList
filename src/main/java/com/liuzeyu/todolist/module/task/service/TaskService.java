package com.liuzeyu.todolist.module.task.service;

import com.liuzeyu.todolist.common.constant.TaskStatusEnum;
import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.task.dto.TaskRequest;
import com.liuzeyu.todolist.module.task.dto.TaskWithSubtasks;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 任务服务
 */
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    /**
     * 创建任务
     */
    public Task createTask(Long userId, TaskRequest request) {
        Task task = new Task();
        task.setUserId(userId);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setListId(request.getListId());
        task.setParentId(request.getParentId()); // 设置父任务ID
        task.setPriority(request.getPriority() != null ? request.getPriority() : 2);
        task.setStatus(request.getStatus() != null ? request.getStatus() : TaskStatusEnum.INCOMPLETE.getCode());
        if (request.getStatus() != null && request.getStatus() == TaskStatusEnum.COMPLETE.getCode()) {
            task.setCompletedAt(LocalDateTime.now());
        }
        task.setDueDate(request.getDueDate());
        task.setStartDate(request.getStartDate()); // 设置预定日期
        task.setReminderTime(request.getReminderTime());
        task.setRepeatRule(request.getRepeatRule());

        return taskRepository.save(task);
    }

    /**
     * 获取任务列表（分页）
     */
    public Page<Task> getTasks(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return taskRepository.findByUserId(userId, pageable);
    }

    /**
     * 获取任务详情
     */
    public Task getTask(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("任务不存在"));
        
        if (!task.getUserId().equals(userId)) {
            throw new BusinessException("无权访问该任务");
        }
        
        return task;
    }

    /**
     * 更新任务
     */
    public Task updateTask(Long userId, Long taskId, TaskRequest request) {
        Task task = getTask(userId, taskId);

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setListId(request.getListId());
        task.setParentId(request.getParentId()); // 设置父任务ID
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
        task.setStartDate(request.getStartDate()); // 设置预定日期
        task.setReminderTime(request.getReminderTime());
        task.setRepeatRule(request.getRepeatRule());

        return taskRepository.save(task);
    }

    /**
     * 删除任务（级联删除所有子任务）
     */
    @org.springframework.transaction.annotation.Transactional
    public void deleteTask(Long userId, Long taskId) {
        Task task = getTask(userId, taskId);
        
        // 递归删除所有子任务
        List<Task> subtasks = taskRepository.findByUserIdAndParentId(userId, taskId);
        for (Task subtask : subtasks) {
            deleteTask(userId, subtask.getId());
        }
        
        taskRepository.delete(task);
    }

    /**
     * 完成任务
     */
    public Task completeTask(Long userId, Long taskId) {
        Task task = getTask(userId, taskId);
        task.setStatus(TaskStatusEnum.COMPLETE.getCode());
        task.setCompletedAt(LocalDateTime.now());
        return taskRepository.save(task);
    }

    /**
     * 取消完成任务
     */
    public Task uncompleteTask(Long userId, Long taskId) {
        Task task = getTask(userId, taskId);
        task.setStatus(TaskStatusEnum.INCOMPLETE.getCode());
        task.setCompletedAt(null);
        return taskRepository.save(task);
    }

    /**
     * 获取今日任务
     * 显示条件：
     * 1. 已开始（startDate <= 今天）或者没有设置startDate
     * 2. 未完成
     * 3. 截止日期在今天或之后，或者没有设置dueDate
     */
    public List<Task> getTodayTasks(Long userId) {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        
        return taskRepository.findAllByUserId(userId).stream()
            .filter(task -> task.getStatus() == 0) // 未完成
            .filter(task -> {
                // 如果设置了开始日期，必须已经到达或超过开始日期
                if (task.getStartDate() != null) {
                    return !task.getStartDate().isAfter(endOfDay);
                }
                return true; // 没有设置开始日期的任务也显示
            })
            .filter(task -> {
                // 如果设置了截止日期，必须在今天或之后
                if (task.getDueDate() != null) {
                    return !task.getDueDate().isBefore(startOfDay);
                }
                return true; // 没有设置截止日期的任务也显示
            })
            .sorted((t1, t2) -> {
                // 按优先级降序，然后按截止日期升序
                int priorityCompare = Integer.compare(t2.getPriority(), t1.getPriority());
                if (priorityCompare != 0) return priorityCompare;
                if (t1.getDueDate() == null) return 1;
                if (t2.getDueDate() == null) return -1;
                return t1.getDueDate().compareTo(t2.getDueDate());
            })
            .toList();
    }

    /**
     * 获取未来任务
     */
    public List<Task> getUpcomingTasks(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        return taskRepository.findUpcomingTasks(userId, now);
    }

    /**
     * 搜索任务
     */
    public Page<Task> searchTasks(Long userId, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return taskRepository.searchTasks(userId, keyword, pageable);
    }

    /**
     * 获取子任务列表（只获取直接子任务）
     */
    public List<Task> getSubtasks(Long userId, Long parentId) {
        return taskRepository.findByUserIdAndParentId(userId, parentId);
    }
    
    /**
     * 递归获取所有层级的子任务
     */
    private void collectAllSubtasks(Long userId, Long parentId, List<Task> result) {
        List<Task> directSubtasks = taskRepository.findByUserIdAndParentId(userId, parentId);
        for (Task subtask : directSubtasks) {
            result.add(subtask);
            // 递归获取子任务的子任务
            collectAllSubtasks(userId, subtask.getId(), result);
        }
    }
    
    /**
     * 获取带子任务的任务列表（分页）
     * 返回所有任务，前端自行构建层级
     */
    public Page<TaskWithSubtasks> getTasksWithSubtasks(Long userId, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<Task> taskPage = taskRepository.findByUserId(userId, pageable);
            
            // 将所有任务包装成TaskWithSubtasks
            List<TaskWithSubtasks> tasksWithSubtasks = taskPage.getContent().stream()
                .map(task -> {
                    TaskWithSubtasks wrapper = new TaskWithSubtasks(task);
                    // 获取该任务的直接子任务
                    List<Task> directSubtasks = taskRepository.findByUserIdAndParentId(userId, task.getId());
                    wrapper.setSubtasks(directSubtasks);
                    return wrapper;
                })
                .collect(Collectors.toList());
            
            // 创建新的Page对象
            return new org.springframework.data.domain.PageImpl<>(
                tasksWithSubtasks,
                pageable,
                taskPage.getTotalElements()
            );
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("获取任务列表失败: " + e.getMessage(), e);
        }
    }
}

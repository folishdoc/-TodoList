package com.liuzeyu.todolist.module.task.service;

import com.liuzeyu.todolist.module.task.dto.BatchOperationRequest;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 批量操作服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BatchOperationService {

    private final TaskRepository taskRepository;

    /**
     * 执行批量操作
     */
    @Transactional
    public int executeBatchOperation(Long userId, BatchOperationRequest request) {
        List<Long> taskIds = request.getTaskIds();
        if (taskIds == null || taskIds.isEmpty()) {
            throw new IllegalArgumentException("任务ID列表不能为空");
        }

        String operation = request.getOperation();
        int count = 0;

        switch (operation.toLowerCase()) {
            case "complete":
                count = batchComplete(userId, taskIds);
                break;
            case "delete":
                count = batchDelete(userId, taskIds);
                break;
            case "move":
                count = batchMove(userId, taskIds, request.getTargetListId());
                break;
            case "setpriority":
                count = batchSetPriority(userId, taskIds, request.getPriority());
                break;
            default:
                throw new IllegalArgumentException("不支持的操作类型: " + operation);
        }

        log.info("批量操作完成: operation={}, userId={}, count={}", operation, userId, count);
        return count;
    }

    /**
     * 批量完成任务
     */
    private int batchComplete(Long userId, List<Long> taskIds) {
        List<Task> tasks = taskRepository.findAllById(taskIds);
        int count = 0;
        
        for (Task task : tasks) {
            if (task.getUserId().equals(userId) && task.getStatus() == 0) {
                task.setStatus(1);
                task.setCompletedAt(LocalDateTime.now());
                taskRepository.save(task);
                count++;
            }
        }
        
        return count;
    }

    /**
     * 批量删除任务（级联删除子任务）
     */
    private int batchDelete(Long userId, List<Long> taskIds) {
        List<Task> tasks = taskRepository.findAllById(taskIds);
        int count = 0;

        for (Task task : tasks) {
            if (task.getUserId().equals(userId)) {
                deleteTaskCascade(task.getId());
                count++;
            }
        }

        return count;
    }

    private void deleteTaskCascade(Long taskId) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) return;
        List<Task> subtasks = taskRepository.findByUserIdAndParentId(task.getUserId(), taskId);
        for (Task subtask : subtasks) {
            deleteTaskCascade(subtask.getId());
        }
        taskRepository.delete(task);
    }

    /**
     * 批量移动任务到指定清单
     */
    private int batchMove(Long userId, List<Long> taskIds, Long targetListId) {
        if (targetListId == null) {
            throw new IllegalArgumentException("目标清单ID不能为空");
        }
        
        List<Task> tasks = taskRepository.findAllById(taskIds);
        int count = 0;
        
        for (Task task : tasks) {
            if (task.getUserId().equals(userId)) {
                task.setListId(targetListId);
                taskRepository.save(task);
                count++;
            }
        }
        
        return count;
    }

    /**
     * 批量设置优先级
     */
    private int batchSetPriority(Long userId, List<Long> taskIds, Integer priority) {
        if (priority == null || priority < 1 || priority > 3) {
            throw new IllegalArgumentException("无效的优先级: " + priority);
        }
        
        List<Task> tasks = taskRepository.findAllById(taskIds);
        int count = 0;
        
        for (Task task : tasks) {
            if (task.getUserId().equals(userId)) {
                task.setPriority(priority);
                taskRepository.save(task);
                count++;
            }
        }
        
        return count;
    }
}

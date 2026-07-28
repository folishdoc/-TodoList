package com.liuzeyu.todolist.module.task.service;

import com.liuzeyu.todolist.module.task.dto.BatchOperationRequest;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 批量操作服务
 * <p>
 * 支持四种批量操作：complete（完成）、delete（删除，含级联子任务）、
 * move（移动到指定清单）、setPriority（设置优先级）。
 * 所有操作先验证任务归属权（userId），再执行变更。
 * 删除操作使用 BFS 收集所有层级子任务后统一删除。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BatchOperationService {

    private final TaskMapper taskMapper;

    /**
     * 执行批量操作
     *
     * @param userId  用户 ID
     * @param request 批量操作请求
     * @return 受影响的任务数
     * @throws IllegalArgumentException 如果 taskIds 为空或操作类型不支持
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
     *
     * @param userId  用户 ID
     * @param taskIds 任务 ID 列表
     * @return 完成的任务数
     */
    private int batchComplete(Long userId, List<Long> taskIds) {
        String idsStr = taskIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        List<Task> tasks = taskMapper.findAllByIds(userId, idsStr);
        List<Task> toSave = new java.util.ArrayList<>();
        
        for (Task task : tasks) {
            if (task.getUserId().equals(userId) && task.getStatus() == 0) {
                task.setStatus(1);
                task.setCompletedAt(LocalDateTime.now());
                toSave.add(task);
            }
        }
        
        if (!toSave.isEmpty()) {
            taskMapper.batchUpdate(toSave);
        }
        return toSave.size();
    }

    /**
     * 批量删除任务（级联删除子任务）
     * <p>
     * 使用 BFS 收集所有层级的子任务 ID，然后统一删除。
     *
     * @param userId  用户 ID
     * @param taskIds 任务 ID 列表
     * @return 删除的任务数（不含子任务）
     */
    private int batchDelete(Long userId, List<Long> taskIds) {
        // 先验证所有 task 属于该用户
        String idsStr = taskIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        List<Task> tasks = taskMapper.findAllByIds(userId, idsStr);
        java.util.List<Long> allIds = new java.util.ArrayList<>();
        
        for (Task task : tasks) {
            if (task.getUserId().equals(userId)) {
                allIds.add(task.getId());
            }
        }
        
        // BFS 收集所有子任务 ID
        java.util.Queue<Long> queue = new java.util.LinkedList<>(allIds);
        java.util.List<Long> descendantIds = new java.util.ArrayList<>();
        while (!queue.isEmpty()) {
            Long currentId = queue.poll();
            List<Task> subtasks = taskMapper.findByUserIdAndParentId(userId, currentId);
            for (Task subtask : subtasks) {
                descendantIds.add(subtask.getId());
                queue.add(subtask.getId());
            }
        }
        
        allIds.addAll(descendantIds);
        taskMapper.batchDeleteByIds(allIds);
        return tasks.size();
    }

    /**
     * 批量移动任务到指定清单
     *
     * @param userId      用户 ID
     * @param taskIds     任务 ID 列表
     * @param targetListId 目标清单 ID
     * @return 移动的任务数
     */
    private int batchMove(Long userId, List<Long> taskIds, Long targetListId) {
        if (targetListId == null) {
            throw new IllegalArgumentException("目标清单ID不能为空");
        }
        
        String idsStr = taskIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        List<Task> tasks = taskMapper.findAllByIds(userId, idsStr);
        List<Task> toSave = new java.util.ArrayList<>();
        
        for (Task task : tasks) {
            if (task.getUserId().equals(userId)) {
                task.setListId(targetListId);
                toSave.add(task);
            }
        }
        
        if (!toSave.isEmpty()) {
            taskMapper.batchUpdate(toSave);
        }
        return toSave.size();
    }

    /**
     * 批量设置优先级
     *
     * @param userId   用户 ID
     * @param taskIds  任务 ID 列表
     * @param priority 新优先级（1-3）
     * @return 更新的任务数
     */
    private int batchSetPriority(Long userId, List<Long> taskIds, Integer priority) {
        if (priority == null || priority < 1 || priority > 3) {
            throw new IllegalArgumentException("无效的优先级: " + priority);
        }
        
        String idsStr = taskIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        List<Task> tasks = taskMapper.findAllByIds(userId, idsStr);
        List<Task> toSave = new java.util.ArrayList<>();
        
        for (Task task : tasks) {
            if (task.getUserId().equals(userId)) {
                task.setPriority(priority);
                toSave.add(task);
            }
        }
        
        if (!toSave.isEmpty()) {
            taskMapper.batchUpdate(toSave);
        }
        return toSave.size();
    }
}

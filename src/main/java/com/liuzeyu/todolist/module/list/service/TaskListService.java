package com.liuzeyu.todolist.module.list.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.list.dto.TaskListRequest;
import com.liuzeyu.todolist.module.list.entity.TaskList;
import com.liuzeyu.todolist.module.list.mapper.TaskListMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 清单服务 — 清单 CRUD
 * <p>
 * 提供清单的增删改查功能。默认清单（isDefault=true）不可删除。
 * 列表查询按 sortOrder 升序返回。
 */
@Service
@RequiredArgsConstructor
public class TaskListService {

    private final TaskListMapper taskListMapper;

    /**
     * 创建清单
     *
     * @param userId  用户 ID
     * @param request 清单请求
     * @return 创建后的清单
     */
    public TaskList createTaskList(Long userId, TaskListRequest request) {
        TaskList taskList = new TaskList();
        taskList.setUserId(userId);
        taskList.setName(request.getName());
        taskList.setColor(request.getColor());
        taskList.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        taskList.setIsDefault(false);

        taskListMapper.insert(taskList);
        return taskList;
    }

    /**
     * 获取用户的清单列表（按 sortOrder 升序）
     *
     * @param userId 用户 ID
     * @return 清单列表
     */
    public List<TaskList> getTaskLists(Long userId) {
        return taskListMapper.findByUserIdOrderBySortOrderAsc(userId);
    }

    /**
     * 获取清单详情（含权限校验）
     *
     * @param userId 用户 ID
     * @param listId 清单 ID
     * @return 清单实体
     * @throws BusinessException 404 不存在，403 无权访问
     */
    public TaskList getTaskList(Long userId, Long listId) {
        TaskList taskList = taskListMapper.findById(listId);
        if (taskList == null) {
            throw new BusinessException(404, "清单不存在");
        }
        
        if (!taskList.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权访问该清单");
        }
        
        return taskList;
    }

    /**
     * 更新清单
     *
     * @param userId  用户 ID
     * @param listId  清单 ID
     * @param request 更新请求
     * @return 更新后的清单
     */
    public TaskList updateTaskList(Long userId, Long listId, TaskListRequest request) {
        TaskList taskList = getTaskList(userId, listId);

        taskList.setName(request.getName());
        taskList.setColor(request.getColor());
        if (request.getSortOrder() != null) {
            taskList.setSortOrder(request.getSortOrder());
        }

        taskListMapper.update(taskList);
        return taskList;
    }

    /**
     * 删除清单
     * <p>
     * 默认清单（isDefault=true）不可删除。
     *
     * @param userId 用户 ID
     * @param listId 清单 ID
     * @throws BusinessException 400 默认清单不可删除
     */
    public void deleteTaskList(Long userId, Long listId) {
        TaskList taskList = getTaskList(userId, listId);
        
        if (taskList.getIsDefault()) {
            throw new BusinessException(400, "不能删除默认清单");
        }
        
        taskListMapper.deleteById(taskList.getId());
    }
}

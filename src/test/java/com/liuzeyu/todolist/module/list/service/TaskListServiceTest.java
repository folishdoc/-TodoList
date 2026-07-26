package com.liuzeyu.todolist.module.list.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.list.dto.TaskListRequest;
import com.liuzeyu.todolist.module.list.entity.TaskList;
import com.liuzeyu.todolist.module.list.mapper.TaskListRepository;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TaskListServiceTest extends BaseUnitTest {

    @Mock
    private TaskListRepository taskListRepository;

    @InjectMocks
    private TaskListService taskListService;

    @Test
    @DisplayName("创建清单 - 正常")
    void create_succeeds() {
        TaskListRequest req = new TaskListRequest();
        req.setName("工作");
        req.setColor("#FF0000");
        when(taskListRepository.save(any(TaskList.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskList list = taskListService.createTaskList(1L, req);

        assertThat(list.getName()).isEqualTo("工作");
        assertThat(list.getUserId()).isEqualTo(1L);
        assertThat(list.getIsDefault()).isFalse();
    }

    @Test
    @DisplayName("获取清单详情 - 存在且属于用户")
    void get_succeeds() {
        TaskList list = new TaskList();
        list.setId(1L);
        list.setUserId(1L);
        when(taskListRepository.findById(1L)).thenReturn(Optional.of(list));

        TaskList result = taskListService.getTaskList(1L, 1L);

        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("获取清单详情 - 不存在抛异常")
    void get_notFound_throws() {
        when(taskListRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskListService.getTaskList(1L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("清单不存在");
    }

    @Test
    @DisplayName("获取清单详情 - 越权访问抛异常")
    void get_wrongUser_throws() {
        TaskList list = new TaskList();
        list.setId(1L);
        list.setUserId(2L);
        when(taskListRepository.findById(1L)).thenReturn(Optional.of(list));

        assertThatThrownBy(() -> taskListService.getTaskList(1L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("无权访问该清单");
    }

    @Test
    @DisplayName("更新清单 - 正常")
    void update_succeeds() {
        TaskList existing = new TaskList();
        existing.setId(1L);
        existing.setUserId(1L);
        existing.setName("旧名");
        when(taskListRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(taskListRepository.save(any(TaskList.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskListRequest req = new TaskListRequest();
        req.setName("新名");
        TaskList result = taskListService.updateTaskList(1L, 1L, req);

        assertThat(result.getName()).isEqualTo("新名");
    }

    @Test
    @DisplayName("删除清单 - 默认清单不允许删除")
    void delete_defaultList_throws() {
        TaskList list = new TaskList();
        list.setId(1L);
        list.setUserId(1L);
        list.setIsDefault(true);
        when(taskListRepository.findById(1L)).thenReturn(Optional.of(list));

        assertThatThrownBy(() -> taskListService.deleteTaskList(1L, 1L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("不能删除默认清单");
    }

    @Test
    @DisplayName("删除清单 - 普通清单正常删除")
    void delete_succeeds() {
        TaskList list = new TaskList();
        list.setId(1L);
        list.setUserId(1L);
        list.setIsDefault(false);
        when(taskListRepository.findById(1L)).thenReturn(Optional.of(list));

        taskListService.deleteTaskList(1L, 1L);

        verify(taskListRepository).delete(list);
    }

    @Test
    @DisplayName("获取用户的清单列表 - 委托给 repository")
    void getLists_delegates() {
        when(taskListRepository.findByUserIdOrderBySortOrderAsc(1L)).thenReturn(List.of(new TaskList()));

        List<TaskList> result = taskListService.getTaskLists(1L);

        assertThat(result).hasSize(1);
    }
}

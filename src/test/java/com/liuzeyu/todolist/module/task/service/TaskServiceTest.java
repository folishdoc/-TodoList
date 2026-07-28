package com.liuzeyu.todolist.module.task.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.task.dto.TaskRequest;
import com.liuzeyu.todolist.module.task.dto.TaskTimeRequest;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskMapper;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class TaskServiceTest extends BaseUnitTest {

    @Mock
    private TaskMapper taskMapper;

    @InjectMocks
    private TaskService taskService;

    @Test
    @DisplayName("创建任务 - 正常流程")
    void createTask_succeeds() {
        TaskRequest request = new TaskRequest();
        request.setTitle("买牛奶");
        request.setPriority(3);
        doAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(1L);
            return null;
        }).when(taskMapper).insert(any(Task.class));

        Task result = taskService.createTask(1L, request);

        assertThat(result.getTitle()).isEqualTo("买牛奶");
        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getPriority()).isEqualTo(3);
        assertThat(result.getStatus()).isEqualTo(0);
        verify(taskMapper).insert(any(Task.class));
    }

    @Test
    @DisplayName("创建任务 - 截止时间早于开始时间应抛异常")
    void createTask_invalidDateRange_throws() {
        TaskRequest request = new TaskRequest();
        request.setTitle("任务");
        request.setStartDate(LocalDateTime.now());
        request.setDueDate(LocalDateTime.now().minusDays(1));

        assertThatThrownBy(() -> taskService.createTask(1L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("结束时间不能早于开始时间");
    }

    @Test
    @DisplayName("创建任务 - 状态为已完成时设置 completedAt")
    void createTask_alreadyCompleted_setsCompletedAt() {
        TaskRequest request = new TaskRequest();
        request.setTitle("已完成");
        request.setStatus(1);
        doNothing().when(taskMapper).insert(any(Task.class));

        Task result = taskService.createTask(1L, request);

        assertThat(result.getCompletedAt()).isNotNull();
    }

    @Test
    @DisplayName("获取任务详情 - 任务存在且属于用户")
    void getTask_success() {
        Task task = new Task();
        task.setId(10L);
        task.setUserId(1L);
        when(taskMapper.findById(10L)).thenReturn(task);

        Task result = taskService.getTask(1L, 10L);

        assertThat(result.getId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("获取任务详情 - 任务不存在抛异常")
    void getTask_notFound_throws() {
        when(taskMapper.findById(10L)).thenReturn(null);

        assertThatThrownBy(() -> taskService.getTask(1L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("任务不存在");
    }

    @Test
    @DisplayName("获取任务详情 - 任务属于其他用户抛异常")
    void getTask_wrongUser_throws() {
        Task task = new Task();
        task.setId(10L);
        task.setUserId(2L);
        when(taskMapper.findById(10L)).thenReturn(task);

        assertThatThrownBy(() -> taskService.getTask(1L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("无权访问该任务");
    }

    @Test
    @DisplayName("更新任务 - 正常更新字段")
    void updateTask_succeeds() {
        Task existing = new Task();
        existing.setId(10L);
        existing.setUserId(1L);
        existing.setStatus(0);
        when(taskMapper.findById(10L)).thenReturn(existing);
        doNothing().when(taskMapper).update(any(Task.class));

        TaskRequest req = new TaskRequest();
        req.setTitle("新标题");
        req.setPriority(1);
        Task result = taskService.updateTask(1L, 10L, req);

        assertThat(result.getTitle()).isEqualTo("新标题");
        assertThat(result.getPriority()).isEqualTo(1);
    }

    @Test
    @DisplayName("更新任务 - 状态变为已完成时设置 completedAt")
    void updateTask_markComplete_setsCompletedAt() {
        Task existing = new Task();
        existing.setId(10L);
        existing.setUserId(1L);
        existing.setStatus(0);
        when(taskMapper.findById(10L)).thenReturn(existing);
        doNothing().when(taskMapper).update(any(Task.class));

        TaskRequest req = new TaskRequest();
        req.setTitle("t");
        req.setStatus(1);

        Task result = taskService.updateTask(1L, 10L, req);

        assertThat(result.getCompletedAt()).isNotNull();
    }

    @Test
    @DisplayName("更新任务时间 - 拖拽修改日期成功")
    void updateTaskTime_succeeds() {
        Task existing = new Task();
        existing.setId(10L);
        existing.setUserId(1L);
        when(taskMapper.findById(10L)).thenReturn(existing);
        doNothing().when(taskMapper).update(any(Task.class));

        TaskTimeRequest req = new TaskTimeRequest();
        req.setStartDate(LocalDateTime.of(2026, 6, 10, 9, 0));
        req.setDueDate(LocalDateTime.of(2026, 6, 10, 18, 0));

        Task result = taskService.updateTaskTime(1L, 10L, req);

        assertThat(result.getStartDate()).isEqualTo(req.getStartDate());
        assertThat(result.getDueDate()).isEqualTo(req.getDueDate());
    }

    @Test
    @DisplayName("更新任务时间 - 截止早于开始抛异常")
    void updateTaskTime_invalidRange_throws() {
        Task existing = new Task();
        existing.setId(10L);
        existing.setUserId(1L);
        when(taskMapper.findById(10L)).thenReturn(existing);

        TaskTimeRequest req = new TaskTimeRequest();
        req.setStartDate(LocalDateTime.of(2026, 6, 10, 18, 0));
        req.setDueDate(LocalDateTime.of(2026, 6, 10, 9, 0));

        assertThatThrownBy(() -> taskService.updateTaskTime(1L, 10L, req))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("删除任务 - 级联删除子任务")
    void deleteTask_cascadesSubtasks() {
        Task parent = new Task();
        parent.setId(10L);
        parent.setUserId(1L);
        Task child = new Task();
        child.setId(11L);
        child.setUserId(1L);
        child.setParentId(10L);
        when(taskMapper.findById(10L)).thenReturn(parent);
        when(taskMapper.findByUserIdAndParentId(1L, 10L)).thenReturn(List.of(child));
        when(taskMapper.findByUserIdAndParentId(1L, 11L)).thenReturn(List.of());

        taskService.deleteTask(1L, 10L);

        verify(taskMapper).deleteById(11L);
        verify(taskMapper).deleteById(10L);
    }

    @Test
    @DisplayName("完成任务 - 设置状态为已完成")
    void completeTask_succeeds() {
        Task existing = new Task();
        existing.setId(10L);
        existing.setUserId(1L);
        when(taskMapper.findById(10L)).thenReturn(existing);
        doNothing().when(taskMapper).update(any(Task.class));

        Task result = taskService.completeTask(1L, 10L);

        assertThat(result.getStatus()).isEqualTo(1);
        assertThat(result.getCompletedAt()).isNotNull();
    }

    @Test
    @DisplayName("取消完成任务 - 清除 completedAt")
    void uncompleteTask_clearsCompletedAt() {
        Task existing = new Task();
        existing.setId(10L);
        existing.setUserId(1L);
        existing.setStatus(1);
        existing.setCompletedAt(LocalDateTime.now());
        when(taskMapper.findById(10L)).thenReturn(existing);
        doNothing().when(taskMapper).update(any(Task.class));

        Task result = taskService.uncompleteTask(1L, 10L);

        assertThat(result.getStatus()).isEqualTo(0);
        assertThat(result.getCompletedAt()).isNull();
    }

    @Test
    @DisplayName("今日任务 - 过滤已完成、过期、未来的任务")
    void getTodayTasks_filtersCorrectly() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        Task todayActive = new Task();
        todayActive.setStatus(0);
        todayActive.setDueDate(endOfDay.minusMinutes(1));
        todayActive.setPriority(2);

        when(taskMapper.findTodayTasks(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(todayActive));

        List<Task> result = taskService.getTodayTasks(1L);

        assertThat(result).containsExactly(todayActive);
    }

    @Test
    @DisplayName("搜索任务 - 委托给 mapper")
    void searchTasks_delegatesToRepository() {
        when(taskMapper.searchTasks(eq(1L), eq("牛奶"), eq(0), eq(20))).thenReturn(List.of());
        when(taskMapper.countSearchTasks(eq(1L), eq("牛奶"))).thenReturn(0L);

        var result = taskService.searchTasks(1L, "牛奶", 0, 20);

        assertThat(result.getContent()).isEmpty();
        verify(taskMapper).searchTasks(eq(1L), eq("牛奶"), eq(0), eq(20));
    }

    @Test
    @DisplayName("按日期范围查询任务 - 委托给 mapper")
    void getTasksByDateRange_delegatesToRepository() {
        LocalDateTime start = LocalDateTime.of(2026, 6, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 6, 30, 23, 59);
        when(taskMapper.findByDateRange(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of(new Task()));

        List<Task> result = taskService.getTasksByDateRange(1L, start, end);

        assertThat(result).hasSize(1);
    }
}

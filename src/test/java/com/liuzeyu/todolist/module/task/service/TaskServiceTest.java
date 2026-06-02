package com.liuzeyu.todolist.module.task.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.task.dto.TaskRequest;
import com.liuzeyu.todolist.module.task.dto.TaskTimeRequest;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskRepository;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class TaskServiceTest extends BaseUnitTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    @Test
    @DisplayName("创建任务 - 正常流程")
    void createTask_succeeds() {
        TaskRequest request = new TaskRequest();
        request.setTitle("买牛奶");
        request.setPriority(3);
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(1L);
            return t;
        });

        Task result = taskService.createTask(1L, request);

        assertThat(result.getTitle()).isEqualTo("买牛奶");
        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getPriority()).isEqualTo(3);
        assertThat(result.getStatus()).isEqualTo(0);
        verify(taskRepository).save(any(Task.class));
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
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        Task result = taskService.createTask(1L, request);

        assertThat(result.getCompletedAt()).isNotNull();
    }

    @Test
    @DisplayName("获取任务详情 - 任务存在且属于用户")
    void getTask_success() {
        Task task = new Task();
        task.setId(10L);
        task.setUserId(1L);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        Task result = taskService.getTask(1L, 10L);

        assertThat(result.getId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("获取任务详情 - 任务不存在抛异常")
    void getTask_notFound_throws() {
        when(taskRepository.findById(10L)).thenReturn(Optional.empty());

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
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

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
        when(taskRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

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
        when(taskRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

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
        when(taskRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

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
        when(taskRepository.findById(10L)).thenReturn(Optional.of(existing));

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
        when(taskRepository.findById(10L)).thenReturn(Optional.of(parent));
        when(taskRepository.findById(11L)).thenReturn(Optional.of(child));
        when(taskRepository.findByUserIdAndParentId(1L, 10L)).thenReturn(List.of(child));
        when(taskRepository.findByUserIdAndParentId(1L, 11L)).thenReturn(List.of());

        taskService.deleteTask(1L, 10L);

        verify(taskRepository).delete(parent);
        verify(taskRepository).delete(child);
    }

    @Test
    @DisplayName("完成任务 - 设置状态为已完成")
    void completeTask_succeeds() {
        Task existing = new Task();
        existing.setId(10L);
        existing.setUserId(1L);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

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
        when(taskRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

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

        Task todayCompleted = new Task();
        todayCompleted.setStatus(1);
        todayCompleted.setDueDate(endOfDay.minusMinutes(1));

        Task overdue = new Task();
        overdue.setStatus(0);
        overdue.setDueDate(startOfDay.minusDays(1));

        Task future = new Task();
        future.setStatus(0);
        future.setStartDate(endOfDay.plusDays(1));

        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of(todayActive, todayCompleted, overdue, future));

        List<Task> result = taskService.getTodayTasks(1L);

        assertThat(result).containsExactly(todayActive);
    }

    @Test
    @DisplayName("搜索任务 - 委托给 repository")
    void searchTasks_delegatesToRepository() {
        org.springframework.data.domain.Page<Task> page = org.springframework.data.domain.Page.empty();
        when(taskRepository.searchTasks(eq(1L), eq("牛奶"), any())).thenReturn(page);

        var result = taskService.searchTasks(1L, "牛奶", 0, 20);

        assertThat(result).isEmpty();
        verify(taskRepository).searchTasks(eq(1L), eq("牛奶"), any());
    }

    @Test
    @DisplayName("按日期范围查询任务 - 委托给 repository")
    void getTasksByDateRange_delegatesToRepository() {
        LocalDateTime start = LocalDateTime.of(2026, 6, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 6, 30, 23, 59);
        when(taskRepository.findByDateRange(1L, start, end)).thenReturn(List.of(new Task()));

        List<Task> result = taskService.getTasksByDateRange(1L, start, end);

        assertThat(result).hasSize(1);
    }
}

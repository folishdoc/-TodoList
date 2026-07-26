package com.liuzeyu.todolist.module.reminder.service;

import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskRepository;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

class ReminderServiceTest extends BaseUnitTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private ReminderService reminderService;

    @Test
    @DisplayName("检查到期任务 - 仅记录日志，不抛异常")
    void checkDueTasks_noThrow() {
        reminderService.checkDueTasks();
        // 无副作用断言
    }

    @Test
    @DisplayName("获取即将到期任务 - 1 小时内未完成的")
    void getUpcomingDueTasks_filtersByTime() {
        LocalDateTime now = LocalDateTime.now();
        Task t1 = new Task();
        t1.setStatus(0);
        t1.setDueDate(now.plusMinutes(30));
        Task t2 = new Task();
        t2.setStatus(0);
        t2.setDueDate(now.plusHours(2));
        Task t3 = new Task();
        t3.setStatus(0);
        t3.setDueDate(null);
        Task t4 = new Task();
        t4.setStatus(1);
        t4.setDueDate(now.plusMinutes(30));
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of(t1, t2, t3, t4));

        List<Task> result = reminderService.getUpcomingDueTasks(1L);

        assertThat(result).containsExactly(t1);
    }

    @Test
    @DisplayName("获取即将到期任务 - 过去的截止时间被过滤")
    void getUpcomingDueTasks_filtersPast() {
        LocalDateTime now = LocalDateTime.now();
        Task past = new Task();
        past.setStatus(0);
        past.setDueDate(now.minusMinutes(30));
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of(past));

        List<Task> result = reminderService.getUpcomingDueTasks(1L);

        assertThat(result).isEmpty();
    }
}

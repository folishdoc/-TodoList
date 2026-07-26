package com.liuzeyu.todolist.module.task.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.liuzeyu.todolist.module.task.dto.RepeatRule;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskRepository;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RepeatTaskServiceTest extends BaseUnitTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private RepeatTaskService repeatTaskService;

    @Test
    @DisplayName("生成重复任务 - 任务未完成不生成")
    void generate_incompleteTask_skipped() {
        Task t = new Task();
        t.setId(1L);
        t.setStatus(0);
        t.setRepeatRule("{\"type\":\"DAILY\"}");
        when(taskRepository.findAll()).thenReturn(List.of(t));

        repeatTaskService.scheduledGenerateRepeatTasks();

        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("生成重复任务 - 已完成任务 DAILY 间隔 1 天")
    void generate_daily_succeeds() {
        LocalDateTime originalDue = LocalDateTime.of(2026, 6, 1, 9, 0);
        Task t = new Task();
        t.setId(1L);
        t.setUserId(1L);
        t.setStatus(1);
        t.setTitle("Daily");
        t.setPriority(2);
        t.setDueDate(originalDue);
        t.setRepeatRule("{\"type\":\"DAILY\",\"interval\":1}");
        when(taskRepository.findAll()).thenReturn(List.of(t));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        repeatTaskService.scheduledGenerateRepeatTasks();

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(captor.capture());
        Task generated = captor.getValue();
        assertThat(generated.getTitle()).isEqualTo("Daily");
        assertThat(generated.getDueDate()).isEqualTo(originalDue.plusDays(1));
        assertThat(generated.getStatus()).isEqualTo(0);
    }

    @Test
    @DisplayName("生成重复任务 - WEEKLY 间隔 1 周")
    void generate_weekly_succeeds() {
        LocalDateTime originalDue = LocalDateTime.of(2026, 6, 1, 9, 0);
        Task t = new Task();
        t.setId(1L);
        t.setStatus(1);
        t.setDueDate(originalDue);
        t.setRepeatRule("{\"type\":\"WEEKLY\",\"interval\":2}");
        when(taskRepository.findAll()).thenReturn(List.of(t));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        repeatTaskService.scheduledGenerateRepeatTasks();

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(captor.capture());
        assertThat(captor.getValue().getDueDate()).isEqualTo(originalDue.plusWeeks(2));
    }

    @Test
    @DisplayName("生成重复任务 - MONTHLY / YEARLY")
    void generate_monthlyYearly() {
        LocalDateTime due = LocalDateTime.of(2026, 6, 1, 9, 0);
        Task monthly = new Task();
        monthly.setId(1L);
        monthly.setStatus(1);
        monthly.setDueDate(due);
        monthly.setRepeatRule("{\"type\":\"MONTHLY\",\"interval\":3}");
        Task yearly = new Task();
        yearly.setId(2L);
        yearly.setStatus(1);
        yearly.setDueDate(due);
        yearly.setRepeatRule("{\"type\":\"YEARLY\",\"interval\":1}");
        when(taskRepository.findAll()).thenReturn(List.of(monthly, yearly));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        repeatTaskService.scheduledGenerateRepeatTasks();

        verify(taskRepository, times(2)).save(any(Task.class));
    }

    @Test
    @DisplayName("生成重复任务 - 超过 endDate 不再生成")
    void generate_pastEndDate_skipped() {
        Task t = new Task();
        t.setId(1L);
        t.setStatus(1);
        t.setRepeatRule("{\"type\":\"DAILY\",\"interval\":1,\"endDate\":\"2020-01-01T00:00:00\"}");
        when(taskRepository.findAll()).thenReturn(List.of(t));

        repeatTaskService.scheduledGenerateRepeatTasks();

        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("生成重复任务 - 无效 JSON 跳过该任务但不影响其他")
    void generate_invalidJson_skipsThatTask() {
        Task bad = new Task();
        bad.setId(1L);
        bad.setStatus(1);
        bad.setRepeatRule("not-json");
        when(taskRepository.findAll()).thenReturn(List.of(bad));

        repeatTaskService.scheduledGenerateRepeatTasks();

        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("设置重复规则 - 序列化为 JSON 保存")
    void setRepeatRule_serializesJson() throws JsonProcessingException {
        Task t = new Task();
        t.setId(1L);
        when(taskRepository.findById(1L)).thenReturn(java.util.Optional.of(t));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        RepeatRule rule = new RepeatRule();
        rule.setType("DAILY");
        rule.setInterval(2);

        repeatTaskService.setRepeatRule(1L, rule);

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(captor.capture());
        assertThat(captor.getValue().getRepeatRule()).contains("DAILY").contains("2");
    }

    @Test
    @DisplayName("设置重复规则 - 任务不存在抛异常")
    void setRepeatRule_notFound_throws() {
        when(taskRepository.findById(1L)).thenReturn(java.util.Optional.empty());

        RepeatRule rule = new RepeatRule();
        rule.setType("DAILY");
        assertThatThrownBy(() -> repeatTaskService.setRepeatRule(1L, rule))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("任务不存在");
    }

    @Test
    @DisplayName("取消重复规则 - 任务不存在抛异常")
    void cancelRepeatRule_notFound_throws() {
        when(taskRepository.findById(1L)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> repeatTaskService.cancelRepeatRule(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("任务不存在");
    }

    @Test
    @DisplayName("取消重复规则 - 正常")
    void cancelRepeatRule_succeeds() {
        Task t = new Task();
        t.setId(1L);
        t.setRepeatRule("{\"type\":\"DAILY\"}");
        when(taskRepository.findById(1L)).thenReturn(java.util.Optional.of(t));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        repeatTaskService.cancelRepeatRule(1L);

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(captor.capture());
        assertThat(captor.getValue().getRepeatRule()).isNull();
    }
}

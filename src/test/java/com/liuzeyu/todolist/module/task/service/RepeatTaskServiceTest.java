package com.liuzeyu.todolist.module.task.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.liuzeyu.todolist.module.task.dto.RepeatRule;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskMapper;
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
    private TaskMapper taskMapper;

    @InjectMocks
    private RepeatTaskService repeatTaskService;

    @Test
    @DisplayName("生成重复任务 - 任务未完成不生成")
    void generate_incompleteTask_skipped() {
            Task t = new Task();
            t.setId(1L);
            t.setStatus(0);
            t.setRepeatRule("{\"type\":\"DAILY\"}");
            when(taskMapper.findAll()).thenReturn(List.of(t));

            repeatTaskService.scheduledGenerateRepeatTasks();

            verify(taskMapper, never()).insert(any());
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
            when(taskMapper.findAll()).thenReturn(List.of(t));
            doNothing().when(taskMapper).insert(any(Task.class));

            repeatTaskService.scheduledGenerateRepeatTasks();

            ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
            verify(taskMapper).insert(captor.capture());
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
            when(taskMapper.findAll()).thenReturn(List.of(t));
            doNothing().when(taskMapper).insert(any(Task.class));

            repeatTaskService.scheduledGenerateRepeatTasks();

            ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
            verify(taskMapper).insert(captor.capture());
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
            when(taskMapper.findAll()).thenReturn(List.of(monthly, yearly));
            doNothing().when(taskMapper).insert(any(Task.class));

            repeatTaskService.scheduledGenerateRepeatTasks();

            verify(taskMapper, times(2)).insert(any(Task.class));
        }

        @Test
        @DisplayName("生成重复任务 - 超过 endDate 不再生成")
        void generate_pastEndDate_skipped() {
            Task t = new Task();
            t.setId(1L);
            t.setStatus(1);
            t.setRepeatRule("{\"type\":\"DAILY\",\"interval\":1,\"endDate\":\"2020-01-01T00:00:00\"}");
            when(taskMapper.findAll()).thenReturn(List.of(t));

            repeatTaskService.scheduledGenerateRepeatTasks();

            verify(taskMapper, never()).insert(any());
        }

        @Test
        @DisplayName("生成重复任务 - 无效 JSON 跳过该任务但不影响其他")
        void generate_invalidJson_skipsThatTask() {
            Task bad = new Task();
            bad.setId(1L);
            bad.setStatus(1);
            bad.setRepeatRule("not-json");
            when(taskMapper.findAll()).thenReturn(List.of(bad));

            repeatTaskService.scheduledGenerateRepeatTasks();

            verify(taskMapper, never()).insert(any());
        }

        @Test
        @DisplayName("设置重复规则 - 序列化为 JSON 保存")
        void setRepeatRule_serializesJson() throws JsonProcessingException {
            Task t = new Task();
            t.setId(1L);
            when(taskMapper.findById(1L)).thenReturn(t);
            doNothing().when(taskMapper).update(any(Task.class));

            RepeatRule rule = new RepeatRule();
            rule.setType("DAILY");
            rule.setInterval(2);

            repeatTaskService.setRepeatRule(1L, rule);

            ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
            verify(taskMapper).update(captor.capture());
            assertThat(captor.getValue().getRepeatRule()).contains("DAILY").contains("2");
        }

        @Test
        @DisplayName("设置重复规则 - 任务不存在抛异常")
        void setRepeatRule_notFound_throws() {
            when(taskMapper.findById(1L)).thenReturn(null);

            RepeatRule rule = new RepeatRule();
            rule.setType("DAILY");
            assertThatThrownBy(() -> repeatTaskService.setRepeatRule(1L, rule))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("任务不存在");
        }

        @Test
        @DisplayName("取消重复规则 - 任务不存在抛异常")
        void cancelRepeatRule_notFound_throws() {
            when(taskMapper.findById(1L)).thenReturn(null);

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
            when(taskMapper.findById(1L)).thenReturn(t);
            doNothing().when(taskMapper).update(any(Task.class));

            repeatTaskService.cancelRepeatRule(1L);

            ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
            verify(taskMapper).update(captor.capture());
            assertThat(captor.getValue().getRepeatRule()).isNull();
        }
}

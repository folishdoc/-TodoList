package com.liuzeyu.todolist.module.task.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.liuzeyu.todolist.common.constant.TaskStatusEnum;
import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.task.dto.RepeatRule;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskMapper;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RepeatTaskServiceTest extends BaseUnitTest {

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private TaskService taskService;

    private RepeatTaskService repeatTaskService;

    @BeforeEach
    void setUp() {
        // 模拟桌面版（无 Redis 锁）：Optional.empty() 走 lastGenerateDate 降级路径
        repeatTaskService = new RepeatTaskService(taskMapper, taskService, Optional.empty());
    }

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
            LocalDateTime originalDue = LocalDateTime.now().plusDays(1);
            Task t = new Task();
            t.setId(1L);
            t.setUserId(1L);
            t.setStatus(1);
            t.setTitle("Daily");
            t.setPriority(2);
            t.setDueDate(originalDue);
            t.setRepeatRule("{\"type\":\"DAILY\",\"interval\":1}");
            when(taskMapper.findAll()).thenReturn(List.of(t));
            when(taskMapper.insert(any(Task.class))).thenReturn(1);
            when(taskMapper.update(any(Task.class))).thenReturn(1);

            repeatTaskService.scheduledGenerateRepeatTasks();

            ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
            verify(taskMapper).insert(captor.capture());
            Task generated = captor.getValue();
            assertThat(generated.getTitle()).isEqualTo("Daily");
            assertThat(generated.getDueDate()).isEqualTo(originalDue.plusDays(1));
            assertThat(generated.getStatus()).isEqualTo(0);
            // 接力：原任务 repeatRule 被清除，避免定时任务重复生成
            assertThat(t.getRepeatRule()).isNull();
        }

        @Test
        @DisplayName("生成重复任务 - 过期任务追赶：新任务日期在未来")
        void generate_overdue_catchesUpToFuture() {
            LocalDateTime before = LocalDateTime.now().minusSeconds(1);
            Task t = new Task();
            t.setId(1L);
            t.setUserId(1L);
            t.setStatus(1);
            t.setTitle("Overdue");
            t.setDueDate(LocalDateTime.now().minusDays(100));
            t.setRepeatRule("{\"type\":\"DAILY\",\"interval\":1}");
            when(taskMapper.findAll()).thenReturn(List.of(t));
            when(taskMapper.insert(any(Task.class))).thenReturn(1);
            when(taskMapper.update(any(Task.class))).thenReturn(1);

            repeatTaskService.scheduledGenerateRepeatTasks();

            ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
            verify(taskMapper).insert(captor.capture());
            Task generated = captor.getValue();
            // 过期任务完成后新任务应落在未来，而不是仍然过期
            assertThat(generated.getDueDate()).isAfter(before);
            assertThat(generated.getDueDate()).isBefore(LocalDateTime.now().plusDays(1));
            assertThat(t.getRepeatRule()).isNull();
        }

        @Test
        @DisplayName("生成重复任务 - WEEKLY 间隔 1 周")
        void generate_weekly_succeeds() {
            LocalDateTime originalDue = LocalDateTime.now().plusDays(1);
            Task t = new Task();
            t.setId(1L);
            t.setStatus(1);
            t.setDueDate(originalDue);
            t.setRepeatRule("{\"type\":\"WEEKLY\",\"interval\":2}");
            when(taskMapper.findAll()).thenReturn(List.of(t));
            when(taskMapper.insert(any(Task.class))).thenReturn(1);
            when(taskMapper.update(any(Task.class))).thenReturn(1);

            repeatTaskService.scheduledGenerateRepeatTasks();

            ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
            verify(taskMapper).insert(captor.capture());
            assertThat(captor.getValue().getDueDate()).isEqualTo(originalDue.plusWeeks(2));
        }

        @Test
        @DisplayName("生成重复任务 - MONTHLY / YEARLY")
        void generate_monthlyYearly() {
            LocalDateTime due = LocalDateTime.now().plusDays(1);
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
            when(taskMapper.insert(any(Task.class))).thenReturn(1);
            when(taskMapper.update(any(Task.class))).thenReturn(1);

            repeatTaskService.scheduledGenerateRepeatTasks();

            verify(taskMapper, times(2)).insert(any(Task.class));
            assertThat(monthly.getRepeatRule()).isNull();
            assertThat(yearly.getRepeatRule()).isNull();
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
            t.setUserId(1L);
            when(taskService.getTask(1L, 1L)).thenReturn(t);
            when(taskMapper.update(any(Task.class))).thenReturn(1);

            RepeatRule rule = new RepeatRule();
            rule.setType("DAILY");
            rule.setInterval(2);

            repeatTaskService.setRepeatRule(1L, 1L, rule);

            ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
            verify(taskMapper).update(captor.capture());
            assertThat(captor.getValue().getRepeatRule()).contains("DAILY").contains("2");
        }

        @Test
        @DisplayName("设置重复规则 - 任务不存在抛异常")
        void setRepeatRule_notFound_throws() {
            when(taskService.getTask(1L, 1L))
                    .thenThrow(new BusinessException(404, "任务不存在"));

            RepeatRule rule = new RepeatRule();
            rule.setType("DAILY");
            assertThatThrownBy(() -> repeatTaskService.setRepeatRule(1L, 1L, rule))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("任务不存在");
        }

        @Test
        @DisplayName("设置重复规则 - 无权访问抛异常")
        void setRepeatRule_wrongUser_throws() {
            when(taskService.getTask(2L, 1L))
                    .thenThrow(new BusinessException(403, "无权访问该任务"));

            RepeatRule rule = new RepeatRule();
            rule.setType("DAILY");
            assertThatThrownBy(() -> repeatTaskService.setRepeatRule(2L, 1L, rule))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("无权访问该任务");
        }

        @Test
        @DisplayName("取消重复规则 - 任务不存在抛异常")
        void cancelRepeatRule_notFound_throws() {
            when(taskService.getTask(1L, 1L))
                    .thenThrow(new BusinessException(404, "任务不存在"));

            assertThatThrownBy(() -> repeatTaskService.cancelRepeatRule(1L, 1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("任务不存在");
        }

        @Test
        @DisplayName("取消重复规则 - 正常")
        void cancelRepeatRule_succeeds() {
            Task t = new Task();
            t.setId(1L);
            t.setUserId(1L);
            t.setRepeatRule("{\"type\":\"DAILY\"}");
            when(taskService.getTask(1L, 1L)).thenReturn(t);
            when(taskMapper.update(any(Task.class))).thenReturn(1);

            repeatTaskService.cancelRepeatRule(1L, 1L);

            ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
            verify(taskMapper).update(captor.capture());
            assertThat(captor.getValue().getRepeatRule()).isNull();
        }

        @Test
        @DisplayName("完成事件接力 - 生成下一条并清除原任务规则")
        void generateNextForTask_createsNextAndClearsRule() {
            LocalDateTime originalDue = LocalDateTime.now().plusDays(1);
            Task completed = new Task();
            completed.setId(1L);
            completed.setUserId(1L);
            completed.setTitle("Daily");
            completed.setStatus(TaskStatusEnum.COMPLETE.getCode());
            completed.setDueDate(originalDue);
            completed.setRepeatRule("{\"type\":\"DAILY\",\"interval\":1}");
            when(taskMapper.insert(any(Task.class))).thenReturn(1);
            when(taskMapper.update(any(Task.class))).thenReturn(1);

            repeatTaskService.generateNextForTask(completed);

            ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
            verify(taskMapper).insert(captor.capture());
            Task generated = captor.getValue();
            assertThat(generated.getStatus()).isEqualTo(0);
            assertThat(generated.getDueDate()).isEqualTo(originalDue.plusDays(1));
            // 规则传递给新任务
            assertThat(generated.getRepeatRule()).isEqualTo("{\"type\":\"DAILY\",\"interval\":1}");
            // 原任务规则被清除（接力），避免定时任务重复生成
            assertThat(completed.getRepeatRule()).isNull();
            verify(taskMapper).update(completed);
        }

        @Test
        @DisplayName("完成事件接力 - 过期循环任务：下一条日期在未来")
        void generateNextForTask_overdue_catchesUpToFuture() {
            LocalDateTime before = LocalDateTime.now().minusSeconds(1);
            Task completed = new Task();
            completed.setId(1L);
            completed.setUserId(1L);
            completed.setTitle("Overdue");
            completed.setStatus(TaskStatusEnum.COMPLETE.getCode());
            completed.setDueDate(LocalDateTime.now().minusDays(100));
            completed.setRepeatRule("{\"type\":\"WEEKLY\",\"interval\":1}");
            when(taskMapper.insert(any(Task.class))).thenReturn(1);
            when(taskMapper.update(any(Task.class))).thenReturn(1);

            repeatTaskService.generateNextForTask(completed);

            ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
            verify(taskMapper).insert(captor.capture());
            Task generated = captor.getValue();
            assertThat(generated.getDueDate()).isAfter(before);
            assertThat(generated.getDueDate()).isBefore(LocalDateTime.now().plusWeeks(1));
            assertThat(completed.getRepeatRule()).isNull();
        }

        @Test
        @DisplayName("完成事件接力 - 未完成的任务不生成")
        void generateNextForTask_incomplete_skipped() {
            Task t = new Task();
            t.setId(1L);
            t.setStatus(TaskStatusEnum.INCOMPLETE.getCode());
            t.setRepeatRule("{\"type\":\"DAILY\"}");

            repeatTaskService.generateNextForTask(t);

            verify(taskMapper, never()).insert(any());
            verify(taskMapper, never()).update(any());
        }

        @Test
        @DisplayName("完成事件接力 - 无重复规则不生成")
        void generateNextForTask_noRule_skipped() {
            Task t = new Task();
            t.setId(1L);
            t.setStatus(TaskStatusEnum.COMPLETE.getCode());
            t.setRepeatRule(null);

            repeatTaskService.generateNextForTask(t);

            verify(taskMapper, never()).insert(any());
            verify(taskMapper, never()).update(any());
        }
}

package com.liuzeyu.todolist.module.task.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.liuzeyu.todolist.module.task.dto.RepeatRule;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskMapper;
import com.liuzeyu.todolist.module.task.service.RepeatTaskService;
import com.liuzeyu.todolist.support.BaseIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 重复任务集成测试 — 验证 RepeatTaskService.scheduledGenerateRepeatTasks() 的实例生成逻辑。
 *
 * 关键约束（来自 RepeatTaskService 实现）：
 *  - 只有 status=1（已完成）的任务才会触发新实例生成
 *  - 不会清空旧实例，每次完成都生成一个新的、未完成（status=0）的副本
 */
@DisplayName("重复任务集成测试 - Testcontainers MySQL")
class RepeatTaskIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private TaskMapper taskMapper;

    @Autowired
    private RepeatTaskService repeatTaskService;

    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    @DisplayName("已完成 + 每日重复：调用 generateRepeatTasks() → 生成新的未完成实例")
    void completedDailyRepeatGeneratesNewInstance() throws Exception {
        String unique = UUID.randomUUID().toString().substring(0, 8);

        Task parent = new Task();
        parent.setUserId(1L);
        parent.setTitle("每日重复-" + unique);
        parent.setStatus(1);  // 已完成才会触发
        parent.setPriority(2);
        parent.setDueDate(LocalDateTime.now().minusDays(1));
        parent.setStartDate(LocalDateTime.now().minusDays(1));

        RepeatRule rule = new RepeatRule();
        rule.setType("DAILY");
        rule.setInterval(1);
        parent.setRepeatRule(mapper.writeValueAsString(rule));
        taskMapper.insert(parent);
        final String parentTitle = parent.getTitle();
        final Long parentId = parent.getId();

        long before = taskMapper.findAll().size();
        repeatTaskService.scheduledGenerateRepeatTasks();
        long after = taskMapper.findAll().size();

        assertThat(after).isEqualTo(before + 1);

        // 验证新实例存在：标题相同，状态=0，dueDate 在未来
        List<Task> allByTitle = taskMapper.findByUserIdAndStatus(1L, 0).stream()
                .filter(t -> t.getTitle().equals(parentTitle))
                .toList();
        assertThat(allByTitle).isNotEmpty();
        Task generated = allByTitle.get(0);
        assertThat(generated.getStatus()).isEqualTo(0);
        assertThat(generated.getDueDate()).isAfter(LocalDateTime.now().minusHours(1));

        // 清理
        taskMapper.deleteById(generated.getId());
        taskMapper.deleteById(parentId);
    }

    @Test
    @DisplayName("未完成重复任务：不生成新实例")
    void uncompletedRepeatTaskGeneratesNothing() throws Exception {
        String unique = UUID.randomUUID().toString().substring(0, 8);

        Task task = new Task();
        task.setUserId(1L);
        task.setTitle("未完成重复-" + unique);
        task.setStatus(0);  // 未完成
        task.setPriority(2);
        task.setDueDate(LocalDateTime.now().minusDays(1));

        RepeatRule rule = new RepeatRule();
        rule.setType("DAILY");
        rule.setInterval(1);
        task.setRepeatRule(mapper.writeValueAsString(rule));
        taskMapper.insert(task);
        final Long taskId = task.getId();

        long before = taskMapper.findAll().size();
        repeatTaskService.scheduledGenerateRepeatTasks();
        long after = taskMapper.findAll().size();

        // 未完成不生成
        assertThat(after).isEqualTo(before);

        taskMapper.deleteById(taskId);
    }

    @Test
    @DisplayName("非重复任务（repeatRule=null）：不生成新实例")
    void nonRepeatTaskGeneratesNothing() {
        String unique = UUID.randomUUID().toString().substring(0, 8);

        Task task = new Task();
        task.setUserId(1L);
        task.setTitle("普通任务-" + unique);
        task.setStatus(1);
        task.setPriority(2);
        task.setDueDate(LocalDateTime.now().minusDays(1));
        task.setRepeatRule(null);
        taskMapper.insert(task);

        long before = taskMapper.findAll().size();
        repeatTaskService.scheduledGenerateRepeatTasks();
        long after = taskMapper.findAll().size();

        assertThat(after).isEqualTo(before);

        taskMapper.deleteById(task.getId());
    }

    @Test
    @DisplayName("周重复：已完成后 → 新实例 dueDate +7天")
    void weeklyRepeatGeneratesInstanceWithWeeklyOffset() throws Exception {
        String unique = UUID.randomUUID().toString().substring(0, 8);

        LocalDateTime originalDue = LocalDateTime.of(2026, 6, 1, 10, 0);
        Task task = new Task();
        task.setUserId(1L);
        task.setTitle("周重复-" + unique);
        task.setStatus(1);
        task.setPriority(2);
        task.setDueDate(originalDue);

        RepeatRule rule = new RepeatRule();
        rule.setType("WEEKLY");
        rule.setInterval(1);
        task.setRepeatRule(mapper.writeValueAsString(rule));
        taskMapper.insert(task);
        final String weeklyTitle = task.getTitle();
        final Long weeklyId = task.getId();

        repeatTaskService.scheduledGenerateRepeatTasks();

        List<Task> generated = taskMapper.findByUserIdAndStatus(1L, 0).stream()
                .filter(t -> t.getTitle().equals(weeklyTitle))
                .toList();
        assertThat(generated).hasSize(1);
        assertThat(generated.get(0).getDueDate()).isEqualTo(originalDue.plusWeeks(1));

        // 清理
        taskMapper.deleteById(generated.get(0).getId());
        taskMapper.deleteById(weeklyId);
    }
}

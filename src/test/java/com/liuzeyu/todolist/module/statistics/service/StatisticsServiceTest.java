package com.liuzeyu.todolist.module.statistics.service;

import com.liuzeyu.todolist.module.list.entity.TaskList;
import com.liuzeyu.todolist.module.list.mapper.TaskListRepository;
import com.liuzeyu.todolist.module.statistics.dto.DailyTaskStats;
import com.liuzeyu.todolist.module.statistics.dto.TaskDistribution;
import com.liuzeyu.todolist.module.statistics.dto.TaskStatistics;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskRepository;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

class StatisticsServiceTest extends BaseUnitTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskListRepository taskListRepository;

    @InjectMocks
    private StatisticsService statisticsService;

    private Task createTask(Long id, int status, int priority, LocalDateTime dueDate) {
        Task t = new Task();
        t.setId(id);
        t.setUserId(1L);
        t.setStatus(status);
        t.setPriority(priority);
        t.setDueDate(dueDate);
        t.setCreatedAt(LocalDateTime.now().minusDays(1));
        t.setCompletedAt(status == 1 ? LocalDateTime.now() : null);
        return t;
    }

    @Test
    @DisplayName("任务总览 - 全部统计字段正确")
    void getTaskStatistics_succeeds() {
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of(
                createTask(1L, 1, 3, LocalDate.now().atStartOfDay()),
                createTask(2L, 0, 2, LocalDate.now().plusDays(1).atStartOfDay()),
                createTask(3L, 0, 1, null)
        ));

        TaskStatistics stats = statisticsService.getTaskStatistics(1L);

        assertThat(stats.getTotalTasks()).isEqualTo(3);
        assertThat(stats.getCompletedTasks()).isEqualTo(1);
        assertThat(stats.getPendingTasks()).isEqualTo(2);
        assertThat(stats.getHighPriority()).isEqualTo(1);
        assertThat(stats.getMediumPriority()).isEqualTo(1);
        assertThat(stats.getLowPriority()).isEqualTo(1);
        assertThat(stats.getCompletionRate()).isCloseTo(33.33, org.assertj.core.data.Offset.offset(0.1));
    }

    @Test
    @DisplayName("任务总览 - 空列表完成率为 0")
    void getTaskStatistics_empty() {
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of());

        TaskStatistics stats = statisticsService.getTaskStatistics(1L);

        assertThat(stats.getTotalTasks()).isEqualTo(0);
        assertThat(stats.getCompletionRate()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("按清单分布 - 跳过空清单")
    void getTasksByList_skipsEmpty() {
        Task t = new Task();
        t.setListId(1L);
        TaskList list1 = new TaskList();
        list1.setId(1L);
        list1.setName("工作");
        TaskList list2 = new TaskList();
        list2.setId(2L);
        list2.setName("生活");
        when(taskListRepository.findByUserId(1L)).thenReturn(List.of(list1, list2));
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of(t));

        List<TaskDistribution> dist = statisticsService.getTasksByList(1L);

        assertThat(dist).hasSize(1);
        assertThat(dist.get(0).getName()).isEqualTo("工作");
    }

    @Test
    @DisplayName("按优先级分布 - 只返回非空桶")
    void getTasksByPriority_skipsEmpty() {
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of(
                createTask(1L, 0, 3, null),
                createTask(2L, 0, 3, null)
        ));

        List<TaskDistribution> dist = statisticsService.getTasksByPriority(1L);

        assertThat(dist).hasSize(1);
        assertThat(dist.get(0).getName()).isEqualTo("高优先级");
        assertThat(dist.get(0).getCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("任务趋势 - 7 天窗口")
    void getDailyTrend_succeeds() {
        LocalDateTime now = LocalDateTime.now();
        Task t1 = new Task();
        t1.setCreatedAt(now.minusDays(2));
        t1.setCompletedAt(now.minusDays(2).plusHours(1));
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of(t1));

        List<DailyTaskStats> trend = statisticsService.getDailyTrend(1L, 7);

        assertThat(trend).hasSize(7);
        assertThat(trend).allSatisfy(s -> assertThat(s.getCreated()).isGreaterThanOrEqualTo(0));
    }
}

package com.liuzeyu.todolist.module.statistics.service;

import com.liuzeyu.todolist.module.list.entity.TaskList;
import com.liuzeyu.todolist.module.list.mapper.TaskListMapper;
import com.liuzeyu.todolist.module.statistics.dto.DailyTaskStats;
import com.liuzeyu.todolist.module.statistics.dto.TaskDistribution;
import com.liuzeyu.todolist.module.statistics.dto.TaskStatistics;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskMapper;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class StatisticsServiceTest extends BaseUnitTest {

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private TaskListMapper taskListMapper;

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
        LocalDate today = LocalDate.now();
        when(taskMapper.countByUserId(1L)).thenReturn(3L);
        when(taskMapper.countByUserIdAndStatus(1L, 1)).thenReturn(1L);
        when(taskMapper.countByUserIdGroupByPriority(1L)).thenReturn(List.of(
                new Object[]{3, 1L}, new Object[]{2, 1L}, new Object[]{1, 1L}
        ));
        when(taskMapper.countByUserIdAndDueDateBetween(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(1L);
        when(taskMapper.countByUserIdAndDueDateAfter(eq(1L), any(LocalDateTime.class))).thenReturn(1L);

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
        when(taskMapper.countByUserId(1L)).thenReturn(0L);
        when(taskMapper.countByUserIdAndStatus(1L, 1)).thenReturn(0L);
        when(taskMapper.countByUserIdGroupByPriority(1L)).thenReturn(List.of());
        when(taskMapper.countByUserIdAndDueDateBetween(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(0L);
        when(taskMapper.countByUserIdAndDueDateAfter(eq(1L), any(LocalDateTime.class))).thenReturn(0L);

        TaskStatistics stats = statisticsService.getTaskStatistics(1L);

        assertThat(stats.getTotalTasks()).isEqualTo(0);
        assertThat(stats.getCompletionRate()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("按清单分布 - 跳过空清单")
    void getTasksByList_skipsEmpty() {
        TaskList list1 = new TaskList();
        list1.setId(1L);
        list1.setName("工作");
        TaskList list2 = new TaskList();
        list2.setId(2L);
        list2.setName("生活");
        when(taskListMapper.findByUserId(1L)).thenReturn(List.of(list1, list2));
        when(taskMapper.countByUserIdGroupByListId(1L)).thenReturn(Collections.singletonList(new Object[]{1L, 1L}));

        List<TaskDistribution> dist = statisticsService.getTasksByList(1L);

        assertThat(dist).hasSize(1);
        assertThat(dist.get(0).getName()).isEqualTo("工作");
    }

    @Test
    @DisplayName("按优先级分布 - 只返回非空桶")
    void getTasksByPriority_skipsEmpty() {
        when(taskMapper.countByUserIdGroupByPriority(1L)).thenReturn(Collections.singletonList(new Object[]{3, 2L}));

        List<TaskDistribution> dist = statisticsService.getTasksByPriority(1L);

        assertThat(dist).hasSize(1);
        assertThat(dist.get(0).getName()).isEqualTo("高优先级");
        assertThat(dist.get(0).getCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("任务趋势 - 7 天窗口")
    void getDailyTrend_succeeds() {
        LocalDate twoDaysAgo = LocalDate.now().minusDays(2);
        when(taskMapper.countCreatedByDateAfter(eq(1L), any(LocalDateTime.class)))
                .thenReturn(Collections.singletonList(new Object[]{twoDaysAgo, 1L}));
        when(taskMapper.countCompletedByDateAfter(eq(1L), any(LocalDateTime.class)))
                .thenReturn(Collections.singletonList(new Object[]{twoDaysAgo, 1L}));

        List<DailyTaskStats> trend = statisticsService.getDailyTrend(1L, 7);

        assertThat(trend).hasSize(7);
        assertThat(trend).allSatisfy(s -> assertThat(s.getCreated()).isGreaterThanOrEqualTo(0));
    }
}

package com.liuzeyu.todolist.module.statistics.controller;

import com.liuzeyu.todolist.module.statistics.dto.DailyTaskStats;
import com.liuzeyu.todolist.module.statistics.dto.TaskDistribution;
import com.liuzeyu.todolist.module.statistics.dto.TaskStatistics;
import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class StatisticsControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("GET /api/statistics/overview")
    void overview_succeeds() throws Exception {
        TaskStatistics stats = new TaskStatistics(10L, 5L, 5L, 50.0, 2L, 5L, 3L, 1L, 2L);
        when(statisticsService.getTaskStatistics(1L)).thenReturn(stats);

        doGet("/api/statistics/overview")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalTasks").value(10))
                .andExpect(jsonPath("$.data.completionRate").value(50.0));
    }

    @Test
    @DisplayName("GET /api/statistics/by-list")
    void byList_succeeds() throws Exception {
        when(statisticsService.getTasksByList(1L))
                .thenReturn(List.of(new TaskDistribution("Work", 5L, "#FF6B6B")));

        doGet("/api/statistics/by-list")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Work"));
    }

    @Test
    @DisplayName("GET /api/statistics/by-priority")
    void byPriority_succeeds() throws Exception {
        when(statisticsService.getTasksByPriority(1L))
                .thenReturn(List.of(new TaskDistribution("High", 3L, "#FF6B6B")));

        doGet("/api/statistics/by-priority")
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/statistics/trend - default 7 days")
    void trend_defaultDays() throws Exception {
        when(statisticsService.getDailyTrend(1L, 7))
                .thenReturn(List.of(new DailyTaskStats(LocalDate.now(), 0L, 0L)));

        doGet("/api/statistics/trend")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].created").value(0));
    }

    @Test
    @DisplayName("GET /api/statistics/trend - custom days")
    void trend_customDays() throws Exception {
        when(statisticsService.getDailyTrend(1L, 30)).thenReturn(List.of());

        doGet("/api/statistics/trend?days=30")
                .andExpect(status().isOk());
    }
}

package com.liuzeyu.todolist.module.task.controller;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.task.dto.TaskRequest;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TaskControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("GET /api/tasks - returns 200 with task list")
    void getTasks_returnsOk() throws Exception {
        Task task = new Task();
        task.setId(1L);
        when(taskService.getTasks(eq(1L), eq(0), eq(20))).thenReturn(new PageImpl<>(List.of(task)));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("POST /api/tasks - create task succeeds")
    void createTask_succeeds() throws Exception {
        Task task = new Task();
        task.setId(1L);
        task.setTitle("Buy milk");
        when(taskService.createTask(eq(1L), any(TaskRequest.class))).thenReturn(task);

        String body = """
                {
                  "title": "Buy milk",
                  "priority": 3
                }
                """;
        mockMvc.perform(authPost("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.title").value("Buy milk"));
    }

    @Test
    @DisplayName("POST /api/tasks - blank title returns 400")
    void createTask_blankTitle_returns400() throws Exception {
        String body = "{ \"title\": \"\" }";
        mockMvc.perform(authPost("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/tasks - list returns page")
    void getTasks_succeeds() throws Exception {
        Task task = new Task();
        task.setId(1L);
        Page<Task> page = new PageImpl<>(List.of(task));
        when(taskService.getTasks(eq(1L), eq(0), eq(20))).thenReturn(page);

        doGet("/api/tasks")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(1));
    }

    @Test
    @DisplayName("GET /api/tasks/{id} - not found")
    void getTask_notFound() throws Exception {
        when(taskService.getTask(eq(1L), eq(99L))).thenThrow(new BusinessException("Task not found"));

        doGet("/api/tasks/{id}", 99L)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(500))
                .andExpect(jsonPath("$.message").value("Task not found"));
    }

    @Test
    @DisplayName("PUT /api/tasks/{id} - update task")
    void updateTask_succeeds() throws Exception {
        Task task = new Task();
        task.setId(1L);
        task.setTitle("updated");
        when(taskService.updateTask(eq(1L), eq(1L), any())).thenReturn(task);

        mockMvc.perform(authPut("/api/tasks/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"title\": \"updated\", \"priority\": 1 }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("updated"));
    }

    @Test
    @DisplayName("PATCH /api/tasks/{id}/complete - mark complete")
    void completeTask_succeeds() throws Exception {
        Task task = new Task();
        task.setId(1L);
        task.setStatus(1);
        when(taskService.completeTask(eq(1L), eq(1L))).thenReturn(task);

        doPatch("/api/tasks/{id}/complete", 1L)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value(1));
    }

    @Test
    @DisplayName("DELETE /api/tasks/{id} - delete task")
    void deleteTask_succeeds() throws Exception {
        doNothing().when(taskService).deleteTask(eq(1L), eq(1L));

        doDelete("/api/tasks/{id}", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/tasks/today - today tasks")
    void getTodayTasks_succeeds() throws Exception {
        when(taskService.getTodayTasks(1L)).thenReturn(List.of(new Task()));

        doGet("/api/tasks/today")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET /api/tasks/upcoming - upcoming tasks")
    void getUpcomingTasks_succeeds() throws Exception {
        when(taskService.getUpcomingTasks(1L)).thenReturn(List.of());

        doGet("/api/tasks/upcoming")
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/tasks/search - search tasks")
    void searchTasks_succeeds() throws Exception {
        when(taskService.searchTasks(eq(1L), eq("milk"), eq(0), eq(20)))
                .thenReturn(new PageImpl<>(List.of()));

        doGet("/api/tasks/search?keyword=milk")
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/tasks/range - date range query")
    void getTasksByDateRange_succeeds() throws Exception {
        when(taskService.getTasksByDateRange(eq(1L), any(), any())).thenReturn(List.of());

        doGet("/api/tasks/range?start=2026-06-01T00:00:00&end=2026-06-30T23:59:59")
                .andExpect(status().isOk());
    }
}

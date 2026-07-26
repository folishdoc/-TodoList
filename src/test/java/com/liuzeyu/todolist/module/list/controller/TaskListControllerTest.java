package com.liuzeyu.todolist.module.list.controller;

import com.liuzeyu.todolist.module.list.dto.TaskListRequest;
import com.liuzeyu.todolist.module.list.entity.TaskList;
import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TaskListControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("POST /api/lists - create")
    void create_succeeds() throws Exception {
        TaskList l = new TaskList();
        l.setId(1L);
        l.setName("Work");
        when(taskListService.createTaskList(eq(1L), any(TaskListRequest.class))).thenReturn(l);

        mockMvc.perform(authPost("/api/lists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"name\": \"Work\", \"color\": \"#FF0000\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("GET /api/lists - list")
    void list_succeeds() throws Exception {
        when(taskListService.getTaskLists(1L)).thenReturn(List.of(new TaskList()));

        doGet("/api/lists")
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/lists/{id} - detail")
    void get_succeeds() throws Exception {
        TaskList l = new TaskList();
        l.setId(1L);
        when(taskListService.getTaskList(1L, 1L)).thenReturn(l);

        doGet("/api/lists/{id}", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/lists/{id} - update")
    void update_succeeds() throws Exception {
        TaskList l = new TaskList();
        l.setId(1L);
        when(taskListService.updateTaskList(eq(1L), eq(1L), any())).thenReturn(l);

        mockMvc.perform(authPut("/api/lists/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"name\": \"updated\", \"color\": \"#00FF00\" }"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/lists/{id} - delete")
    void delete_succeeds() throws Exception {
        doNothing().when(taskListService).deleteTaskList(1L, 1L);

        doDelete("/api/lists/{id}", 1L)
                .andExpect(status().isOk());
    }
}

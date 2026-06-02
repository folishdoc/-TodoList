package com.liuzeyu.todolist.module.anniversary.controller;

import com.liuzeyu.todolist.module.anniversary.dto.AnniversaryRequest;
import com.liuzeyu.todolist.module.anniversary.dto.AnniversaryVO;
import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AnniversaryControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("GET /api/anniversaries - list")
    void list_succeeds() throws Exception {
        AnniversaryVO vo = new AnniversaryVO(1L, "Birthday", LocalDate.now(), "NONE", false, "0", "09:00", null, null, LocalDate.now(), 0L, List.of());
        when(anniversaryService.list(eq(1L), any(), any(), any(), any())).thenReturn(List.of(vo));

        doGet("/api/anniversaries")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Birthday"));
    }

    @Test
    @DisplayName("GET /api/anniversaries - search + tag + sort")
    void list_withParams() throws Exception {
        when(anniversaryService.list(eq(1L), eq("name"), eq("desc"), eq("Birthday"), eq("family")))
                .thenReturn(List.of());

        doGet("/api/anniversaries?sortBy=name&order=desc&search=Birthday&tag=family")
                .andExpect(status().isOk());
        verify(anniversaryService).list(eq(1L), eq("name"), eq("desc"), eq("Birthday"), eq("family"));
    }

    @Test
    @DisplayName("GET /api/anniversaries/{id} - detail")
    void getDetail_succeeds() throws Exception {
        AnniversaryVO vo = new AnniversaryVO(1L, "Birthday", LocalDate.now(), "NONE", false, "0", "09:00", null, null, LocalDate.now(), 0L, List.of());
        when(anniversaryService.getDetail(1L, 1L)).thenReturn(vo);

        doGet("/api/anniversaries/{id}", 1L)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("POST /api/anniversaries - create")
    void create_succeeds() throws Exception {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setName("Birthday");
        when(anniversaryService.create(eq(1L), any(AnniversaryRequest.class))).thenReturn(a);

        mockMvc.perform(authPost("/api/anniversaries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"name\": \"Birthday\", \"date\": \"2026-06-02\", \"repeatType\": \"YEARLY\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("PUT /api/anniversaries/{id} - update")
    void update_succeeds() throws Exception {
        Anniversary a = new Anniversary();
        a.setId(1L);
        a.setName("updated");
        when(anniversaryService.update(eq(1L), eq(1L), any())).thenReturn(a);

        mockMvc.perform(authPut("/api/anniversaries/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"name\": \"updated\", \"date\": \"2026-06-02\" }"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/anniversaries/{id} - delete")
    void delete_succeeds() throws Exception {
        doNothing().when(anniversaryService).delete(1L, 1L);

        doDelete("/api/anniversaries/{id}", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/anniversaries/pending-reminders")
    void pendingReminders_succeeds() throws Exception {
        when(anniversaryService.getPendingReminders(1L)).thenReturn(List.of(new ReminderLog()));

        doGet("/api/anniversaries/pending-reminders")
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/anniversaries/reminders/{logId}/read")
    void markRead_succeeds() throws Exception {
        doNothing().when(anniversaryService).markReminderRead(1L);

        doPut("/api/anniversaries/reminders/{logId}/read", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/anniversaries/{id}/generate-todo")
    void generateTodo_succeeds() throws Exception {
        com.liuzeyu.todolist.module.task.entity.Task t = new com.liuzeyu.todolist.module.task.entity.Task();
        t.setId(99L);
        when(anniversaryService.generateTodo(1L, 1L)).thenReturn(t);

        doPost("/api/anniversaries/{id}/generate-todo", 1L)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(99));
    }
}

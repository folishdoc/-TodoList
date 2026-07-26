package com.liuzeyu.todolist.module.habit.controller;

import com.liuzeyu.todolist.module.habit.entity.Habit;
import com.liuzeyu.todolist.module.habit.entity.HabitRecord;
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

class HabitControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("POST /api/habits - create habit")
    void create_succeeds() throws Exception {
        Habit h = new Habit();
        h.setId(1L);
        h.setName("Morning run");
        when(habitService.createHabit(eq(1L), any(Habit.class))).thenReturn(h);

        mockMvc.perform(authPost("/api/habits")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"name\": \"Morning run\", \"frequency\": \"daily\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("GET /api/habits - list")
    void getHabits_succeeds() throws Exception {
        when(habitService.getHabits(1L)).thenReturn(List.of(new Habit()));

        doGet("/api/habits")
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/habits/{id} - detail")
    void getHabit_succeeds() throws Exception {
        Habit h = new Habit();
        h.setId(1L);
        when(habitService.getHabit(1L, 1L)).thenReturn(h);

        doGet("/api/habits/{id}", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/habits/{id} - update")
    void update_succeeds() throws Exception {
        Habit h = new Habit();
        h.setId(1L);
        when(habitService.updateHabit(eq(1L), eq(1L), any(Habit.class))).thenReturn(h);

        mockMvc.perform(authPut("/api/habits/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"name\": \"Morning run\", \"frequency\": \"daily\" }"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/habits/{id} - delete")
    void delete_succeeds() throws Exception {
        doNothing().when(habitService).deleteHabit(1L, 1L);

        doDelete("/api/habits/{id}", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/habits/{id}/checkin - check in")
    void checkIn_succeeds() throws Exception {
        HabitRecord r = new HabitRecord();
        r.setId(1L);
        r.setCompletionValue(1.0);
        when(habitService.checkIn(eq(1L), eq(1L), any(), any(), any(), any())).thenReturn(r);

        doPost("/api/habits/{id}/checkin", 1L)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("POST /api/habits/{id}/checkin - with all params")
    void checkIn_withParams() throws Exception {
        HabitRecord r = new HabitRecord();
        when(habitService.checkIn(eq(1L), eq(1L), eq(LocalDate.of(2026, 6, 1)), eq(1.0), eq("note"), eq(true)))
                .thenReturn(r);

        doPost("/api/habits/{id}/checkin?checkDate=2026-06-01&completionValue=1.0&note=note&isMakeup=true", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/habits/{id}/checkin - cancel check-in")
    void cancelCheckIn_succeeds() throws Exception {
        doNothing().when(habitService).cancelCheckIn(eq(1L), eq(1L), any());

        doDelete("/api/habits/{id}/checkin?checkDate=2026-06-01", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/habits/{id}/records - records")
    void getRecords_succeeds() throws Exception {
        when(habitService.getRecords(1L, 1L)).thenReturn(List.of());

        doGet("/api/habits/{id}/records", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/habits/{id}/records/range - range records")
    void getRecordsByRange_succeeds() throws Exception {
        when(habitService.getRecordsByDateRange(eq(1L), eq(1L), any(), any())).thenReturn(List.of());

        doGet("/api/habits/{id}/records/range?startDate=2026-06-01&endDate=2026-06-30", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/habits/records/today - today all records")
    void getTodayRecords_succeeds() throws Exception {
        when(habitService.getTodayRecords(1L)).thenReturn(List.of());

        doGet("/api/habits/records/today")
                .andExpect(status().isOk());
    }
}

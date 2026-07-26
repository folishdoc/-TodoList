package com.liuzeyu.todolist.module.task.controller;

import com.liuzeyu.todolist.module.task.dto.RepeatRule;
import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RepeatTaskControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("POST /api/tasks/repeat/{taskId} - set repeat rule")
    void setRepeat_succeeds() throws Exception {
        doNothing().when(repeatTaskService).setRepeatRule(eq(1L), any(RepeatRule.class));

        mockMvc.perform(authPost("/api/tasks/repeat/{taskId}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"type\": \"DAILY\", \"interval\": 1 }"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/tasks/repeat/{taskId} - cancel repeat")
    void cancelRepeat_succeeds() throws Exception {
        doNothing().when(repeatTaskService).cancelRepeatRule(1L);

        doDelete("/api/tasks/repeat/{taskId}", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/tasks/repeat/generate - manual trigger")
    void generate_succeeds() throws Exception {
        doNothing().when(repeatTaskService).generateRepeatTasks();

        doPost("/api/tasks/repeat/generate")
                .andExpect(status().isOk());
    }
}

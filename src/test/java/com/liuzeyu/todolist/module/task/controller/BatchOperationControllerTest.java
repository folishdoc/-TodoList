package com.liuzeyu.todolist.module.task.controller;

import com.liuzeyu.todolist.module.task.dto.BatchOperationRequest;
import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BatchOperationControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("POST /api/tasks/batch/execute")
    void executeBatch_succeeds() throws Exception {
        when(batchOperationService.executeBatchOperation(eq(1L), any(BatchOperationRequest.class))).thenReturn(3);

        mockMvc.perform(authPost("/api/tasks/batch/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"taskIds\": [1,2,3], \"operation\": \"complete\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(3));
    }

    @Test
    @DisplayName("POST /api/tasks/batch/complete")
    void batchComplete_succeeds() throws Exception {
        when(batchOperationService.executeBatchOperation(eq(1L), any())).thenReturn(2);

        mockMvc.perform(authPost("/api/tasks/batch/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"taskIds\": [1,2], \"operation\": \"complete\" }"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/tasks/batch/delete")
    void batchDelete_succeeds() throws Exception {
        when(batchOperationService.executeBatchOperation(eq(1L), any())).thenReturn(2);

        mockMvc.perform(authPost("/api/tasks/batch/delete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"taskIds\": [1,2], \"operation\": \"delete\" }"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/tasks/batch/move")
    void batchMove_succeeds() throws Exception {
        when(batchOperationService.executeBatchOperation(eq(1L), any())).thenReturn(2);

        mockMvc.perform(authPost("/api/tasks/batch/move")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"taskIds\": [1,2], \"operation\": \"move\", \"targetListId\": 5 }"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/tasks/batch/set-priority")
    void batchSetPriority_succeeds() throws Exception {
        when(batchOperationService.executeBatchOperation(eq(1L), any())).thenReturn(2);

        mockMvc.perform(authPost("/api/tasks/batch/set-priority")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"taskIds\": [1,2], \"operation\": \"setPriority\", \"priority\": 3 }"))
                .andExpect(status().isOk());
    }
}

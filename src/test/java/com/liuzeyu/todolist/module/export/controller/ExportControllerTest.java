package com.liuzeyu.todolist.module.export.controller;

import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ExportControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("GET /api/export/tasks/csv - returns CSV")
    void exportCsv_succeeds() throws Exception {
        when(exportService.exportTasksAsCsv(1L)).thenReturn("ID,title\n1,A");

        doGet("/api/export/tasks/csv")
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv;charset=UTF-8"))
                .andExpect(content().string("ID,title\n1,A"));
    }

    @Test
    @DisplayName("GET /api/export/tasks/json - returns JSON")
    void exportJson_succeeds() throws Exception {
        when(exportService.exportTasksAsJson(1L)).thenReturn("[{\"id\":1}]");

        doGet("/api/export/tasks/json")
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/json"))
                .andExpect(content().string("[{\"id\":1}]"));
    }
}

package com.liuzeyu.todolist.module.task.controller;

import com.liuzeyu.todolist.module.task.entity.TaskAttachment;
import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FileUploadControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("POST /api/attachments/tasks/{taskId} - upload")
    void upload_succeeds() throws Exception {
        TaskAttachment a = new TaskAttachment();
        a.setId(1L);
        a.setFileName("test.txt");
        when(fileUploadService.uploadFile(eq(1L), any())).thenReturn(a);

        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "hello".getBytes());
        mockMvc.perform(multipart("/api/attachments/tasks/{taskId}", 1L)
                        .file(file)
                        .header("Authorization", "Bearer " + PERSONAL_TOKEN))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/attachments/tasks/{taskId} - list")
    void getAttachments_succeeds() throws Exception {
        when(fileUploadService.getTaskAttachments(1L)).thenReturn(List.of());

        doGet("/api/attachments/tasks/{taskId}", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/attachments/{attachmentId} - delete")
    void deleteAttachment_succeeds() throws Exception {
        doNothing().when(fileUploadService).deleteAttachment(1L);

        doDelete("/api/attachments/{attachmentId}", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/attachments/{fileName} - path traversal blocked")
    void downloadPathTraversal_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/attachments/..%2F..%2Fetc%2Fpasswd"))
                .andExpect(status().isBadRequest());
    }
}

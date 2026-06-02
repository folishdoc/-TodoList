package com.liuzeyu.todolist.module.tag.controller;

import com.liuzeyu.todolist.module.tag.dto.TagRequest;
import com.liuzeyu.todolist.module.tag.entity.Tag;
import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TagControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("POST /api/tags - create")
    void create_succeeds() throws Exception {
        Tag t = new Tag();
        t.setId(1L);
        t.setName("Work");
        when(tagService.createTag(eq(1L), any(TagRequest.class))).thenReturn(t);

        mockMvc.perform(authPost("/api/tags")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"name\": \"Work\", \"color\": \"#FF0000\" }"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/tags - list")
    void list_succeeds() throws Exception {
        when(tagService.getUserTags(1L)).thenReturn(List.of());

        doGet("/api/tags")
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/tags/{id} - update")
    void update_succeeds() throws Exception {
        Tag t = new Tag();
        t.setId(1L);
        when(tagService.updateTag(eq(1L), eq(1L), any())).thenReturn(t);

        mockMvc.perform(authPut("/api/tags/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"name\": \"new\", \"color\": \"#00FF00\" }"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/tags/{id} - delete")
    void delete_succeeds() throws Exception {
        doNothing().when(tagService).deleteTag(1L, 1L);

        doDelete("/api/tags/{id}", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/tags/tasks/{taskId}?tagId=N - add")
    void addToTask_succeeds() throws Exception {
        doNothing().when(tagService).addTagToTask(1L, 1L, 10L);

        doPost("/api/tags/tasks/{taskId}?tagId=10", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/tags/tasks/{taskId}?tagId=N - remove")
    void removeFromTask_succeeds() throws Exception {
        doNothing().when(tagService).removeTagFromTask(1L, 1L, 10L);

        doDelete("/api/tags/tasks/{taskId}?tagId=10", 1L)
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/tags/tasks/{taskId} - task tags")
    void getTaskTags_succeeds() throws Exception {
        when(tagService.getTaskTags(1L)).thenReturn(List.of());

        doGet("/api/tags/tasks/{taskId}", 1L)
                .andExpect(status().isOk());
    }
}

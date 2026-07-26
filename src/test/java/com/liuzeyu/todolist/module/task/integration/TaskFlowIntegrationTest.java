package com.liuzeyu.todolist.module.task.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.liuzeyu.todolist.module.list.dto.TaskListRequest;
import com.liuzeyu.todolist.module.task.dto.TaskRequest;
import com.liuzeyu.todolist.module.task.dto.TaskTimeRequest;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskRepository;
import com.liuzeyu.todolist.support.BaseIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/**
 * 任务流集成测试 — 端到端覆盖：清单创建 → 任务创建 → 子任务 → 完成 → 删除。
 * 启动完整 Spring 上下文 + Testcontainers MySQL。
 */
@DisplayName("任务流集成测试 - Testcontainers MySQL")
class TaskFlowIntegrationTest extends BaseIntegrationTest {

    private static final String TOKEN = "Bearer test-personal-token-2026-secure-key";

    @Autowired
    private TaskRepository taskRepository;

    private String uniqueSuffix;

    @BeforeEach
    void setup() {
        setUpContext();
        uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    @DisplayName("完整任务流：创建清单 → 创建任务 → 加子任务 → 完成任务 → 验证")
    void fullTaskLifecycle() throws Exception {
        // 1. 创建清单
        TaskListRequest listReq = new TaskListRequest();
        listReq.setName("IT清单-" + uniqueSuffix);
        listReq.setColor("#FF6B6B");
        listReq.setSortOrder(0);

        MvcResult listResult = mockMvc.perform(post("/api/lists")
                        .header("Authorization", TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(listReq)))
                .andReturn();
        assertThat(listResult.getResponse().getStatus()).isEqualTo(200);
        JsonNode listBody = objectMapper.readTree(listResult.getResponse().getContentAsString());
        Long listId = listBody.path("data").path("id").asLong();
        assertThat(listId).isPositive();

        // 2. 创建主任务
        TaskRequest taskReq = new TaskRequest();
        taskReq.setTitle("集成测试主任务-" + uniqueSuffix);
        taskReq.setDescription("E2E task flow test");
        taskReq.setListId(listId);
        taskReq.setPriority(2);
        taskReq.setStatus(0);

        MvcResult taskResult = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(taskReq)))
                .andReturn();
        assertThat(taskResult.getResponse().getStatus()).isEqualTo(200);
        JsonNode taskBody = objectMapper.readTree(taskResult.getResponse().getContentAsString());
        Long parentId = taskBody.path("data").path("id").asLong();
        assertThat(parentId).isPositive();

        // 3. 创建子任务（parentId 指向主任务）
        TaskRequest subReq = new TaskRequest();
        subReq.setTitle("集成测试子任务-" + uniqueSuffix);
        subReq.setListId(listId);
        subReq.setParentId(parentId);
        subReq.setPriority(1);
        subReq.setStatus(0);

        MvcResult subResult = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(subReq)))
                .andReturn();
        assertThat(subResult.getResponse().getStatus()).isEqualTo(200);
        JsonNode subBody = objectMapper.readTree(subResult.getResponse().getContentAsString());
        Long subId = subBody.path("data").path("id").asLong();
        assertThat(subBody.path("data").path("parentId").asLong()).isEqualTo(parentId);

        // 4. 验证子任务查询接口
        MvcResult subtasksResult = mockMvc.perform(get("/api/tasks/{id}/subtasks", parentId)
                        .header("Authorization", TOKEN))
                .andReturn();
        assertThat(subtasksResult.getResponse().getStatus()).isEqualTo(200);
        JsonNode subtasksBody = objectMapper.readTree(subtasksResult.getResponse().getContentAsString());
        assertThat(subtasksBody.path("data").isArray()).isTrue();
        assertThat(subtasksBody.path("data").size()).isEqualTo(1);
        assertThat(subtasksBody.path("data").get(0).path("id").asLong()).isEqualTo(subId);

        // 5. 拖拽更新子任务时间（PATCH /time）
        TaskTimeRequest timeReq = new TaskTimeRequest();
        timeReq.setStartDate(LocalDateTime.of(LocalDate.now().plusDays(1), java.time.LocalTime.of(10, 0)));
        timeReq.setDueDate(LocalDateTime.of(LocalDate.now().plusDays(2), java.time.LocalTime.of(18, 0)));

        MvcResult timeResult = mockMvc.perform(patch("/api/tasks/{id}/time", subId)
                        .header("Authorization", TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(timeReq)))
                .andReturn();
        assertThat(timeResult.getResponse().getStatus()).isEqualTo(200);
        JsonNode timeBody = objectMapper.readTree(timeResult.getResponse().getContentAsString());
        assertThat(timeBody.path("data").path("startDate").isNull()).isFalse();

        // 6. 完成任务
        MvcResult completeResult = mockMvc.perform(patch("/api/tasks/{id}/complete", parentId)
                        .header("Authorization", TOKEN))
                .andReturn();
        assertThat(completeResult.getResponse().getStatus()).isEqualTo(200);
        JsonNode completeBody = objectMapper.readTree(completeResult.getResponse().getContentAsString());
        assertThat(completeBody.path("data").path("status").asInt()).isEqualTo(1);

        // 7. 取消完成
        MvcResult uncompleteResult = mockMvc.perform(patch("/api/tasks/{id}/uncomplete", parentId)
                        .header("Authorization", TOKEN))
                .andReturn();
        assertThat(uncompleteResult.getResponse().getStatus()).isEqualTo(200);
        JsonNode uncompleteBody = objectMapper.readTree(uncompleteResult.getResponse().getContentAsString());
        assertThat(uncompleteBody.path("data").path("status").asInt()).isEqualTo(0);

        // 8. 删除子任务
        MvcResult delSubResult = mockMvc.perform(delete("/api/tasks/{id}", subId)
                        .header("Authorization", TOKEN))
                .andReturn();
        assertThat(delSubResult.getResponse().getStatus()).isEqualTo(200);
        assertThat(taskRepository.findById(subId)).isEmpty();

        // 9. 删除主任务
        MvcResult delParentResult = mockMvc.perform(delete("/api/tasks/{id}", parentId)
                        .header("Authorization", TOKEN))
                .andReturn();
        assertThat(delParentResult.getResponse().getStatus()).isEqualTo(200);
        assertThat(taskRepository.findById(parentId)).isEmpty();
    }

    @Test
    @DisplayName("今日任务接口：按 dueDate 过滤")
    void todayTasksReturnsDueToday() throws Exception {
        TaskRequest todayReq = new TaskRequest();
        todayReq.setTitle("今日任务-" + uniqueSuffix);
        todayReq.setDueDate(LocalDateTime.of(LocalDate.now(), java.time.LocalTime.of(23, 59)));
        todayReq.setPriority(3);
        todayReq.setStatus(0);

        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(todayReq)))
                .andReturn();

        MvcResult todayResult = mockMvc.perform(get("/api/tasks/today")
                        .header("Authorization", TOKEN))
                .andReturn();
        assertThat(todayResult.getResponse().getStatus()).isEqualTo(200);
        JsonNode todayBody = objectMapper.readTree(todayResult.getResponse().getContentAsString());
        assertThat(todayBody.path("data").isArray()).isTrue();
        assertThat(todayBody.path("data").size()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("搜索任务：按关键词匹配")
    void searchByKeyword() throws Exception {
        String marker = "UniqueSearchMarker" + uniqueSuffix;
        TaskRequest req = new TaskRequest();
        req.setTitle(marker + " 目标");
        req.setStatus(0);

        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andReturn();

        MvcResult searchResult = mockMvc.perform(get("/api/tasks/search")
                        .param("keyword", marker)
                        .header("Authorization", TOKEN))
                .andReturn();
        assertThat(searchResult.getResponse().getStatus()).isEqualTo(200);
        JsonNode searchBody = objectMapper.readTree(searchResult.getResponse().getContentAsString());
        assertThat(searchBody.path("data").path("total").asInt()).isGreaterThanOrEqualTo(1);
    }
}

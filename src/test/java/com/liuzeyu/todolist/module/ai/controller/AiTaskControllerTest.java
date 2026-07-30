package com.liuzeyu.todolist.module.ai.controller;

import com.liuzeyu.todolist.module.ai.dto.ParsedTask;
import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AiTaskControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("POST /api/ai/parse-task - 正常解析返回 200")
    void parseTask_success() throws Exception {
        ParsedTask parsed = new ParsedTask(
                "买牛奶",
                "记得买脱脂牛奶",
                3,
                "2026-08-01 10:00",
                null,
                "购物",
                List.of("日常"),
                null
        );
        when(taskAiService.parseTask(anyString())).thenReturn(parsed);

        String body = """
                {
                  "input": "明天上午10点买牛奶，优先级高，放到购物列表，标签日常"
                }
                """;
        mockMvc.perform(authPost("/api/ai/parse-task")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.title").value("买牛奶"))
                .andExpect(jsonPath("$.data.priority").value(3))
                .andExpect(jsonPath("$.data.dueDate").value("2026-08-01 10:00"))
                .andExpect(jsonPath("$.data.listName").value("购物"))
                .andExpect(jsonPath("$.data.tags[0]").value("日常"));
    }

    @Test
    @DisplayName("POST /api/ai/parse-task - 循环任务解析返回 repeatRule")
    void parseTask_repeatTask() throws Exception {
        ParsedTask.AiRepeatRule rule = new ParsedTask.AiRepeatRule("DAILY", 1, null, null, null);
        ParsedTask parsed = new ParsedTask(
                "喝水",
                "每天喝水8杯",
                2,
                "2026-08-01 09:00",
                null,
                "健康",
                List.of("日常"),
                rule
        );
        when(taskAiService.parseTask(anyString())).thenReturn(parsed);

        String body = """
                {
                  "input": "每天早上9点喝水8杯"
                }
                """;
        mockMvc.perform(authPost("/api/ai/parse-task")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.title").value("喝水"))
                .andExpect(jsonPath("$.data.repeatRule.type").value("DAILY"))
                .andExpect(jsonPath("$.data.repeatRule.interval").value(1));
    }

    @Test
    @DisplayName("POST /api/ai/parse-task - AI 异常返回 503")
    void parseTask_aiError_returns503() throws Exception {
        when(taskAiService.parseTask(anyString())).thenThrow(new RuntimeException("API key invalid"));

        String body = """
                {
                  "input": "测试任务"
                }
                """;
        mockMvc.perform(authPost("/api/ai/parse-task")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(503))
                .andExpect(jsonPath("$.message").value("AI 服务暂不可用，请检查 AI_API_KEY 配置"));
    }

    @Test
    @DisplayName("POST /api/ai/parse-task - 空输入返回 400")
    void parseTask_emptyInput_returns400() throws Exception {
        String body = """
                {
                  "input": ""
                }
                """;
        mockMvc.perform(authPost("/api/ai/parse-task")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}

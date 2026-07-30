package com.liuzeyu.todolist.module.ai.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * AI 解析任务的请求体。
 */
public class ParseTaskRequest {

    @NotBlank(message = "输入内容不能为空")
    private String input;

    public ParseTaskRequest() {
    }

    public ParseTaskRequest(String input) {
        this.input = input;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }
}

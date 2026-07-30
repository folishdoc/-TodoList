package com.liuzeyu.todolist.module.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * AI 解析任务的请求体。
 */
@Data
public class ParseTaskRequest {

    @NotBlank(message = "输入内容不能为空")
    @Size(max = 1000, message = "输入内容不能超过1000个字符")
    private String input;
}

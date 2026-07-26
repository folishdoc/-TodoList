package com.liuzeyu.todolist.module.tag.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 标签请求DTO
 */
@Data
public class TagRequest {

    @NotBlank(message = "标签名称不能为空")
    @Size(max = 50, message = "标签名称不能超过50个字符")
    private String name;

    @Size(max = 7, message = "颜色格式不正确")
    private String color = "#409EFF";
}

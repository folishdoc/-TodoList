package com.liuzeyu.todolist.module.list.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 清单创建/更新请求 DTO
 * <p>
 * name 为必填（@NotBlank），color 和 sortOrder 可选。
 */
@Data
public class TaskListRequest {
    @NotBlank(message = "清单名称不能为空")
    @Size(max = 100, message = "清单名称不能超过100个字符")
    private String name;

    private String color;

    private Integer sortOrder;
}

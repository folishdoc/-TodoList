package com.liuzeyu.todolist.module.tag.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 标签实体类
 */
@Data
public class Tag {

    private Long id;

    private String name;

    private String color = "#409EFF";

    private String icon; // 图标名称

    private String groupName; // 标签分组：工作、生活、学习等

    private Integer sortOrder = 0; // 排序顺序

    private Boolean isPinned = false; // 是否置顶

    private Long userId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

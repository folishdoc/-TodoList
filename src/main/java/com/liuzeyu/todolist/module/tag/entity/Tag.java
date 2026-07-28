package com.liuzeyu.todolist.module.tag.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 标签实体类
 * <p>
 * 对应数据库 tags 表。用于对任务进行分类标记，支持颜色、图标、分组和置顶功能。
 * 通过 TaskTag 关联表与任务建立多对多关系。
 */
@Data
public class Tag {

    private Long id;

    private String name; // 标签名称

    private String color = "#409EFF"; // 显示颜色

    private String icon; // 图标名称

    private String groupName; // 标签分组：工作、生活、学习等

    private Integer sortOrder = 0; // 排序顺序

    private Boolean isPinned = false; // 是否置顶

    private Long userId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

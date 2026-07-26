package com.liuzeyu.todolist.module.tag.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 标签实体类
 */
@Data
@Entity
@Table(name = "tags")
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 7)
    private String color = "#409EFF";

    @Column(length = 50)
    private String icon; // 图标名称

    @Column(name = "group_name", length = 50)
    private String groupName; // 标签分组：工作、生活、学习等

    @Column(name = "sort_order")
    private Integer sortOrder = 0; // 排序顺序

    @Column(name = "is_pinned")
    private Boolean isPinned = false; // 是否置顶

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

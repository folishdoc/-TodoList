package com.liuzeyu.todolist.module.auth.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
public class User {
    private Long id;

    private String username;

    private String password; // BCrypt 加密

    private String displayName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

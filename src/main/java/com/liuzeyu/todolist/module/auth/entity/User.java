package com.liuzeyu.todolist.module.auth.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体
 * <p>
 * 对应数据库 users 表。单用户模式下仅有一条记录（userId=1L）。
 * password 字段存储 BCrypt 哈希值，不存储明文。
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

package com.liuzeyu.todolist.module.auth.controller;

/**
 * 登录响应 DTO — Java 14+ Record
 * <p>
 * 登录/注册成功后返回给客户端，包含 JWT 令牌和用户基本信息。
 *
 * @param token       JWT 令牌
 * @param userId      用户 ID
 * @param username    用户名
 * @param displayName 显示名称
 */
public record LoginResponse(String token, Long userId, String username, String displayName) {}

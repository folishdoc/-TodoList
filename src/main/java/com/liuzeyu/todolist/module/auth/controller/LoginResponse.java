package com.liuzeyu.todolist.module.auth.controller;

public record LoginResponse(String token, Long userId, String username, String displayName) {}

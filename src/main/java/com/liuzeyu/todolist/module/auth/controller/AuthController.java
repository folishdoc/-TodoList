package com.liuzeyu.todolist.module.auth.controller;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.auth.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Result<LoginResponse> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String displayName = body.get("displayName");

        if (username == null || username.isBlank()) {
            return Result.error(400, "用户名不能为空");
        }
        if (password == null || password.isBlank()) {
            return Result.error(400, "密码不能为空");
        }
        if (username.length() < 2 || username.length() > 50) {
            return Result.error(400, "用户名长度需在 2-50 个字符之间");
        }
        if (password.length() < 6) {
            return Result.error(400, "密码长度不能少于 6 位");
        }

        try {
            LoginResponse response = authService.register(username, password, displayName);
            return Result.success("注册成功", response);
        } catch (BusinessException e) {
            return Result.error(e.getCode(), e.getMessage());
        }
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return Result.error(400, "用户名和密码不能为空");
        }

        try {
            LoginResponse response = authService.login(username, password);
            return Result.success("登录成功", response);
        } catch (BusinessException e) {
            return Result.error(e.getCode(), e.getMessage());
        }
    }
}

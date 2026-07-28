package com.liuzeyu.todolist.module.auth.controller;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.auth.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 认证控制器 — 注册与登录接口
 * <p>
 * 路径前缀 /api/auth，无需 JWT 认证（在 SecurityConfig 中配置 permitAll）。
 * 参数校验在 Controller 层完成（非 @Valid，使用手动校验以返回自定义错误码）。
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * 用户注册
     *
     * @param body 请求体：{ username, password, displayName? }
     * @return 注册结果（含 JWT 令牌）
     */
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

    /**
     * 用户登录
     *
     * @param body 请求体：{ username, password }
     * @return 登录结果（含 JWT 令牌）
     */
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

package com.liuzeyu.todolist.module.user.controller;

import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.user.dto.JwtResponse;
import com.liuzeyu.todolist.module.user.dto.LoginRequest;
import com.liuzeyu.todolist.module.user.dto.RegisterRequest;
import com.liuzeyu.todolist.module.user.entity.User;
import com.liuzeyu.todolist.module.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "认证管理", description = "用户注册、登录等接口")
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    @Operation(summary = "用户注册")
    public Result<JwtResponse> register(@Valid @RequestBody RegisterRequest request) {
        return Result.success("注册成功", userService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "用户登录")
    public Result<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return Result.success("登录成功", userService.login(request));
    }

    @GetMapping("/profile")
    @Operation(summary = "获取用户信息")
    public Result<User> getProfile(@AuthenticationPrincipal Long userId) {
        return Result.success(userService.getUserInfo(userId));
    }
}

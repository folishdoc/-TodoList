package com.liuzeyu.todolist.common.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.CompletableFuture;

/**
 * 系统控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/system")
@Tag(name = "系统管理", description = "系统相关接口")
public class SystemController {

    private final ConfigurableApplicationContext context;

    public SystemController(ConfigurableApplicationContext context) {
        this.context = context;
    }

    @PostMapping("/shutdown")
    @Operation(summary = "关闭应用", description = "优雅关闭应用（仅开发环境使用）")
    public String shutdown() {
        log.info("收到关闭请求，准备关闭应用...");
        
        // 异步关闭，避免阻塞响应
        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(500); // 等待响应发送完成
                SpringApplication.exit(context, () -> 0);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        
        return "应用正在关闭...";
    }
}

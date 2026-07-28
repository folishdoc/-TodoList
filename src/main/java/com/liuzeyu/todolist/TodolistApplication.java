package com.liuzeyu.todolist;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Todolist 应用入口
 * <p>
 * 个人待办清单应用后端，基于 Spring Boot 4.0.6。
 * 单用户模式（无真实登录流程），使用硬编码 JWT 令牌认证。
 * {@code @EnableScheduling} 启用定时任务支持（重复任务生成、纪念日提醒）。
 *
 * @author liuzeyu
 */
@SpringBootApplication
@EnableScheduling
public class TodolistApplication {

    public static void main(String[] args) {
        SpringApplication.run(TodolistApplication.class, args);
    }

}

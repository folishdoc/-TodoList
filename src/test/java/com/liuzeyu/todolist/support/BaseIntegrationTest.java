package com.liuzeyu.todolist.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import com.liuzeyu.todolist.common.config.SecurityConfig;
import com.liuzeyu.todolist.common.config.JwtAuthenticationFilter;

import org.springframework.security.web.FilterChainProxy;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 集成测试基类 — 启动完整 Spring 上下文 + Testcontainers MySQL。
 * 需要本机有 Docker。被 @Tag("integration") 标记。
 *
 * 子类可以使用：
 *  - mockMvc: 完整 Web 上下文（Security + Filter 链）
 *  - objectMapper: 配置了 JSR-310 的 Jackson
 *  - mysql: MySQL 容器
 */
@Tag("integration")
@SpringBootTest(webEnvironment = WebEnvironment.MOCK)
@ActiveProfiles("test")
@Testcontainers
public abstract class BaseIntegrationTest {

    @Container
    @ServiceConnection
    protected static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse("mysql:8.0"))
            .withDatabaseName("todolist_test")
            .withUsername("test")
            .withPassword("test");

    @Autowired
    protected WebApplicationContext webApplicationContext;

    @Autowired
    protected FilterChainProxy springSecurityFilterChain;

    protected MockMvc mockMvc;
    protected ObjectMapper objectMapper;

    protected void setUpContext() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilter(springSecurityFilterChain)
                .build();
        this.objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }
}

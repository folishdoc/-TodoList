package com.liuzeyu.todolist.support;

import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.liuzeyu.todolist.TodolistApplication;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Repository 切片测试 — @DataJpaTest + H2 内存库。
 * 仅加载 JPA 相关 Bean，速度极快。
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@DataJpaTest
@AutoConfigureTestDatabase
@ActiveProfiles("test")
@Import(TodolistApplication.class)
public @interface RepositoryTest {
}

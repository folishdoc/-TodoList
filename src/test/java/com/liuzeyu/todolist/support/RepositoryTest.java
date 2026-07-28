package com.liuzeyu.todolist.support;

import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.liuzeyu.todolist.TodolistApplication;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Mapper 切片测试 — @MybatisTest + H2 内存库。
 * 仅加载 MyBatis 相关 Bean，速度极快。
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@MybatisTest
@ActiveProfiles("test")
@Import(TodolistApplication.class)
public @interface RepositoryTest {
}

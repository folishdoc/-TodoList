package com.liuzeyu.todolist.support;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 单元测试基类 — 纯 Mockito，不需要 Spring 上下文。
 */
@ExtendWith(MockitoExtension.class)
public abstract class BaseUnitTest {
}

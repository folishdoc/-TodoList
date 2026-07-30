package com.liuzeyu.todolist.common.config;

import com.liuzeyu.todolist.module.auth.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 数据初始化器 — 首次启动时创建默认管理员账号。
 * 只在 admin 用户不存在时执行，多次重启安全。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 管理员已存在则跳过
        if (userMapper.existsByUsername("admin")) {
            log.info("管理员账号已存在，跳过初始化");
            return;
        }

        com.liuzeyu.todolist.module.auth.entity.User admin =
                new com.liuzeyu.todolist.module.auth.entity.User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setDisplayName("管理员");
        userMapper.insert(admin);
        log.info("默认管理员账号已创建: admin / admin123");
    }
}


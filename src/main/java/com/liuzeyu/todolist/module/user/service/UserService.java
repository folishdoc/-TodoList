package com.liuzeyu.todolist.module.user.service;

import com.liuzeyu.todolist.common.config.JwtUtils;
import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.list.entity.TaskList;
import com.liuzeyu.todolist.module.list.mapper.TaskListRepository;
import com.liuzeyu.todolist.module.user.dto.JwtResponse;
import com.liuzeyu.todolist.module.user.dto.LoginRequest;
import com.liuzeyu.todolist.module.user.dto.RegisterRequest;
import com.liuzeyu.todolist.module.user.entity.User;
import com.liuzeyu.todolist.module.user.mapper.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户服务
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TaskListRepository taskListRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    /**
     * 用户注册
     */
    @Transactional
    public JwtResponse register(RegisterRequest request) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("用户名已存在");
        }

        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("邮箱已被注册");
        }

        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        // 创建默认清单
        TaskList defaultList = new TaskList();
        defaultList.setUserId(savedUser.getId());
        defaultList.setName("我的任务");
        defaultList.setIsDefault(true);
        defaultList.setSortOrder(0);
        taskListRepository.save(defaultList);

        // 生成JWT Token
        String token = jwtUtils.generateToken(savedUser.getId(), savedUser.getUsername());

        return JwtResponse.builder()
                .token(token)
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .build();
    }

    /**
     * 用户登录
     */
    public JwtResponse login(LoginRequest request) {
        // 查找用户
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("用户名或密码错误"));

        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("用户名或密码错误");
        }

        // 生成JWT Token
        String token = jwtUtils.generateToken(user.getId(), user.getUsername());

        return JwtResponse.builder()
                .token(token)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }

    /**
     * 获取用户信息
     */
    public User getUserInfo(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));
    }
}

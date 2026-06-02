package com.liuzeyu.todolist.module.user.service;

import com.liuzeyu.todolist.common.config.JwtUtils;
import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.list.mapper.TaskListRepository;
import com.liuzeyu.todolist.module.user.dto.JwtResponse;
import com.liuzeyu.todolist.module.user.dto.LoginRequest;
import com.liuzeyu.todolist.module.user.dto.RegisterRequest;
import com.liuzeyu.todolist.module.user.entity.User;
import com.liuzeyu.todolist.module.user.mapper.UserRepository;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceTest extends BaseUnitTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskListRepository taskListRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("注册 - 正常")
    void register_succeeds() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice");
        req.setEmail("alice@example.com");
        req.setPassword("pwd123");

        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("pwd123")).thenReturn("hash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtUtils.generateToken(any(), any())).thenReturn("jwt.token");

        JwtResponse resp = userService.register(req);

        assertThat(resp.getId()).isEqualTo(1L);
        assertThat(resp.getToken()).isEqualTo("jwt.token");
        verify(taskListRepository).save(any());
    }

    @Test
    @DisplayName("注册 - 用户名重复抛异常")
    void register_duplicateUsername_throws() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice");
        req.setEmail("alice@example.com");
        req.setPassword("pwd123");
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(BusinessException.class)
                .hasMessage("用户名已存在");
    }

    @Test
    @DisplayName("注册 - 邮箱重复抛异常")
    void register_duplicateEmail_throws() {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice");
        req.setEmail("alice@example.com");
        req.setPassword("pwd123");
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(BusinessException.class)
                .hasMessage("邮箱已被注册");
    }

    @Test
    @DisplayName("登录 - 正常")
    void login_succeeds() {
        LoginRequest req = new LoginRequest();
        req.setUsername("alice");
        req.setPassword("pwd123");
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setPasswordHash("hash");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pwd123", "hash")).thenReturn(true);
        when(jwtUtils.generateToken(any(), any())).thenReturn("jwt.token");

        JwtResponse resp = userService.login(req);

        assertThat(resp.getToken()).isEqualTo("jwt.token");
    }

    @Test
    @DisplayName("登录 - 用户不存在抛异常")
    void login_userNotFound_throws() {
        LoginRequest req = new LoginRequest();
        req.setUsername("alice");
        req.setPassword("pwd123");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.login(req))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("登录 - 密码错误抛异常")
    void login_wrongPassword_throws() {
        LoginRequest req = new LoginRequest();
        req.setUsername("alice");
        req.setPassword("wrong");
        User user = new User();
        user.setPasswordHash("hash");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> userService.login(req))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("获取用户信息 - 正常")
    void getUserInfo_succeeds() {
        User user = new User();
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        User result = userService.getUserInfo(1L);

        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("获取用户信息 - 不存在抛异常")
    void getUserInfo_notFound_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserInfo(1L))
                .isInstanceOf(BusinessException.class);
    }
}

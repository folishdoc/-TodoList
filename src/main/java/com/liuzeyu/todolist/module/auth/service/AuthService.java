package com.liuzeyu.todolist.module.auth.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.common.util.JwtUtil;
import com.liuzeyu.todolist.module.auth.dto.LoginResponse;
import com.liuzeyu.todolist.module.auth.entity.User;
import com.liuzeyu.todolist.module.auth.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 认证服务 — 注册与登录
 * <p>
 * 提供用户注册（用户名查重 + BCrypt 加密密码）和登录（密码验证）功能。
 * 认证成功后生成 JWT 令牌返回给客户端。
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    /**
     * 用户注册
     *
     * @param username    用户名（唯一）
     * @param password    明文密码（服务端 BCrypt 加密存储）
     * @param displayName 显示名称（为空则使用用户名）
     * @return 登录响应（含 JWT 令牌）
     * @throws BusinessException 409 用户名已存在
     */
    public LoginResponse register(String username, String password, String displayName) {
        if (userMapper.existsByUsername(username)) {
            throw new BusinessException(409, "用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setDisplayName(displayName != null && !displayName.isBlank() ? displayName : username);

        userMapper.insert(user);
        String jwt = jwtUtil.generateToken(user.getId());
        return new LoginResponse(jwt, user.getId(), user.getUsername(), user.getDisplayName());
    }

    /**
     * 用户登录
     *
     * @param username 用户名
     * @param password 明文密码
     * @return 登录响应（含 JWT 令牌）
     * @throws BusinessException 401 用户名或密码错误
     */
    public LoginResponse login(String username, String password) {
        User user = userMapper.findByUsername(username)
                .orElseThrow(() -> new BusinessException(401, "用户名或密码错误"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        String jwt = jwtUtil.generateToken(user.getId());
        return new LoginResponse(jwt, user.getId(), user.getUsername(), user.getDisplayName());
    }
}

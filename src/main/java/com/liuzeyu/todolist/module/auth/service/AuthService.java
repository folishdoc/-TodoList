package com.liuzeyu.todolist.module.auth.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.common.util.JwtUtil;
import com.liuzeyu.todolist.module.auth.controller.LoginResponse;
import com.liuzeyu.todolist.module.auth.entity.User;
import com.liuzeyu.todolist.module.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse register(String username, String password, String displayName) {
        if (userRepository.existsByUsername(username)) {
            throw new BusinessException(409, "用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setDisplayName(displayName != null && !displayName.isBlank() ? displayName : username);

        user = userRepository.save(user);
        String jwt = jwtUtil.generateToken(user.getId());
        return new LoginResponse(jwt, user.getId(), user.getUsername(), user.getDisplayName());
    }

    public LoginResponse login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(401, "用户名或密码错误"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        String jwt = jwtUtil.generateToken(user.getId());
        return new LoginResponse(jwt, user.getId(), user.getUsername(), user.getDisplayName());
    }
}

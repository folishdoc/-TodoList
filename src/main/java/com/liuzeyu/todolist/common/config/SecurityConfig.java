package com.liuzeyu.todolist.common.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import com.liuzeyu.todolist.common.util.JwtUtil;
import java.io.IOException;
import java.util.ArrayList;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Spring Security 安全配置
 * <p>
 * 无状态（STATELESS）JWT 认证方案。所有请求（除 /api/auth/**）都需要 Bearer token。
 * 自定义 OncePerRequestFilter 从 Authorization 头解析 JWT，提取 userId 注入 SecurityContext。
 * 禁用 CSRF（REST API 不需要），阻止 Spring Security 自动创建内存 UserDetailsService。
 *
 * @see JwtUtil
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * 密码编码器 — 使用 BCrypt 哈希算法
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 空 UserDetailsService：阻止 Spring Security 自动创建内存用户
     * <p>
     * 本项目使用 JWT 过滤器认证，不需要基于内存/数据库的 UserDetailsService。
     * 若不覆盖此 Bean，Spring Boot 会自动配置一个，导致启动日志警告。
     */
    @Bean
    public UserDetailsService noopUserDetailsService() {
        return username -> { throw new UsernameNotFoundException("不使用内存用户"); };
    }

    /**
     * 构建 SecurityFilterChain：配置路由权限 + JWT 过滤器
     *
     * @param http    HttpSecurity 构建器
     * @param jwtUtil JWT 工具类，用于解析令牌
     * @return 配置完成的 SecurityFilterChain
     * @throws Exception 配置异常
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtUtil jwtUtil) throws Exception {
        OncePerRequestFilter jwtFilter = new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                    throws ServletException, IOException {
                String path = request.getRequestURI();
                // /api/auth/** 路径不需要 JWT 检查（登录、刷新令牌等）
                if (path.startsWith("/api/auth/")) {
                    chain.doFilter(request, response);
                    return;
                }

                String authHeader = request.getHeader("Authorization");
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"code\":401,\"message\":\"Missing or invalid token\"}");
                    return;
                }
                String token = authHeader.substring(7);

                Long userId;
                try {
                    userId = jwtUtil.getUserIdFromToken(token);
                } catch (Exception e) {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"code\":401,\"message\":\"Invalid or expired token\"}");
                    return;
                }

                // 将 userId 注入 SecurityContext，Controller 通过 @AuthenticationPrincipal 获取
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, new ArrayList<>());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                chain.doFilter(request, response);
            }
        };

        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

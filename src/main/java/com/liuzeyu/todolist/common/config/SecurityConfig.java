package com.liuzeyu.todolist.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.liuzeyu.todolist.common.filter.JwtAuthenticationFilter;
import com.liuzeyu.todolist.common.util.JwtUtil;
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
     * JWT 认证过滤器 Bean — 由 SecurityConfig 管理，避免自动注册为全局 servlet 过滤器。
     * <p>
     * 通过 {@link #securityFilterChain(HttpSecurity, JwtAuthenticationFilter)} 的 {@code addFilterBefore}
     * 注册到 Spring Security 过滤器链中，不会干扰 {@code @WebMvcTest} 切片测试。
     *
     * @param jwtUtil       JWT 工具类
     * @param personalToken 个人令牌（单用户模式）
     * @return JWT 认证过滤器实例
     */
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtUtil jwtUtil,
            @Value("${app.personal.token}") String personalToken) {
        return new JwtAuthenticationFilter(jwtUtil, personalToken);
    }

    /**
     * 构建 SecurityFilterChain：配置路由权限 + JWT 过滤器
     *
     * @param http               HttpSecurity 构建器
     * @param jwtFilter          提取为独立类的 JWT 认证过滤器
     * @return 配置完成的 SecurityFilterChain
     * @throws Exception 配置异常
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            JwtAuthenticationFilter jwtFilter) throws Exception {
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

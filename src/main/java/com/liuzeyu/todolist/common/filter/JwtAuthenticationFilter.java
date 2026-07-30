package com.liuzeyu.todolist.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import com.liuzeyu.todolist.common.util.JwtUtil;
import java.io.IOException;
import java.util.ArrayList;

/**
 * JWT 认证过滤器 — 从 Authorization 头提取 Bearer token，解析 userId 注入 SecurityContext。
 * <p>
 * 双认证模式：
 * <ol>
 *   <li><b>Personal token</b>（单用户模式）：配置 {@code app.personal.token}，匹配后映射到 userId=1L</li>
 *   <li><b>JWT</b>：通过 {@link JwtUtil#getUserIdFromToken(String)} 解析 userId</li>
 * </ol>
 * {@code /api/auth/**} 路径直接放行（登录/注册不需要认证）。
 * <p>
 * 由 {@link com.liuzeyu.todolist.common.config.SecurityConfig#jwtAuthenticationFilter(JwtUtil, String)} 创建为 {@code @Bean}，
 * 作为 Spring Security 过滤器链的一部分（通过 {@code addFilterBefore} 注册），避免被自动注册为全局 servlet 过滤器。
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final String personalToken;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, String personalToken) {
        this.jwtUtil = jwtUtil;
        this.personalToken = personalToken;
    }

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
        // 单用户模式：personal token 直接映射到 userId=1（留空 = 禁用，强制 JWT）
        if (personalToken != null && !personalToken.isEmpty() && personalToken.equals(token)) {
            userId = 1L;
        } else {
            try {
                userId = jwtUtil.getUserIdFromToken(token);
            } catch (Exception e) {
                response.setStatus(401);
                response.setContentType("application/json");
                response.getWriter().write("{\"code\":401,\"message\":\"Invalid or expired token\"}");
                return;
            }
        }

        // 将 userId 注入 SecurityContext，Controller 通过 @AuthenticationPrincipal 获取
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(userId, null, new ArrayList<>());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        chain.doFilter(request, response);
    }
}

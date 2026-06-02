package com.liuzeyu.todolist.support;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Test-only SecurityFilterChain: permitAll + always-inject userId=1L.
 *
 * Spring Boot 4's @WebMvcTest auto-configures a default SecurityFilterChain
 * (deny-all) before our SecurityConfig can take effect. We override with a
 * permissive chain so tests focus on controller logic.
 *
 * The TestAuthFilter always injects userId=1L as the @AuthenticationPrincipal,
 * matching the personal-token behavior in production. Tests that need an
 * unauthenticated request can call mockMvc.perform(...) directly (bypassing
 * the request goes through this filter too — use SecurityContextHolder.clear()
 * or skip those assertions).
 */
@TestConfiguration
@EnableWebSecurity
public class TestSecurityConfig {

    @Bean
    SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .addFilterBefore(new TestAuthFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    static class TestAuthFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain) throws ServletException, IOException {
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(1L, null, List.of());
            SecurityContextHolder.getContext().setAuthentication(auth);
            filterChain.doFilter(request, response);
        }
    }
}

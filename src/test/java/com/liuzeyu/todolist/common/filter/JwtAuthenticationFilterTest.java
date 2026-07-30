package com.liuzeyu.todolist.common.filter;

import com.liuzeyu.todolist.common.util.JwtUtil;
import com.liuzeyu.todolist.support.BaseUnitTest;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * JwtAuthenticationFilter 单元测试。
 * <p>
 * 纯 Mockito，不启动 Spring 上下文。直接构造过滤器并调用 doFilterInternal，
 * 验证认证逻辑、401 响应和 SecurityContext 注入。
 */
class JwtAuthenticationFilterTest extends BaseUnitTest {

    private static final String TEST_PERSONAL_TOKEN = "test-personal-token-2026-secure-key";
    private static final Long TEST_USER_ID = 42L;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain chain;

    private JwtAuthenticationFilter filterWithPersonalToken;
    private JwtAuthenticationFilter filterWithoutPersonalToken;

    @BeforeEach
    void setUp() {
        filterWithPersonalToken = new JwtAuthenticationFilter(jwtUtil, TEST_PERSONAL_TOKEN);
        filterWithoutPersonalToken = new JwtAuthenticationFilter(jwtUtil, "");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldAuthenticateWithPersonalToken() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/tasks");
        when(request.getHeader("Authorization")).thenReturn("Bearer " + TEST_PERSONAL_TOKEN);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        filterWithPersonalToken.doFilterInternal(request, response, chain);

        verify(response, never()).setStatus(anyInt());
        verify(chain).doFilter(request, response);
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(1L, auth.getPrincipal());
    }

    @Test
    void shouldAuthenticateWithJwt() throws Exception {
        String jwt = "valid.jwt.token";
        when(request.getRequestURI()).thenReturn("/api/tasks");
        when(request.getHeader("Authorization")).thenReturn("Bearer " + jwt);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(jwtUtil.getUserIdFromToken(jwt)).thenReturn(TEST_USER_ID);

        filterWithoutPersonalToken.doFilterInternal(request, response, chain);

        verify(response, never()).setStatus(anyInt());
        verify(chain).doFilter(request, response);
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(TEST_USER_ID, auth.getPrincipal());
    }

    @Test
    void shouldReturn401WhenNoToken() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/tasks");
        when(request.getHeader("Authorization")).thenReturn(null);

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        filterWithoutPersonalToken.doFilterInternal(request, response, chain);

        verify(response).setStatus(401);
        verify(response).setContentType("application/json");
        verify(chain, never()).doFilter(request, response);
        assertTrue(stringWriter.toString().contains("Missing or invalid token"));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldReturn401WhenInvalidJwt() throws Exception {
        String badToken = "invalid.jwt.token";
        when(request.getRequestURI()).thenReturn("/api/tasks");
        when(request.getHeader("Authorization")).thenReturn("Bearer " + badToken);
        when(jwtUtil.getUserIdFromToken(badToken)).thenThrow(new RuntimeException("Invalid token"));

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        filterWithoutPersonalToken.doFilterInternal(request, response, chain);

        verify(response).setStatus(401);
        verify(response).setContentType("application/json");
        verify(chain, never()).doFilter(request, response);
        assertTrue(stringWriter.toString().contains("Invalid or expired token"));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldReturn401WhenMalformedAuthHeader() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/tasks");
        // "Basic" instead of "Bearer"
        when(request.getHeader("Authorization")).thenReturn("Basic somecreds");

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        filterWithoutPersonalToken.doFilterInternal(request, response, chain);

        verify(response).setStatus(401);
        verify(response).setContentType("application/json");
        verify(chain, never()).doFilter(request, response);
        assertTrue(stringWriter.toString().contains("Missing or invalid token"));
    }

    @Test
    void shouldSkipAuthForApiAuthPath() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");

        filterWithoutPersonalToken.doFilterInternal(request, response, chain);

        verify(response, never()).setStatus(anyInt());
        verify(chain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldPreferPersonalTokenOverJwt() throws Exception {
        // Even if the token looks like a JWT, personal token match should win
        when(request.getRequestURI()).thenReturn("/api/tasks");
        when(request.getHeader("Authorization")).thenReturn("Bearer " + TEST_PERSONAL_TOKEN);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        filterWithPersonalToken.doFilterInternal(request, response, chain);

        // jwtUtil should never be called since personal token matched
        verify(jwtUtil, never()).getUserIdFromToken(anyString());
        verify(chain).doFilter(request, response);
        var auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(1L, auth.getPrincipal());
    }
}

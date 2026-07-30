package com.liuzeyu.todolist.module.auth.controller;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.auth.dto.LoginResponse;
import com.liuzeyu.todolist.module.auth.service.AuthService;
import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest extends BaseControllerTest {

    // ==================== 注册 ====================

    @Test
    @DisplayName("注册成功")
    void register_success() throws Exception {
        when(authService.register("testuser", "password123", null))
                .thenReturn(new LoginResponse("fake-jwt", 2L, "testuser", "testuser"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testuser\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").value("fake-jwt"))
                .andExpect(jsonPath("$.data.userId").value(2))
                .andExpect(jsonPath("$.data.username").value("testuser"))
                .andExpect(jsonPath("$.data.displayName").value("testuser"));
    }

    @Test
    @DisplayName("注册失败 - 用户名为空")
    void register_emptyUsername() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("用户名不能为空"));
    }

    @Test
    @DisplayName("注册失败 - 密码为空")
    void register_emptyPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testuser\",\"password\":\"\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("密码不能为空"));
    }

    @Test
    @DisplayName("注册失败 - 密码太短")
    void register_shortPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testuser\",\"password\":\"12345\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("密码长度不能少于 6 位"));
    }

    @Test
    @DisplayName("注册失败 - 用户名已存在")
    void register_duplicateUsername() throws Exception {
        when(authService.register("testuser", "password123", null))
                .thenThrow(new BusinessException(409, "用户名已存在"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testuser\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(409))
                .andExpect(jsonPath("$.message").value("用户名已存在"));
    }

    // ==================== 登录 ====================

    @Test
    @DisplayName("登录成功")
    void login_success() throws Exception {
        when(authService.login("testuser", "password123"))
                .thenReturn(new LoginResponse("fake-jwt", 2L, "testuser", "Test User"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testuser\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").value("fake-jwt"))
                .andExpect(jsonPath("$.data.userId").value(2))
                .andExpect(jsonPath("$.data.username").value("testuser"))
                .andExpect(jsonPath("$.data.displayName").value("Test User"));
    }

    @Test
    @DisplayName("登录失败 - 用户名或密码错误")
    void login_wrongCredentials() throws Exception {
        when(authService.login("testuser", "wrong"))
                .thenThrow(new BusinessException(401, "用户名或密码错误"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testuser\",\"password\":\"wrong\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户名或密码错误"));
    }

    @Test
    @DisplayName("登录失败 - 用户名为空")
    void login_emptyUsername() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("用户名和密码不能为空"));
    }

    @Test
    @DisplayName("登录失败 - 密码为空")
    void login_emptyPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testuser\",\"password\":\"\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("用户名和密码不能为空"));
    }

    @Test
    @DisplayName("登录失败 - 缺少字段")
    void login_missingFields() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("用户名和密码不能为空"));
    }

    @Test
    @DisplayName("登录失败 - JSON 格式错误")
    void login_badJson() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("not json"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value(500))
                .andExpect(jsonPath("$.message").value("系统内部错误，请联系管理员"));
    }
}

package com.liuzeyu.todolist.module.user.controller;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.user.dto.JwtResponse;
import com.liuzeyu.todolist.module.user.dto.LoginRequest;
import com.liuzeyu.todolist.module.user.dto.RegisterRequest;
import com.liuzeyu.todolist.module.user.entity.User;
import com.liuzeyu.todolist.support.BaseControllerTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest extends BaseControllerTest {

    @Test
    @DisplayName("POST /api/auth/login - login succeeds")
    void login_succeeds() throws Exception {
        JwtResponse resp = JwtResponse.builder().token("jwt.token").id(1L).username("alice").build();
        when(userService.login(any(LoginRequest.class))).thenReturn(resp);

        mockMvc.perform(authPost("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"username\": \"alice\", \"password\": \"pwd\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").value("jwt.token"));
    }

    @Test
    @DisplayName("POST /api/auth/login - wrong credentials")
    void login_wrongCredentials() throws Exception {
        when(userService.login(any(LoginRequest.class)))
                .thenThrow(new BusinessException("Invalid username or password"));

        mockMvc.perform(authPost("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"username\": \"alice\", \"password\": \"wrong\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    @DisplayName("POST /api/auth/register - register succeeds")
    void register_succeeds() throws Exception {
        JwtResponse resp = JwtResponse.builder().token("jwt").id(1L).username("alice").build();
        when(userService.register(any(RegisterRequest.class))).thenReturn(resp);

        mockMvc.perform(authPost("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"username\": \"alice\", \"email\": \"alice@example.com\", \"password\": \"pwd123\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("POST /api/auth/register - duplicate username")
    void register_duplicateUsername() throws Exception {
        when(userService.register(any(RegisterRequest.class)))
                .thenThrow(new BusinessException("Username already exists"));

        mockMvc.perform(authPost("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"username\": \"alice\", \"email\": \"alice@example.com\", \"password\": \"pwd123\" }"))
                .andExpect(jsonPath("$.message").value("Username already exists"));
    }

    @Test
    @DisplayName("GET /api/auth/profile - get profile")
    void profile_succeeds() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        when(userService.getUserInfo(1L)).thenReturn(user);

        doGet("/api/auth/profile")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @DisplayName("POST /api/auth/login - permitAll (no auth required)")
    void login_doesNotRequireAuth() throws Exception {
        when(userService.login(any())).thenReturn(JwtResponse.builder().token("x").build());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"username\": \"x\", \"password\": \"y\" }"))
                .andExpect(status().isOk());
    }
}

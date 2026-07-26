package com.liuzeyu.todolist.support;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.liuzeyu.todolist.common.exception.GlobalExceptionHandler;
import com.liuzeyu.todolist.module.anniversary.service.AnniversaryService;
import com.liuzeyu.todolist.module.export.service.ExportService;
import com.liuzeyu.todolist.module.habit.service.HabitService;
import com.liuzeyu.todolist.module.list.service.TaskListService;
import com.liuzeyu.todolist.module.statistics.service.StatisticsService;
import com.liuzeyu.todolist.module.tag.service.TagService;
import com.liuzeyu.todolist.module.task.service.BatchOperationService;
import com.liuzeyu.todolist.module.task.service.FileUploadService;
import com.liuzeyu.todolist.module.task.service.RepeatTaskService;
import com.liuzeyu.todolist.module.task.service.TaskService;

import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * Controller 切片测试基类 — @WebMvcTest + 完整 Security 链。
 * 使用 personal token (test-personal-token-2026-secure-key) 模拟 userId=1 登录。
 */
@WebMvcTest
@ActiveProfiles("test")
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
public abstract class BaseControllerTest {

    @Autowired
    protected MockMvc mockMvc;

    /**
     * Pre-mock every Service that any @RestController might depend on.
     * @WebMvcTest scans all controllers in the application package, so any
     * controller not under test still needs its service mock provided here.
     * Subclasses can override individual mocks with their own @MockitoBean.
     */
    @MockitoBean protected AnniversaryService anniversaryService;
    @MockitoBean protected BatchOperationService batchOperationService;
    @MockitoBean protected ExportService exportService;
    @MockitoBean protected FileUploadService fileUploadService;
    @MockitoBean protected HabitService habitService;
    @MockitoBean protected RepeatTaskService repeatTaskService;
    @MockitoBean protected StatisticsService statisticsService;
    @MockitoBean protected TagService tagService;
    @MockitoBean protected TaskService taskService;
    @MockitoBean protected TaskListService taskListService;

    /**
     * 携带个人 token 的 request post processor。
     * 将 userId=1L 注入 SecurityContext。
     */
    protected static final String PERSONAL_TOKEN = "test-personal-token-2026-secure-key";

    protected MockHttpServletRequestBuilder authGet(String urlTemplate, Object... uriVars) {
        return get(urlTemplate, uriVars).header("Authorization", "Bearer " + PERSONAL_TOKEN);
    }

    protected MockHttpServletRequestBuilder authPost(String urlTemplate, Object... uriVars) {
        return org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(urlTemplate, uriVars)
                .header("Authorization", "Bearer " + PERSONAL_TOKEN);
    }

    protected MockHttpServletRequestBuilder authPut(String urlTemplate, Object... uriVars) {
        return org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(urlTemplate, uriVars)
                .header("Authorization", "Bearer " + PERSONAL_TOKEN);
    }

    protected MockHttpServletRequestBuilder authDelete(String urlTemplate, Object... uriVars) {
        return org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(urlTemplate, uriVars)
                .header("Authorization", "Bearer " + PERSONAL_TOKEN);
    }

    protected MockHttpServletRequestBuilder authPatch(String urlTemplate, Object... uriVars) {
        return org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(urlTemplate, uriVars)
                .header("Authorization", "Bearer " + PERSONAL_TOKEN);
    }

    /**
     * Spring 7 removed andExpect from MockHttpServletRequestBuilder.
     * Use these do* helpers for the common case (no body/param chaining).
     * For requests that need to chain .content()/.param(), use mockMvc.perform(authXxx(...)...).
     *
     * The TestSecurityConfig's TestAuthFilter auto-injects principal=userId=1L
     * for every request, so @AuthenticationPrincipal Long userId resolves to 1L.
     */
    protected ResultActions doGet(String urlTemplate, Object... uriVars) throws Exception {
        return mockMvc.perform(authGet(urlTemplate, uriVars));
    }

    protected ResultActions doPost(String urlTemplate, Object... uriVars) throws Exception {
        return mockMvc.perform(authPost(urlTemplate, uriVars));
    }

    protected ResultActions doPut(String urlTemplate, Object... uriVars) throws Exception {
        return mockMvc.perform(authPut(urlTemplate, uriVars));
    }

    protected ResultActions doDelete(String urlTemplate, Object... uriVars) throws Exception {
        return mockMvc.perform(authDelete(urlTemplate, uriVars));
    }

    protected ResultActions doPatch(String urlTemplate, Object... uriVars) throws Exception {
        return mockMvc.perform(authPatch(urlTemplate, uriVars));
    }
}

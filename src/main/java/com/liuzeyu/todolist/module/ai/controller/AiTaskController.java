package com.liuzeyu.todolist.module.ai.controller;

import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.ai.dto.ParseTaskRequest;
import com.liuzeyu.todolist.module.ai.dto.ParsedTask;
import com.liuzeyu.todolist.module.ai.service.TaskAiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * AI 智能任务录入控制器。
 * <p>
 * 将用户自然语言描述通过 LLM 解析为结构化任务数据。
 * 路径前缀 /api/ai，走 JWT 认证（与其它 API 一致）。
 * <p>
 * 通过 {@code Optional<TaskAiService>} 注入实现优雅降级：
 * 未配置 AI_API_KEY 时 bean 不存在，返回 503 提示而非启动失败。
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI 智能录入", description = "自然语言→结构化任务的 AI 解析接口")
public class AiTaskController {

    private final Optional<TaskAiService> taskAiServiceOptional;

    /**
     * 解析自然语言为结构化任务。
     *
     * @param userId  用户 ID（从 JWT 解析）
     * @param request 请求体，包含自然语言输入
     * @return 解析后的结构化任务数据
     */
    @PostMapping("/parse-task")
    @Operation(summary = "解析自然语言为结构化任务")
    public Result<ParsedTask> parseTask(@AuthenticationPrincipal Long userId,
                                        @Valid @RequestBody ParseTaskRequest request) {
        return taskAiServiceOptional.map(svc -> {
            try {
                return Result.success(svc.parseTask(request.getInput()));
            } catch (Exception e) {
                log.error("AI 任务解析失败: {}", e.getMessage(), e);
                return Result.<ParsedTask>error(503, "AI 服务暂不可用，请检查 AI_API_KEY 配置");
            }
        }).orElseGet(() -> Result.error(503, "AI 功能未启用，请配置 AI_API_KEY"));
    }
}

package com.liuzeyu.todolist.module.export.controller;

import com.liuzeyu.todolist.module.export.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

/**
 * 数据导出控制器 — CSV / JSON 文件下载
 * <p>
 * 路径前缀 /api/export。提供任务数据的 CSV 和 JSON 格式导出，
 * 以附件形式（Content-Disposition: attachment）返回文件下载。
 */
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "数据导出", description = "数据导出相关接口")
public class ExportController {

    private final ExportService exportService;

    /**
     * 导出任务为 CSV 文件
     *
     * @param userId 用户 ID
     * @return CSV 文件响应
     */
    @GetMapping("/tasks/csv")
    @Operation(summary = "导出任务为CSV")
    public ResponseEntity<byte[]> exportTasksCsv(@AuthenticationPrincipal Long userId) {
        String csv = exportService.exportTasksAsCsv(userId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv;charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "tasks.csv");
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(csv.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 导出任务为 JSON 文件
     *
     * @param userId 用户 ID
     * @return JSON 文件响应
     */
    @GetMapping("/tasks/json")
    @Operation(summary = "导出任务为JSON")
    public ResponseEntity<byte[]> exportTasksJson(@AuthenticationPrincipal Long userId) {
        String json = exportService.exportTasksAsJson(userId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDispositionFormData("attachment", "tasks.json");
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(json.getBytes(StandardCharsets.UTF_8));
    }
}

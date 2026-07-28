package com.liuzeyu.todolist.module.task.controller;

import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.task.entity.TaskAttachment;
import com.liuzeyu.todolist.module.task.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * 文件附件控制器 — 上传、下载、删除任务附件
 * <p>
 * 路径前缀 /api/attachments。上传的文件存储在服务器文件系统，
 * 下载时验证路径防止路径遍历攻击。
 */
@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "文件附件", description = "任务附件管理接口")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    /**
     * 上传任务附件
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     * @param file   上传文件
     * @return 附件记录
     */
    @PostMapping("/tasks/{taskId}")
    @Operation(summary = "上传任务附件")
    public Result<TaskAttachment> uploadFile(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file) {
        try {
            TaskAttachment attachment = fileUploadService.uploadFile(taskId, file);
            return Result.success(attachment);
        } catch (Exception e) {
            return Result.error("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 获取任务附件列表
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     * @return 附件列表
     */
    @GetMapping("/tasks/{taskId}")
    @Operation(summary = "获取任务附件列表")
    public Result<List<TaskAttachment>> getTaskAttachments(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long taskId) {
        List<TaskAttachment> attachments = fileUploadService.getTaskAttachments(taskId);
        return Result.success(attachments);
    }

    /**
     * 删除附件
     *
     * @param userId       用户 ID
     * @param attachmentId 附件 ID
     * @return 空响应
     */
    @DeleteMapping("/{attachmentId}")
    @Operation(summary = "删除附件")
    public Result<Void> deleteAttachment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long attachmentId) {
        try {
            fileUploadService.deleteAttachment(attachmentId);
            return Result.success(null);
        } catch (Exception e) {
            return Result.error("删除附件失败: " + e.getMessage());
        }
    }

    /**
     * 下载附件
     * <p>
     * 验证文件路径在 uploadDir 范围内，防止路径遍历攻击。
     *
     * @param fileName 文件名
     * @return 文件资源响应
     */
    @GetMapping("/{fileName}")
    @Operation(summary = "下载附件")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            Path uploadDir = Paths.get("uploads").toRealPath();
            Path filePath = uploadDir.resolve(fileName).normalize();

            // 防止路径遍历攻击
            if (!filePath.toRealPath().startsWith(uploadDir)) {
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

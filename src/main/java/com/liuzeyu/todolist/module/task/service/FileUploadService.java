package com.liuzeyu.todolist.module.task.service;

import com.liuzeyu.todolist.module.task.entity.TaskAttachment;
import com.liuzeyu.todolist.module.task.mapper.TaskAttachmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * 文件上传服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final TaskAttachmentRepository attachmentRepository;

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    /**
     * 上传文件
     */
    @Transactional
    public TaskAttachment uploadFile(Long taskId, MultipartFile file) throws IOException {
        // 验证文件
        if (file.isEmpty()) {
            throw new IllegalArgumentException("文件不能为空");
        }

        // 验证文件大小（10MB）
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("文件大小不能超过10MB");
        }

        // 创建上传目录
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 生成唯一文件名
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + extension;

        // 保存文件
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        // 保存附件记录
        TaskAttachment attachment = new TaskAttachment();
        attachment.setTaskId(taskId);
        attachment.setFileName(originalFileName != null ? originalFileName : fileName);
        attachment.setFilePath(filePath.toString());
        attachment.setFileSize(file.getSize());
        attachment.setContentType(file.getContentType());
        attachment.setFileUrl("/api/attachments/" + fileName);
        attachment.setCreatedAt(LocalDateTime.now());

        attachmentRepository.save(attachment);

        log.info("文件上传成功: taskId={}, fileName={}, size={}", taskId, fileName, file.getSize());
        return attachment;
    }

    /**
     * 获取任务的附件列表
     */
    public List<TaskAttachment> getTaskAttachments(Long taskId) {
        return attachmentRepository.findByTaskId(taskId);
    }

    /**
     * 删除附件
     */
    @Transactional
    public void deleteAttachment(Long attachmentId) {
        TaskAttachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new RuntimeException("附件不存在"));

        // 删除文件
        try {
            Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        } catch (IOException e) {
            log.error("删除文件失败: {}", attachment.getFilePath(), e);
        }

        // 删除记录
        attachmentRepository.delete(attachment);
        log.info("附件删除成功: attachmentId={}", attachmentId);
    }

    /**
     * 删除任务的所有附件
     */
    @Transactional
    public void deleteTaskAttachments(Long taskId) {
        List<TaskAttachment> attachments = attachmentRepository.findByTaskId(taskId);
        for (TaskAttachment attachment : attachments) {
            try {
                Files.deleteIfExists(Paths.get(attachment.getFilePath()));
            } catch (IOException e) {
                log.error("删除文件失败: {}", attachment.getFilePath(), e);
            }
        }
        attachmentRepository.deleteByTaskId(taskId);
        log.info("任务附件全部删除: taskId={}", taskId);
    }
}


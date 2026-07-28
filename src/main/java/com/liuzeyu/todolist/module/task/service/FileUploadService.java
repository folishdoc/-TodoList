package com.liuzeyu.todolist.module.task.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.task.entity.TaskAttachment;
import com.liuzeyu.todolist.module.task.mapper.TaskAttachmentMapper;
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
 * <p>
 * 处理任务附件的上传、下载和删除。文件存储在服务器文件系统（uploadDir 配置），
 * 附件元信息记录在 task_attachments 表。支持文件大小校验（上限 10MB）、
 * 唯一文件名生成（UUID）、路径遍历攻击防护。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final TaskAttachmentMapper attachmentMapper;

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    /**
     * 上传文件到任务附件
     *
     * @param taskId 任务 ID
     * @param file   上传的文件（Multipart）
     * @return 附件记录
     * @throws IOException          文件读写失败
     * @throws IllegalArgumentException 文件为空或超过大小限制
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

        // 生成唯一文件名（UUID + 原始扩展名）
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + extension;

        // 保存文件到磁盘
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        // 保存附件记录到数据库
        TaskAttachment attachment = new TaskAttachment();
        attachment.setTaskId(taskId);
        attachment.setFileName(originalFileName != null ? originalFileName : fileName);
        attachment.setFilePath(filePath.toString());
        attachment.setFileSize(file.getSize());
        attachment.setContentType(file.getContentType());
        attachment.setFileUrl("/api/attachments/" + fileName);
        attachment.setCreatedAt(LocalDateTime.now());

        attachmentMapper.insert(attachment);

        log.info("文件上传成功: taskId={}, fileName={}, size={}", taskId, fileName, file.getSize());
        return attachment;
    }

    /**
     * 获取任务的附件列表
     *
     * @param taskId 任务 ID
     * @return 附件列表
     */
    public List<TaskAttachment> getTaskAttachments(Long taskId) {
        return attachmentMapper.findByTaskId(taskId);
    }

    /**
     * 删除附件（删除文件 + 删除数据库记录）
     *
     * @param attachmentId 附件 ID
     * @throws BusinessException 404 附件不存在
     */
    @Transactional
    public void deleteAttachment(Long attachmentId) {
        TaskAttachment attachment = attachmentMapper.findById(attachmentId);
        if (attachment == null) {
            throw new BusinessException(404, "附件不存在");
        }

        // 删除物理文件
        try {
            Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        } catch (IOException e) {
            log.error("删除文件失败: {}", attachment.getFilePath(), e);
        }

        // 删除数据库记录
        attachmentMapper.deleteById(attachment.getId());
        log.info("附件删除成功: attachmentId={}", attachmentId);
    }

    /**
     * 删除任务的所有附件
     *
     * @param taskId 任务 ID
     */
    @Transactional
    public void deleteTaskAttachments(Long taskId) {
        List<TaskAttachment> attachments = attachmentMapper.findByTaskId(taskId);
        for (TaskAttachment attachment : attachments) {
            try {
                Files.deleteIfExists(Paths.get(attachment.getFilePath()));
            } catch (IOException e) {
                log.error("删除文件失败: {}", attachment.getFilePath(), e);
            }
        }
        attachmentMapper.deleteByTaskId(taskId);
        log.info("任务附件全部删除: taskId={}", taskId);
    }
}


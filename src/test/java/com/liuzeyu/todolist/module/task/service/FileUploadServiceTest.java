package com.liuzeyu.todolist.module.task.service;

import com.liuzeyu.todolist.module.task.entity.TaskAttachment;
import com.liuzeyu.todolist.module.task.mapper.TaskAttachmentMapper;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FileUploadServiceTest extends BaseUnitTest {

    @Mock
    private TaskAttachmentMapper attachmentMapper;

    @InjectMocks
    private FileUploadService fileUploadService;

    private Path tempUploadDir;

    @BeforeEach
    void setUp() throws IOException {
        tempUploadDir = Files.createTempDirectory("test-uploads-");
        ReflectionTestUtils.setField(fileUploadService, "uploadDir", tempUploadDir.toString());
    }

    @Test
    @DisplayName("上传文件 - 正常")
    void upload_succeeds() throws IOException {
        MultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "hello".getBytes());
        when(attachmentMapper.insert(any(TaskAttachment.class))).thenReturn(1);

        TaskAttachment attachment = fileUploadService.uploadFile(1L, file);

        assertThat(attachment.getTaskId()).isEqualTo(1L);
        assertThat(attachment.getFileName()).isEqualTo("test.txt");
        assertThat(attachment.getFileSize()).isEqualTo(5L);
        assertThat(attachment.getContentType()).isEqualTo("text/plain");
        assertThat(Files.list(tempUploadDir).count()).isEqualTo(1);
    }

    @Test
    @DisplayName("上传文件 - 空文件抛异常")
    void upload_empty_throws() {
        MultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", new byte[0]);

        assertThatThrownBy(() -> fileUploadService.uploadFile(1L, file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("文件不能为空");
    }

    @Test
    @DisplayName("上传文件 - 超过 10MB 抛异常")
    void upload_tooLarge_throws() {
        byte[] bigContent = new byte[11 * 1024 * 1024];
        MultipartFile file = new MockMultipartFile("file", "big.bin", "application/octet-stream", bigContent);

        assertThatThrownBy(() -> fileUploadService.uploadFile(1L, file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("不能超过10MB");
    }

    @Test
    @DisplayName("上传文件 - 无扩展名时使用原文件名")
    void upload_noExtension() throws IOException {
        MultipartFile file = new MockMultipartFile("file", "README", "text/plain", "hello".getBytes());
        when(attachmentMapper.insert(any(TaskAttachment.class))).thenReturn(1);

        TaskAttachment attachment = fileUploadService.uploadFile(1L, file);

        assertThat(attachment.getFileName()).isEqualTo("README");
    }

    @Test
    @DisplayName("获取任务附件 - 委托给 mapper")
    void getTaskAttachments_delegates() {
        TaskAttachment a = new TaskAttachment();
        when(attachmentMapper.findByTaskId(1L)).thenReturn(List.of(a));

        List<TaskAttachment> result = fileUploadService.getTaskAttachments(1L);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("删除附件 - 存在则删除")
    void delete_succeeds() throws IOException {
        TaskAttachment a = new TaskAttachment();
        a.setId(1L);
        a.setFilePath(tempUploadDir.resolve("dummy.txt").toString());
        Files.writeString(Path.of(a.getFilePath()), "x");
        when(attachmentMapper.findById(1L)).thenReturn(a);

        fileUploadService.deleteAttachment(1L);

        assertThat(Files.exists(Path.of(a.getFilePath()))).isFalse();
        verify(attachmentMapper).deleteById(1L);
    }

    @Test
    @DisplayName("删除附件 - 不存在抛异常")
    void delete_notFound_throws() {
        when(attachmentMapper.findById(1L)).thenReturn(null);

        assertThatThrownBy(() -> fileUploadService.deleteAttachment(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("附件不存在");
    }
}

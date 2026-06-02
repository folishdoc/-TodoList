package com.liuzeyu.todolist.module.export.service;

import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskRepository;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

class ExportServiceTest extends BaseUnitTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private ExportService exportService;

    private Task makeTask(Long id, String title, String desc, int priority, int status) {
        Task t = new Task();
        t.setId(id);
        t.setUserId(1L);
        t.setTitle(title);
        t.setDescription(desc);
        t.setPriority(priority);
        t.setStatus(status);
        t.setCreatedAt(LocalDateTime.of(2026, 6, 1, 10, 0));
        t.setDueDate(LocalDateTime.of(2026, 6, 2, 18, 0));
        return t;
    }

    @Test
    @DisplayName("导出 CSV - 包含表头与所有任务行")
    void exportCsv_includesHeader() {
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of(
                makeTask(1L, "A", "desc1", 2, 0),
                makeTask(2L, "B", "desc2", 3, 1)
        ));

        String csv = exportService.exportTasksAsCsv(1L);

        assertThat(csv).startsWith("ID,标题,描述,优先级,状态,截止日期,创建时间");
        assertThat(csv).contains("A,desc1,中,待完成");
        assertThat(csv).contains("B,desc2,高,已完成");
    }

    @Test
    @DisplayName("导出 CSV - 含逗号或引号应被转义")
    void exportCsv_escapesSpecialChars() {
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of(
                makeTask(1L, "标题,逗号", "描述\"引号", 2, 0)
        ));

        String csv = exportService.exportTasksAsCsv(1L);

        assertThat(csv).contains("\"标题,逗号\"");
        assertThat(csv).contains("\"描述\"\"引号\"");
    }

    @Test
    @DisplayName("导出 CSV - 空列表只输出表头")
    void exportCsv_empty() {
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of());

        String csv = exportService.exportTasksAsCsv(1L);

        assertThat(csv.split("\n")).hasSize(1);
    }

    @Test
    @DisplayName("导出 JSON - 包含所有任务")
    void exportJson_includesAllTasks() {
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of(
                makeTask(1L, "A", null, 2, 0),
                makeTask(2L, "B", null, 3, 1)
        ));

        String json = exportService.exportTasksAsJson(1L);

        assertThat(json).startsWith("[");
        assertThat(json).endsWith("]");
        assertThat(json).contains("\"title\": \"A\"");
        assertThat(json).contains("\"title\": \"B\"");
        assertThat(json).contains("\"priority\": 2");
        assertThat(json).contains("\"status\": 0");
    }

    @Test
    @DisplayName("导出 JSON - 转义引号和反斜杠")
    void exportJson_escapesSpecialChars() {
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of(
                makeTask(1L, "标题\"引号\\反斜杠", null, 2, 0)
        ));

        String json = exportService.exportTasksAsJson(1L);

        assertThat(json).contains("\"标题\\\"引号\\\\反斜杠\"");
    }

    @Test
    @DisplayName("导出 JSON - 空列表")
    void exportJson_empty() {
        when(taskRepository.findAllByUserId(1L)).thenReturn(List.of());

        String json = exportService.exportTasksAsJson(1L);

        assertThat(json).isEqualTo("[\n]");
    }
}

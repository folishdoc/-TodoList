package com.liuzeyu.todolist.module.export.service;

import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 数据导出服务
 */
@Service
@RequiredArgsConstructor
public class ExportService {

    private final TaskRepository taskRepository;

    /**
     * 导出任务为CSV格式
     */
    public String exportTasksAsCsv(Long userId) {
        List<Task> tasks = taskRepository.findAllByUserId(userId);
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,标题,描述,优先级,状态,截止日期,创建时间\n");
        
        for (Task task : tasks) {
            csv.append(task.getId()).append(",");
            csv.append(escapeCsv(task.getTitle())).append(",");
            csv.append(escapeCsv(task.getDescription() != null ? task.getDescription() : "")).append(",");
            csv.append(getPriorityText(task.getPriority())).append(",");
            csv.append(task.getStatus() == 1 ? "已完成" : "待完成").append(",");
            csv.append(task.getDueDate() != null ? task.getDueDate().toString() : "").append(",");
            csv.append(task.getCreatedAt() != null ? task.getCreatedAt().toString() : "").append("\n");
        }
        
        return csv.toString();
    }

    /**
     * 导出任务为JSON格式（简化版）
     */
    public String exportTasksAsJson(Long userId) {
        List<Task> tasks = taskRepository.findAllByUserId(userId);
        
        StringBuilder json = new StringBuilder();
        json.append("[\n");
        
        for (int i = 0; i < tasks.size(); i++) {
            Task task = tasks.get(i);
            json.append("  {\n");
            json.append("    \"id\": ").append(task.getId()).append(",\n");
            json.append("    \"title\": \"").append(escapeJson(task.getTitle())).append("\",\n");
            json.append("    \"priority\": ").append(task.getPriority()).append(",\n");
            json.append("    \"status\": ").append(task.getStatus()).append("\n");
            json.append("  }");
            if (i < tasks.size() - 1) {
                json.append(",");
            }
            json.append("\n");
        }
        
        json.append("]");
        return json.toString();
    }

    private String escapeCsv(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    private String getPriorityText(Integer priority) {
        return switch (priority) {
            case 3 -> "高";
            case 2 -> "中";
            case 1 -> "低";
            default -> "未知";
        };
    }
}

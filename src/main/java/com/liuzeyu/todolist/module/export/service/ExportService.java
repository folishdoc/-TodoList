package com.liuzeyu.todolist.module.export.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.liuzeyu.todolist.common.constant.PriorityEnum;
import com.liuzeyu.todolist.common.constant.TaskStatusEnum;
import com.liuzeyu.todolist.module.task.entity.Task;
import com.liuzeyu.todolist.module.task.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 数据导出服务
 */
@Service
@RequiredArgsConstructor
public class ExportService {

    private final TaskMapper taskMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 导出任务为CSV格式
     */
    public String exportTasksAsCsv(Long userId) {
        List<Task> tasks = taskMapper.findAllByUserId(userId);
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,标题,描述,优先级,状态,截止日期,创建时间\n");
        
        for (Task task : tasks) {
            csv.append(task.getId()).append(",");
            csv.append(escapeCsv(task.getTitle())).append(",");
            csv.append(escapeCsv(task.getDescription() != null ? task.getDescription() : "")).append(",");
            csv.append(PriorityEnum.fromCode(task.getPriority()).getDescription()).append(",");
            csv.append(task.getStatus() == TaskStatusEnum.COMPLETE.getCode() ? "已完成" : "待完成").append(",");
            csv.append(task.getDueDate() != null ? task.getDueDate().toString() : "").append(",");
            csv.append(task.getCreatedAt() != null ? task.getCreatedAt().toString() : "").append("\n");
        }
        
        return csv.toString();
    }

    /**
     * 导出任务为JSON格式（使用Jackson）
     */
    public String exportTasksAsJson(Long userId) {
        List<Task> tasks = taskMapper.findAllByUserId(userId);
        try {
            List<Map<String, Object>> jsonList = tasks.stream().map(task -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", task.getId());
                map.put("title", task.getTitle());
                map.put("priority", task.getPriority());
                map.put("status", task.getStatus());
                return map;
            }).collect(java.util.stream.Collectors.toList());
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(jsonList);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new RuntimeException("JSON 导出失败", e);
        }
    }

    private String escapeCsv(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }


}

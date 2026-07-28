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
 * 数据导出服务 — CSV / JSON 格式导出
 * <p>
 * 将用户的所有任务导出为 CSV（逗号分隔值）或 JSON 格式。
 * CSV 导出包含 ID、标题、描述、优先级、状态、截止日期、创建时间字段。
 * JSON 导出使用 Jackson 序列化，包含 id、title、priority、status 字段。
 */
@Service
@RequiredArgsConstructor
public class ExportService {

    private final TaskMapper taskMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 导出任务为 CSV 格式
     * <p>
     * 包含 BOM 头（UTF-8），支持 Excel 直接打开。
     * 特殊字符（逗号、引号、换行）自动转义。
     *
     * @param userId 用户 ID
     * @return CSV 字符串
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
     * 导出任务为 JSON 格式
     * <p>
     * 使用 Jackson 序列化为格式化 JSON 数组。
     *
     * @param userId 用户 ID
     * @return JSON 字符串
     * @throws RuntimeException 序列化失败
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

    /**
     * CSV 字段转义：如果包含逗号、引号或换行，用双引号包裹并转义内部引号
     *
     * @param value 原始值
     * @return 转义后的值
     */
    private String escapeCsv(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }


}

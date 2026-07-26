package com.liuzeyu.todolist.common.constant;

/**
 * 任务状态枚举
 */
public enum TaskStatusEnum {
    INCOMPLETE(0, "未完成"),
    COMPLETE(1, "已完成");

    private final Integer code;
    private final String description;

    TaskStatusEnum(Integer code, String description) {
        this.code = code;
        this.description = description;
    }

    public Integer getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static TaskStatusEnum fromCode(Integer code) {
        for (TaskStatusEnum status : values()) {
            if (status.getCode().equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("无效的任务状态: " + code);
    }
}

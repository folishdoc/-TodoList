package com.liuzeyu.todolist.common.constant;

/**
 * 任务优先级枚举
 */
public enum PriorityEnum {
    LOW(1, "低"),
    MEDIUM(2, "中"),
    HIGH(3, "高");

    private final Integer code;
    private final String description;

    PriorityEnum(Integer code, String description) {
        this.code = code;
        this.description = description;
    }

    public Integer getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static PriorityEnum fromCode(Integer code) {
        for (PriorityEnum priority : values()) {
            if (priority.getCode().equals(code)) {
                return priority;
            }
        }
        throw new IllegalArgumentException("无效的优先级: " + code);
    }
}

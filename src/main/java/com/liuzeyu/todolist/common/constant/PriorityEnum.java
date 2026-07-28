package com.liuzeyu.todolist.common.constant;

/**
 * 任务优先级枚举
 * <p>
 * 定义三级优先级：LOW(1)、MEDIUM(2)、HIGH(3)。
 * code 字段存储于数据库，description 用于前端展示。
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

    /**
     * 根据 code 查找对应的优先级枚举
     *
     * @param code 优先级代码（1/2/3）
     * @return 匹配的 PriorityEnum
     * @throws IllegalArgumentException 如果 code 无效
     */
    public static PriorityEnum fromCode(Integer code) {
        for (PriorityEnum priority : values()) {
            if (priority.getCode().equals(code)) {
                return priority;
            }
        }
        throw new IllegalArgumentException("无效的优先级: " + code);
    }
}

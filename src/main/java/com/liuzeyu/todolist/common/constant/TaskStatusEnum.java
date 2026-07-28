package com.liuzeyu.todolist.common.constant;

/**
 * 任务状态枚举
 * <p>
 * 仅两种状态：INCOMPLETE(0, "未完成") 和 COMPLETE(1, "已完成")。
 * 状态变更通过 TaskService.completeTask() / uncompleteTask() 完成。
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

    /**
     * 根据 code 查找对应的状态枚举
     *
     * @param code 状态代码（0/1）
     * @return 匹配的 TaskStatusEnum
     * @throws IllegalArgumentException 如果 code 无效
     */
    public static TaskStatusEnum fromCode(Integer code) {
        for (TaskStatusEnum status : values()) {
            if (status.getCode().equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("无效的任务状态: " + code);
    }
}

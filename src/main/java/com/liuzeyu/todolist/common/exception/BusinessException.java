package com.liuzeyu.todolist.common.exception;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 业务异常 — 可携带自定义 HTTP 状态码
 * <p>
 * 用于 Service 层抛出可预期的业务错误（如资源不存在、权限不足、参数冲突等）。
 * 由 {@link GlobalExceptionHandler} 统一捕获并转换为 {@link com.liuzeyu.todolist.common.result.Result} 响应。
 * 默认 code=500，可通过构造函数指定（如 400/403/404/409）。
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class BusinessException extends RuntimeException {
    private Integer code;

    /**
     * @param message 错误描述
     */
    public BusinessException(String message) {
        super(message);
        this.code = 500;
    }

    /**
     * @param code    自定义错误码（对应 HTTP 状态码语义）
     * @param message 错误描述
     */
    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
    }

    /**
     * @param message 错误描述
     * @param cause   原始异常
     */
    public BusinessException(String message, Throwable cause) {
        super(message, cause);
        this.code = 500;
    }
}

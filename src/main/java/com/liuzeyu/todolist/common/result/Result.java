package com.liuzeyu.todolist.common.result;

import lombok.Data;

/**
 * 统一 API 响应体 — 所有 Controller 方法返回此结构
 * <p>
 * 前端 axios 拦截器自动解包：检查 code === 200 后返回 data，否则 reject。
 * 成功响应：{ "code": 200, "message": "success", "data": T }
 * 错误响应：{ "code": 4xx/5xx, "message": "错误描述", "data": null }
 *
 * @param <T> data 字段的类型
 */
@Data
public class Result<T> {
    private Integer code;
    private String message;
    private T data;

    private Result() {}

    /**
     * 成功响应（无数据）
     *
     * @return Result 实例，code=200, message="success"
     */
    public static <T> Result<T> success() {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("success");
        return result;
    }

    /**
     * 成功响应（带数据）
     *
     * @param data 响应数据
     * @return Result 实例，code=200, message="success"
     */
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("success");
        result.setData(data);
        return result;
    }

    /**
     * 成功响应（自定义消息 + 数据）
     *
     * @param message 成功消息
     * @param data    响应数据
     * @return Result 实例，code=200
     */
    public static <T> Result<T> success(String message, T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage(message);
        result.setData(data);
        return result;
    }

    /**
     * 错误响应（默认 500）
     *
     * @param message 错误描述
     * @return Result 实例，code=500
     */
    public static <T> Result<T> error(String message) {
        Result<T> result = new Result<>();
        result.setCode(500);
        result.setMessage(message);
        return result;
    }

    /**
     * 错误响应（自定义错误码）
     *
     * @param code    错误码（通常对应 HTTP 状态码）
     * @param message 错误描述
     * @return Result 实例
     */
    public static <T> Result<T> error(Integer code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        return result;
    }
}

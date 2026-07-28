package com.liuzeyu.todolist.common.exception;

import com.liuzeyu.todolist.common.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器 — {@code @RestControllerAdvice} 统一异常处理
 * <p>
 * 将各类异常转换为统一的 {@link Result} 响应格式，避免在每个 Controller 中重复 try-catch。
 * 处理范围：业务异常、认证异常、参数校验异常、以及其他未预期异常。
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理业务异常（BusinessException）
     * <p>
     * 使用异常自带的 code 作为响应码，message 作为错误信息。
     *
     * @param e 业务异常
     * @return 统一错误响应
     */
    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusinessException(BusinessException e) {
        return Result.error(e.getCode(), e.getMessage());
    }

    /**
     * 处理认证异常（BadCredentialsException）
     * <p>
     * 用户名或密码错误时抛出，返回 401 状态码。
     *
     * @param e 认证异常
     * @return 401 错误响应
     */
    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Result<?> handleBadCredentialsException(BadCredentialsException e) {
        return Result.error(401, "用户名或密码错误");
    }

    /**
     * 处理参数校验异常（@Valid / @Validated 校验失败）
     * <p>
     * 提取 BindingResult 中的第一条错误消息返回。
     *
     * @param e MethodArgumentNotValidException 或 BindException
     * @return 400 错误响应
     */
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<?> handleValidationException(Exception e) {
        String message = "参数校验失败";
        if (e instanceof MethodArgumentNotValidException) {
            MethodArgumentNotValidException ex = (MethodArgumentNotValidException) e;
            if (ex.getBindingResult().hasErrors()) {
                message = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
            }
        } else if (e instanceof BindException) {
            BindException ex = (BindException) e;
            if (ex.getBindingResult().hasErrors()) {
                message = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
            }
        }
        return Result.error(400, message);
    }

    /**
     * 处理未预期的系统异常（兜底处理）
     * <p>
     * 记录完整堆栈日志，返回通用错误消息，避免泄露内部实现细节。
     *
     * @param e 系统异常
     * @return 500 错误响应
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<?> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.error("系统内部错误，请联系管理员");
    }
}

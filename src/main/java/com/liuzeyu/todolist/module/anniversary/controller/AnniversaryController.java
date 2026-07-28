package com.liuzeyu.todolist.module.anniversary.controller;

import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.anniversary.dto.AnniversaryRequest;
import com.liuzeyu.todolist.module.anniversary.dto.AnniversaryVO;
import com.liuzeyu.todolist.module.anniversary.entity.Anniversary;
import com.liuzeyu.todolist.module.anniversary.entity.ReminderLog;
import com.liuzeyu.todolist.module.anniversary.service.AnniversaryService;
import com.liuzeyu.todolist.module.task.entity.Task;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 纪念日控制器 — 纪念日 CRUD、生成待办、提醒管理
 * <p>
 * 路径前缀 /api/anniversaries。提供纪念日的完整管理接口，
 * 包括列表查询（支持搜索/排序/标签筛选）、详情、创建、更新、删除，
 * 以及生成关联待办和提醒已读标记功能。
 */
@RestController
@RequestMapping("/api/anniversaries")
@RequiredArgsConstructor
@Tag(name = "纪念日管理", description = "纪念日的增删改查接口")
public class AnniversaryController {

    private final AnniversaryService anniversaryService;

    /**
     * 获取纪念日列表（支持搜索、排序、标签筛选）
     *
     * @param userId 用户 ID
     * @param sortBy 排序字段
     * @param order  排序方向
     * @param search 搜索关键词
     * @param tag    标签筛选
     * @return 纪念日 VO 列表
     */
    @GetMapping
    @Operation(summary = "获取纪念日列表")
    public Result<List<AnniversaryVO>> list(@AuthenticationPrincipal Long userId,
                                            @RequestParam(required = false) String sortBy,
                                            @RequestParam(required = false) String order,
                                            @RequestParam(required = false) String search,
                                            @RequestParam(required = false) String tag) {
        return Result.success(anniversaryService.list(userId, sortBy, order, search, tag));
    }

    /**
     * 获取纪念日详情
     *
     * @param userId 用户 ID
     * @param id     纪念日 ID
     * @return 纪念日 VO
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取纪念日详情")
    public Result<AnniversaryVO> getDetail(@AuthenticationPrincipal Long userId,
                                           @PathVariable Long id) {
        return Result.success(anniversaryService.getDetail(userId, id));
    }

    /**
     * 创建纪念日
     *
     * @param userId  用户 ID
     * @param request 纪念日请求
     * @return 创建后的纪念日
     */
    @PostMapping
    @Operation(summary = "创建纪念日")
    public Result<Anniversary> create(@AuthenticationPrincipal Long userId,
                                       @Valid @RequestBody AnniversaryRequest request) {
        return Result.success("创建成功", anniversaryService.create(userId, request));
    }

    /**
     * 更新纪念日
     *
     * @param userId  用户 ID
     * @param id      纪念日 ID
     * @param request 更新请求
     * @return 更新后的纪念日
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新纪念日")
    public Result<Anniversary> update(@AuthenticationPrincipal Long userId,
                                       @PathVariable Long id,
                                       @Valid @RequestBody AnniversaryRequest request) {
        return Result.success("更新成功", anniversaryService.update(userId, id, request));
    }

    /**
     * 删除纪念日
     *
     * @param userId 用户 ID
     * @param id     纪念日 ID
     * @return 空响应
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除纪念日")
    public Result<Void> delete(@AuthenticationPrincipal Long userId,
                               @PathVariable Long id) {
        anniversaryService.delete(userId, id);
        return Result.success();
    }

    /**
     * 生成关联待办任务
     *
     * @param userId 用户 ID
     * @param id     纪念日 ID
     * @return 创建的任务
     */
    @PostMapping("/{id}/generate-todo")
    @Operation(summary = "生成关联待办")
    public Result<Task> generateTodo(@AuthenticationPrincipal Long userId,
                                      @PathVariable Long id) {
        return Result.success("待办已生成", anniversaryService.generateTodo(userId, id));
    }

    /**
     * 获取未读提醒
     *
     * @param userId 用户 ID
     * @return 未读提醒列表
     */
    @GetMapping("/pending-reminders")
    @Operation(summary = "获取未读提醒")
    public Result<List<ReminderLog>> getPendingReminders(@AuthenticationPrincipal Long userId) {
        return Result.success(anniversaryService.getPendingReminders(userId));
    }

    /**
     * 标记提醒为已读
     *
     * @param logId 提醒日志 ID
     * @return 空响应
     */
    @PutMapping("/reminders/{logId}/read")
    @Operation(summary = "标记提醒已读")
    public Result<Void> markReminderRead(@PathVariable Long logId) {
        anniversaryService.markReminderRead(logId);
        return Result.success();
    }
}

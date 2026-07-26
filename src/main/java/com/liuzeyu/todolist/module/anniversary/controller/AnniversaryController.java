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

@RestController
@RequestMapping("/api/anniversaries")
@RequiredArgsConstructor
@Tag(name = "纪念日管理", description = "纪念日的增删改查接口")
public class AnniversaryController {

    private final AnniversaryService anniversaryService;

    @GetMapping
    @Operation(summary = "获取纪念日列表")
    public Result<List<AnniversaryVO>> list(@AuthenticationPrincipal Long userId,
                                            @RequestParam(required = false) String sortBy,
                                            @RequestParam(required = false) String order,
                                            @RequestParam(required = false) String search,
                                            @RequestParam(required = false) String tag) {
        return Result.success(anniversaryService.list(userId, sortBy, order, search, tag));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取纪念日详情")
    public Result<AnniversaryVO> getDetail(@AuthenticationPrincipal Long userId,
                                           @PathVariable Long id) {
        return Result.success(anniversaryService.getDetail(userId, id));
    }

    @PostMapping
    @Operation(summary = "创建纪念日")
    public Result<Anniversary> create(@AuthenticationPrincipal Long userId,
                                       @Valid @RequestBody AnniversaryRequest request) {
        return Result.success("创建成功", anniversaryService.create(userId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新纪念日")
    public Result<Anniversary> update(@AuthenticationPrincipal Long userId,
                                       @PathVariable Long id,
                                       @Valid @RequestBody AnniversaryRequest request) {
        return Result.success("更新成功", anniversaryService.update(userId, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除纪念日")
    public Result<Void> delete(@AuthenticationPrincipal Long userId,
                               @PathVariable Long id) {
        anniversaryService.delete(userId, id);
        return Result.success();
    }

    @PostMapping("/{id}/generate-todo")
    @Operation(summary = "生成关联待办")
    public Result<Task> generateTodo(@AuthenticationPrincipal Long userId,
                                      @PathVariable Long id) {
        return Result.success("待办已生成", anniversaryService.generateTodo(userId, id));
    }

    @GetMapping("/pending-reminders")
    @Operation(summary = "获取未读提醒")
    public Result<List<ReminderLog>> getPendingReminders(@AuthenticationPrincipal Long userId) {
        return Result.success(anniversaryService.getPendingReminders(userId));
    }

    @PutMapping("/reminders/{logId}/read")
    @Operation(summary = "标记提醒已读")
    public Result<Void> markReminderRead(@PathVariable Long logId) {
        anniversaryService.markReminderRead(logId);
        return Result.success();
    }
}

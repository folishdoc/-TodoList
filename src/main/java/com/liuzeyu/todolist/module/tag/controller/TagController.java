package com.liuzeyu.todolist.module.tag.controller;

import com.liuzeyu.todolist.common.result.Result;
import com.liuzeyu.todolist.module.tag.dto.TagRequest;
import com.liuzeyu.todolist.module.tag.entity.Tag;
import com.liuzeyu.todolist.module.tag.service.TagService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 标签控制器
 */
@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "标签管理", description = "标签相关接口")
public class TagController {

    private final TagService tagService;

    @PostMapping
    @Operation(summary = "创建标签")
    public Result<Tag> createTag(@AuthenticationPrincipal Long userId,
                                  @Valid @RequestBody TagRequest request) {
        Tag tag = tagService.createTag(userId, request);
        return Result.success(tag);
    }

    @GetMapping
    @Operation(summary = "获取所有标签")
    public Result<List<Tag>> getTags(@AuthenticationPrincipal Long userId) {
        List<Tag> tags = tagService.getUserTags(userId);
        return Result.success(tags);
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新标签")
    public Result<Tag> updateTag(@AuthenticationPrincipal Long userId,
                                  @PathVariable Long id,
                                  @Valid @RequestBody TagRequest request) {
        Tag tag = tagService.updateTag(userId, id, request);
        return Result.success(tag);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除标签")
    public Result<Void> deleteTag(@AuthenticationPrincipal Long userId,
                                   @PathVariable Long id) {
        tagService.deleteTag(userId, id);
        return Result.success(null);
    }

    @PostMapping("/tasks/{taskId}")
    @Operation(summary = "为任务添加标签")
    public Result<Void> addTagToTask(@AuthenticationPrincipal Long userId,
                                      @PathVariable Long taskId,
                                      @RequestParam Long tagId) {
        tagService.addTagToTask(userId, taskId, tagId);
        return Result.success(null);
    }

    @DeleteMapping("/tasks/{taskId}")
    @Operation(summary = "移除任务标签")
    public Result<Void> removeTagFromTask(@AuthenticationPrincipal Long userId,
                                           @PathVariable Long taskId,
                                           @RequestParam Long tagId) {
        tagService.removeTagFromTask(userId, taskId, tagId);
        return Result.success(null);
    }

    @GetMapping("/tasks/{taskId}")
    @Operation(summary = "获取任务的标签")
    public Result<List<Tag>> getTaskTags(@PathVariable Long taskId) {
        List<Tag> tags = tagService.getTaskTags(taskId);
        return Result.success(tags);
    }
}

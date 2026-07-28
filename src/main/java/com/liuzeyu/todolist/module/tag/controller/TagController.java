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
 * 标签控制器 — 标签 CRUD 及任务-标签关联管理
 * <p>
 * 路径前缀 /api/tags。提供标签的增删改查、为任务添加/移除标签、
 * 获取任务标签列表等功能。
 */
@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "标签管理", description = "标签相关接口")
public class TagController {

    private final TagService tagService;

    /**
     * 创建标签
     *
     * @param userId  用户 ID
     * @param request 标签请求
     * @return 创建后的标签
     */
    @PostMapping
    @Operation(summary = "创建标签")
    public Result<Tag> createTag(@AuthenticationPrincipal Long userId,
                                  @Valid @RequestBody TagRequest request) {
        Tag tag = tagService.createTag(userId, request);
        return Result.success(tag);
    }

    /**
     * 获取所有标签
     *
     * @param userId 用户 ID
     * @return 标签列表
     */
    @GetMapping
    @Operation(summary = "获取所有标签")
    public Result<List<Tag>> getTags(@AuthenticationPrincipal Long userId) {
        List<Tag> tags = tagService.getUserTags(userId);
        return Result.success(tags);
    }

    /**
     * 更新标签
     *
     * @param userId  用户 ID
     * @param id      标签 ID
     * @param request 更新请求
     * @return 更新后的标签
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新标签")
    public Result<Tag> updateTag(@AuthenticationPrincipal Long userId,
                                  @PathVariable Long id,
                                  @Valid @RequestBody TagRequest request) {
        Tag tag = tagService.updateTag(userId, id, request);
        return Result.success(tag);
    }

    /**
     * 删除标签
     *
     * @param userId 用户 ID
     * @param id     标签 ID
     * @return 空响应
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除标签")
    public Result<Void> deleteTag(@AuthenticationPrincipal Long userId,
                                   @PathVariable Long id) {
        tagService.deleteTag(userId, id);
        return Result.success(null);
    }

    /**
     * 为任务添加标签
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     * @param tagId  标签 ID
     * @return 空响应
     */
    @PostMapping("/tasks/{taskId}")
    @Operation(summary = "为任务添加标签")
    public Result<Void> addTagToTask(@AuthenticationPrincipal Long userId,
                                      @PathVariable Long taskId,
                                      @RequestParam Long tagId) {
        tagService.addTagToTask(userId, taskId, tagId);
        return Result.success(null);
    }

    /**
     * 移除任务标签
     *
     * @param userId 用户 ID
     * @param taskId 任务 ID
     * @param tagId  标签 ID
     * @return 空响应
     */
    @DeleteMapping("/tasks/{taskId}")
    @Operation(summary = "移除任务标签")
    public Result<Void> removeTagFromTask(@AuthenticationPrincipal Long userId,
                                           @PathVariable Long taskId,
                                           @RequestParam Long tagId) {
        tagService.removeTagFromTask(userId, taskId, tagId);
        return Result.success(null);
    }

    /**
     * 获取任务的标签
     *
     * @param taskId 任务 ID
     * @return 标签列表
     */
    @GetMapping("/tasks/{taskId}")
    @Operation(summary = "获取任务的标签")
    public Result<List<Tag>> getTaskTags(@PathVariable Long taskId) {
        List<Tag> tags = tagService.getTaskTags(taskId);
        return Result.success(tags);
    }
}

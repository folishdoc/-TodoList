package com.liuzeyu.todolist.module.tag.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.tag.dto.TagRequest;
import com.liuzeyu.todolist.module.tag.entity.Tag;
import com.liuzeyu.todolist.module.tag.entity.TaskTag;
import com.liuzeyu.todolist.module.tag.repository.TagRepository;
import com.liuzeyu.todolist.module.tag.repository.TaskTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 标签服务类
 */
@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final TaskTagRepository taskTagRepository;

    /**
     * 创建标签
     */
    @Transactional
    public Tag createTag(Long userId, TagRequest request) {
        // 检查标签名是否已存在
        Tag existing = tagRepository.findByUserIdAndName(userId, request.getName());
        if (existing != null) {
            throw new BusinessException(409, "标签名称已存在");
        }

        Tag tag = new Tag();
        tag.setName(request.getName());
        tag.setColor(request.getColor());
        tag.setUserId(userId);
        
        return tagRepository.save(tag);
    }

    /**
     * 获取用户的所有标签
     */
    public List<Tag> getUserTags(Long userId) {
        return tagRepository.findByUserId(userId);
    }

    /**
     * 更新标签
     */
    @Transactional
    public Tag updateTag(Long userId, Long tagId, TagRequest request) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new BusinessException(404, "标签不存在"));

        if (!tag.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作此标签");
        }

        // 检查新名称是否与其他标签重复
        Tag existing = tagRepository.findByUserIdAndName(userId, request.getName());
        if (existing != null && !existing.getId().equals(tagId)) {
            throw new BusinessException(409, "标签名称已存在");
        }

        tag.setName(request.getName());
        tag.setColor(request.getColor());
        
        return tagRepository.save(tag);
    }

    /**
     * 删除标签
     */
    @Transactional
    public void deleteTag(Long userId, Long tagId) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new BusinessException(404, "标签不存在"));

        if (!tag.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权操作此标签");
        }

        // 删除任务-标签关联
        taskTagRepository.deleteAllByTagId(tagId);
        
        // 删除标签
        tagRepository.delete(tag);
    }

    /**
     * 为任务添加标签
     */
    @Transactional
    public void addTagToTask(Long userId, Long taskId, Long tagId) {
        // 验证标签属于当前用户
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new BusinessException(404, "标签不存在"));

        if (!tag.getUserId().equals(userId)) {
            throw new BusinessException(403, "无权使用此标签");
        }

        // 检查是否已关联
        TaskTag existing = taskTagRepository.findByTaskIdAndTagId(taskId, tagId);
        if (existing != null) {
            throw new BusinessException(409, "标签已关联");
        }

        TaskTag taskTag = new TaskTag();
        taskTag.setTaskId(taskId);
        taskTag.setTagId(tagId);
        
        taskTagRepository.save(taskTag);
    }

    /**
     * 移除任务的标签
     */
    @Transactional
    public void removeTagFromTask(Long userId, Long taskId, Long tagId) {
        TaskTag taskTag = taskTagRepository.findByTaskIdAndTagId(taskId, tagId);
        if (taskTag == null) {
            throw new BusinessException(400, "标签未关联");
        }

        taskTagRepository.delete(taskTag);
    }

    /**
     * 获取任务的标签列表
     */
    public List<Tag> getTaskTags(Long taskId) {
        List<Long> tagIds = taskTagRepository.findTagIdsByTaskId(taskId);
        return tagRepository.findAllById(tagIds);
    }

}

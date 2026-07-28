package com.liuzeyu.todolist.module.tag.service;

import com.liuzeyu.todolist.common.exception.BusinessException;
import com.liuzeyu.todolist.module.tag.dto.TagRequest;
import com.liuzeyu.todolist.module.tag.entity.Tag;
import com.liuzeyu.todolist.module.tag.entity.TaskTag;
import com.liuzeyu.todolist.module.tag.mapper.TagMapper;
import com.liuzeyu.todolist.module.tag.mapper.TaskTagMapper;
import com.liuzeyu.todolist.support.BaseUnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TagServiceTest extends BaseUnitTest {

    @Mock
    private TagMapper tagMapper;

    @Mock
    private TaskTagMapper taskTagMapper;

    @InjectMocks
    private TagService tagService;

    @Test
    @DisplayName("创建标签 - 正常")
    void create_succeeds() {
        TagRequest req = new TagRequest();
        req.setName("工作");
        req.setColor("#FF0000");
        when(tagMapper.findByUserIdAndName(1L, "工作")).thenReturn(null);
        when(tagMapper.insert(any(Tag.class))).thenReturn(1);

        Tag result = tagService.createTag(1L, req);

        assertThat(result.getName()).isEqualTo("工作");
        assertThat(result.getUserId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("创建标签 - 重复名称抛异常")
    void create_duplicate_throws() {
        TagRequest req = new TagRequest();
        req.setName("工作");
        Tag existing = new Tag();
        existing.setId(1L);
        when(tagMapper.findByUserIdAndName(1L, "工作")).thenReturn(existing);

        assertThatThrownBy(() -> tagService.createTag(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessage("标签名称已存在");
    }

    @Test
    @DisplayName("更新标签 - 正常")
    void update_succeeds() {
        Tag existing = new Tag();
        existing.setId(1L);
        existing.setUserId(1L);
        existing.setName("旧");
        when(tagMapper.findById(1L)).thenReturn(existing);
        when(tagMapper.findByUserIdAndName(1L, "新")).thenReturn(null);
        when(tagMapper.update(any(Tag.class))).thenReturn(1);

        TagRequest req = new TagRequest();
        req.setName("新");
        Tag result = tagService.updateTag(1L, 1L, req);

        assertThat(result.getName()).isEqualTo("新");
    }

    @Test
    @DisplayName("更新标签 - 越权访问抛异常")
    void update_wrongUser_throws() {
        Tag existing = new Tag();
        existing.setId(1L);
        existing.setUserId(2L);
        when(tagMapper.findById(1L)).thenReturn(existing);

        TagRequest req = new TagRequest();
        req.setName("新");
        assertThatThrownBy(() -> tagService.updateTag(1L, 1L, req))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("更新标签 - 与其他标签重名抛异常")
    void update_nameConflict_throws() {
        Tag existing = new Tag();
        existing.setId(1L);
        existing.setUserId(1L);
        Tag other = new Tag();
        other.setId(2L);
        when(tagMapper.findById(1L)).thenReturn(existing);
        when(tagMapper.findByUserIdAndName(1L, "冲突")).thenReturn(other);

        TagRequest req = new TagRequest();
        req.setName("冲突");
        assertThatThrownBy(() -> tagService.updateTag(1L, 1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessage("标签名称已存在");
    }

    @Test
    @DisplayName("删除标签 - 级联删除关联")
    void delete_cascadesRelations() {
        Tag existing = new Tag();
        existing.setId(1L);
        existing.setUserId(1L);
        when(tagMapper.findById(1L)).thenReturn(existing);

        tagService.deleteTag(1L, 1L);

        verify(taskTagMapper).deleteByTagId(1L);
        verify(tagMapper).deleteById(existing.getId());
    }

    @Test
    @DisplayName("为任务添加标签 - 正常")
    void addTagToTask_succeeds() {
        Tag tag = new Tag();
        tag.setId(10L);
        tag.setUserId(1L);
        when(tagMapper.findById(10L)).thenReturn(tag);
        when(taskTagMapper.findByTaskIdAndTagId(1L, 10L)).thenReturn(null);
        when(taskTagMapper.insert(any(TaskTag.class))).thenReturn(1);

        tagService.addTagToTask(1L, 1L, 10L);

        verify(taskTagMapper).insert(any(TaskTag.class));
    }

    @Test
    @DisplayName("为任务添加标签 - 越权使用标签抛异常")
    void addTagToTask_wrongUser_throws() {
        Tag tag = new Tag();
        tag.setId(10L);
        tag.setUserId(2L);
        when(tagMapper.findById(10L)).thenReturn(tag);

        assertThatThrownBy(() -> tagService.addTagToTask(1L, 1L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("无权使用此标签");
    }

    @Test
    @DisplayName("为任务添加标签 - 已关联抛异常")
    void addTagToTask_alreadyAdded_throws() {
        Tag tag = new Tag();
        tag.setId(10L);
        tag.setUserId(1L);
        when(tagMapper.findById(10L)).thenReturn(tag);
        when(taskTagMapper.findByTaskIdAndTagId(1L, 10L)).thenReturn(new TaskTag());

        assertThatThrownBy(() -> tagService.addTagToTask(1L, 1L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("标签已关联");
    }

    @Test
    @DisplayName("移除任务标签 - 正常")
    void removeTagFromTask_succeeds() {
        TaskTag tt = new TaskTag();
        tt.setId(100L);
        when(taskTagMapper.findByTaskIdAndTagId(1L, 10L)).thenReturn(tt);

        tagService.removeTagFromTask(1L, 1L, 10L);

        verify(taskTagMapper).deleteById(tt.getId());
    }

    @Test
    @DisplayName("获取任务的标签列表")
    void getTaskTags_succeeds() {
        Tag tag = new Tag();
        tag.setId(10L);
        when(taskTagMapper.findTagIdsByTaskId(1L)).thenReturn(List.of(10L));
        when(tagMapper.findAllByIds(List.of(10L))).thenReturn(List.of(tag));

        List<Tag> result = tagService.getTaskTags(1L);

        assertThat(result).hasSize(1);
    }
}

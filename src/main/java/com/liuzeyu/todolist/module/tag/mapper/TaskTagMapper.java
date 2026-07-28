package com.liuzeyu.todolist.module.tag.mapper;

import com.liuzeyu.todolist.module.tag.entity.TaskTag;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 任务-标签关联数据访问层（MyBatis Mapper）
 * <p>
 * 提供关联记录的 CRUD、按任务/标签查询、批量删除等功能。
 */
@Mapper
public interface TaskTagMapper {

    /**
     * 根据 ID 查询关联记录
     *
     * @param id 关联 ID
     * @return 关联记录
     */
    @Select("SELECT * FROM task_tags WHERE id = #{id}")
    TaskTag findById(Long id);

    /**
     * 查询任务的所有标签关联
     *
     * @param taskId 任务 ID
     * @return 关联记录列表
     */
    @Select("SELECT * FROM task_tags WHERE task_id = #{taskId}")
    List<TaskTag> findByTaskId(Long taskId);

    /**
     * 查询标签的所有任务关联
     *
     * @param tagId 标签 ID
     * @return 关联记录列表
     */
    @Select("SELECT * FROM task_tags WHERE tag_id = #{tagId}")
    List<TaskTag> findByTagId(Long tagId);

    /**
     * 查询任务与标签的关联（用于去重）
     *
     * @param taskId 任务 ID
     * @param tagId  标签 ID
     * @return 关联记录，不存在返回 null
     */
    @Select("SELECT * FROM task_tags WHERE task_id = #{taskId} AND tag_id = #{tagId}")
    TaskTag findByTaskIdAndTagId(@Param("taskId") Long taskId, @Param("tagId") Long tagId);

    /**
     * 查询任务的所有标签 ID
     *
     * @param taskId 任务 ID
     * @return 标签 ID 列表
     */
    @Select("SELECT tag_id FROM task_tags WHERE task_id = #{taskId}")
    List<Long> findTagIdsByTaskId(Long taskId);

    /**
     * 插入关联记录
     *
     * @param taskTag 关联实体
     * @return 影响行数
     */
    @Insert("INSERT INTO task_tags(task_id, tag_id, created_at) VALUES(#{taskId}, #{tagId}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(TaskTag taskTag);

    /**
     * 删除关联记录
     *
     * @param id 关联 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM task_tags WHERE id = #{id}")
    int deleteById(Long id);

    /**
     * 删除任务的所有标签关联
     *
     * @param taskId 任务 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM task_tags WHERE task_id = #{taskId}")
    int deleteByTaskId(Long taskId);

    /**
     * 删除标签的所有任务关联
     *
     * @param tagId 标签 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM task_tags WHERE tag_id = #{tagId}")
    int deleteByTagId(Long tagId);
}

package com.liuzeyu.todolist.module.tag.mapper;

import com.liuzeyu.todolist.module.tag.entity.TaskTag;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface TaskTagMapper {

    @Select("SELECT * FROM task_tags WHERE id = #{id}")
    TaskTag findById(Long id);

    @Select("SELECT * FROM task_tags WHERE task_id = #{taskId}")
    List<TaskTag> findByTaskId(Long taskId);

    @Select("SELECT * FROM task_tags WHERE tag_id = #{tagId}")
    List<TaskTag> findByTagId(Long tagId);

    @Select("SELECT * FROM task_tags WHERE task_id = #{taskId} AND tag_id = #{tagId}")
    TaskTag findByTaskIdAndTagId(@Param("taskId") Long taskId, @Param("tagId") Long tagId);

    @Select("SELECT tag_id FROM task_tags WHERE task_id = #{taskId}")
    List<Long> findTagIdsByTaskId(Long taskId);

    @Insert("INSERT INTO task_tags(task_id, tag_id, created_at) VALUES(#{taskId}, #{tagId}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(TaskTag taskTag);

    @Delete("DELETE FROM task_tags WHERE id = #{id}")
    int deleteById(Long id);

    @Delete("DELETE FROM task_tags WHERE task_id = #{taskId}")
    int deleteByTaskId(Long taskId);

    @Delete("DELETE FROM task_tags WHERE tag_id = #{tagId}")
    int deleteByTagId(Long tagId);
}

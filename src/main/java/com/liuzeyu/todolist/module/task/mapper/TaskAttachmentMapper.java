package com.liuzeyu.todolist.module.task.mapper;

import com.liuzeyu.todolist.module.task.entity.TaskAttachment;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface TaskAttachmentMapper {

    @Select("SELECT * FROM task_attachments WHERE id = #{id}")
    TaskAttachment findById(Long id);

    @Select("SELECT * FROM task_attachments WHERE task_id = #{taskId}")
    List<TaskAttachment> findByTaskId(Long taskId);

    @Insert("INSERT INTO task_attachments(task_id, file_name, file_path, file_size, content_type, file_url, created_at) " +
            "VALUES(#{taskId}, #{fileName}, #{filePath}, #{fileSize}, #{contentType}, #{fileUrl}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(TaskAttachment attachment);

    @Delete("DELETE FROM task_attachments WHERE id = #{id}")
    int deleteById(Long id);

    @Delete("DELETE FROM task_attachments WHERE task_id = #{taskId}")
    int deleteByTaskId(Long taskId);
}

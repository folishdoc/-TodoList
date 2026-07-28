package com.liuzeyu.todolist.module.task.mapper;

import com.liuzeyu.todolist.module.task.entity.TaskAttachment;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 任务附件数据访问层（MyBatis Mapper）
 * <p>
 * 提供附件记录的 CRUD 操作。文件物理删除由 FileUploadService 处理。
 */
@Mapper
public interface TaskAttachmentMapper {

    /**
     * 根据 ID 查询附件
     *
     * @param id 附件 ID
     * @return 附件实体
     */
    @Select("SELECT * FROM task_attachments WHERE id = #{id}")
    TaskAttachment findById(Long id);

    /**
     * 查询任务的所有附件
     *
     * @param taskId 任务 ID
     * @return 附件列表
     */
    @Select("SELECT * FROM task_attachments WHERE task_id = #{taskId}")
    List<TaskAttachment> findByTaskId(Long taskId);

    /**
     * 插入附件记录
     *
     * @param attachment 附件实体（插入后 id 被自动回填）
     * @return 影响行数
     */
    @Insert("INSERT INTO task_attachments(task_id, file_name, file_path, file_size, content_type, file_url, created_at) " +
            "VALUES(#{taskId}, #{fileName}, #{filePath}, #{fileSize}, #{contentType}, #{fileUrl}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(TaskAttachment attachment);

    /**
     * 删除附件记录
     *
     * @param id 附件 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM task_attachments WHERE id = #{id}")
    int deleteById(Long id);

    /**
     * 删除任务的所有附件记录
     *
     * @param taskId 任务 ID
     * @return 影响行数
     */
    @Delete("DELETE FROM task_attachments WHERE task_id = #{taskId}")
    int deleteByTaskId(Long taskId);
}

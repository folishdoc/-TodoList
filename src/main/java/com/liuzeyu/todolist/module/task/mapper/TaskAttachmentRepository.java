package com.liuzeyu.todolist.module.task.mapper;

import com.liuzeyu.todolist.module.task.entity.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 任务附件Repository
 */
@Repository
public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, Long> {
    
    List<TaskAttachment> findByTaskId(Long taskId);
    
    void deleteByTaskId(Long taskId);
}
